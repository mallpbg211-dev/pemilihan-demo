-- ====================================================================
-- SKEMA DATABASE SUPABASE: PEMILIHAN PRATAMA PRAMUKA
-- Kontrak Database & Logika Pemilihan Terenkripsi/Anonim
-- ====================================================================

-- 1. TABEL PENGATURAN
create table if not exists public.pengaturan (
    id int primary key default 1 check (id = 1),
    mode text not null default 'demo' check (mode in ('demo', 'asli')),
    status text not null default 'belum_dibuka' check (status in ('belum_dibuka', 'dibuka', 'ditutup')),
    tampilkan_hasil boolean not null default false,
    hasil_langsung boolean not null default false,
    nama_acara text not null default 'Pemilihan Pratama Pramuka',
    buka_pada timestamptz,
    tutup_pada timestamptz
);

-- Pastikan ada 1 baris pengaturan default
insert into public.pengaturan (id, mode, status, tampilkan_hasil, hasil_langsung, nama_acara)
values (1, 'demo', 'dibuka', false, false, 'Pemilihan Pratama Pramuka')
on conflict (id) do nothing;

-- 2. TABEL PASLON (Pasangan Calon Pratama)
create table if not exists public.paslon (
    id serial primary key,
    nomor_urut int unique not null,
    nama_putri text not null,
    nama_putra text not null,
    asal_putri text,
    asal_putra text,
    foto_putri_url text,
    foto_putra_url text,
    visi text not null,
    misi text not null,             -- Satu butir per baris
    program_kerja text not null,    -- Satu butir per baris
    aktif boolean not null default true
);

-- 3. TABEL TOKEN
create table if not exists public.token (
    kode text primary key,
    status text not null default 'aktif' check (status in ('aktif', 'terpakai', 'batal')),
    bukti uuid,
    batch text not null default 'Batch 1',
    dibuat_pada timestamptz not null default now(),
    dipakai_pada timestamptz
);

create index if not exists idx_token_status on public.token(status);
create index if not exists idx_token_batch on public.token(batch);

-- 4. TABEL SUARA (ANONIM PENUH - Tidak ada referensi ke token)
create table if not exists public.suara (
    id serial primary key,
    paslon_id int not null references public.paslon(id) on delete restrict,
    dicatat_pada timestamptz not null -- Dibulatkan ke 10 menit
);

create index if not exists idx_suara_paslon on public.suara(paslon_id);

-- ====================================================================
-- RLS (ROW LEVEL SECURITY)
-- ====================================================================
alter table public.pengaturan enable row level security;
alter table public.paslon enable row level security;
alter table public.token enable row level security;
alter table public.suara enable row level security;

-- Policy Publik: Boleh baca paslon aktif
create policy "Publik baca paslon aktif"
    on public.paslon for select
    using (aktif = true);

-- Policy Admin: Akses penuh bila authenticated
create policy "Admin penuh pengaturan"
    on public.pengaturan for all
    to authenticated
    using (true) with check (true);

create policy "Admin penuh paslon"
    on public.paslon for all
    to authenticated
    using (true) with check (true);

create policy "Admin penuh token"
    on public.token for all
    to authenticated
    using (true) with check (true);

create policy "Admin baca suara"
    on public.suara for select
    to authenticated
    using (true);

-- ====================================================================
-- FUNGSI RPC PUBLIK (Security Definer agar aman tanpa bypass RLS liar)
-- ====================================================================

-- 1. ambil_pengaturan()
create or replace function public.ambil_pengaturan()
returns json
language plpgsql
security definer
as $$
declare
    v_rec record;
    v_now timestamptz := now();
    v_status_efektif text;
begin
    select * into v_rec from public.pengaturan where id = 1;
    if not found then
        return json_build_object(
            'mode', 'demo',
            'status', 'belum_dibuka',
            'nama_acara', 'Pemilihan Pratama Pramuka',
            'tampilkan_hasil', false,
            'hasil_langsung', false,
            'buka_pada', null,
            'tutup_pada', null,
            'waktu_server', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        );
    end if;

    -- Hitung status efektif berdasarkan jam server
    v_status_efektif := v_rec.status;
    if v_rec.status = 'dibuka' then
        if v_rec.buka_pada is not null and v_now < v_rec.buka_pada then
            v_status_efektif := 'belum_dibuka';
        elsif v_rec.tutup_pada is not null and v_now >= v_rec.tutup_pada then
            v_status_efektif := 'ditutup';
        end if;
    end if;

    return json_build_object(
        'mode', v_rec.mode,
        'status', v_status_efektif,
        'nama_acara', v_rec.nama_acara,
        'tampilkan_hasil', v_rec.tampilkan_hasil,
        'hasil_langsung', v_rec.hasil_langsung,
        'buka_pada', v_rec.buka_pada,
        'tutup_pada', v_rec.tutup_pada,
        'waktu_server', to_char(v_now at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
end;
$$;

-- 2. ambil_paslon()
create or replace function public.ambil_paslon()
returns json
language plpgsql
security definer
as $$
declare
    v_data json;
begin
    select coalesce(json_agg(
        json_build_object(
            'id', id,
            'nomor_urut', nomor_urut,
            'nama_putri', nama_putri,
            'nama_putra', nama_putra,
            'asal_putri', asal_putri,
            'asal_putra', asal_putra,
            'foto_putri_url', foto_putri_url,
            'foto_putra_url', foto_putra_url,
            'visi', visi,
            'misi', misi,
            'program_kerja', program_kerja
        ) order by nomor_urut asc
    ), '[]'::json) into v_data
    from public.paslon
    where aktif = true;

    return v_data;
end;
$$;

-- 3. cek_token(p_kode text)
create or replace function public.cek_token(p_kode text)
returns text
language plpgsql
security definer
as $$
declare
    v_pengaturan record;
    v_token record;
    v_clean_kode text;
    v_now timestamptz := now();
begin
    -- Bersihkan kode: huruf besar, hapus spasi dan strip
    v_clean_kode := upper(regexp_replace(coalesce(p_kode, ''), '[\s\-]', '', 'g'));
    if v_clean_kode = '' then
        return 'tidak_valid';
    end if;

    -- Cek status pemilihan
    select * into v_pengaturan from public.pengaturan where id = 1;
    if found then
        if v_pengaturan.status = 'belum_dibuka' then
            return 'belum_dibuka';
        elsif v_pengaturan.status = 'ditutup' then
            return 'ditutup';
        elsif v_pengaturan.status = 'dibuka' then
            if v_pengaturan.buka_pada is not null and v_now < v_pengaturan.buka_pada then
                return 'belum_dibuka';
            elsif v_pengaturan.tutup_pada is not null and v_now >= v_pengaturan.tutup_pada then
                return 'ditutup';
            end if;
        end if;
    end if;

    -- Cari token
    select * into v_token from public.token where kode = v_clean_kode;
    if not found then
        return 'tidak_valid';
    end if;

    if v_token.status = 'batal' then
        return 'batal';
    elsif v_token.status = 'terpakai' then
        return 'terpakai';
    elsif v_token.status = 'aktif' then
        return 'valid';
    else
        return 'tidak_valid';
    end if;
end;
$$;

-- 4. kirim_suara(p_kode text, p_paslon_id int, p_bukti uuid)
create or replace function public.kirim_suara(p_kode text, p_paslon_id int, p_bukti uuid)
returns text
language plpgsql
security definer
as $$
declare
    v_pengaturan record;
    v_token record;
    v_paslon record;
    v_clean_kode text;
    v_now timestamptz := now();
    v_waktu_bulat timestamptz;
begin
    v_clean_kode := upper(regexp_replace(coalesce(p_kode, ''), '[\s\-]', '', 'g'));
    if v_clean_kode = '' or p_paslon_id is null or p_bukti is null then
        return 'tidak_valid';
    end if;

    -- 1. Cek pengaturan waktu
    select * into v_pengaturan from public.pengaturan where id = 1;
    if found then
        if v_pengaturan.status = 'belum_dibuka' then
            return 'belum_dibuka';
        elsif v_pengaturan.status = 'ditutup' then
            return 'ditutup';
        elsif v_pengaturan.status = 'dibuka' then
            if v_pengaturan.buka_pada is not null and v_now < v_pengaturan.buka_pada then
                return 'belum_dibuka';
            elsif v_pengaturan.tutup_pada is not null and v_now >= v_pengaturan.tutup_pada then
                return 'ditutup';
            end if;
        end if;
    end if;

    -- 2. Kunci baris token untuk transaksi aman (Pessimistic lock)
    select * into v_token from public.token where kode = v_clean_kode for update;
    if not found then
        return 'tidak_valid';
    end if;

    -- Idempotency check: jika token sudah terpakai dengan bukti UUID yang sama, anggap sudah tercatat
    if v_token.status = 'terpakai' and v_token.bukti = p_bukti then
        return 'sudah_tercatat';
    end if;

    if v_token.status = 'terpakai' then
        return 'terpakai';
    end if;

    if v_token.status = 'batal' then
        return 'batal';
    end if;

    -- 3. Cek paslon valid dan aktif
    select * into v_paslon from public.paslon where id = p_paslon_id and aktif = true;
    if not found then
        return 'paslon_tidak_valid';
    end if;

    -- 4. Catat suara dengan waktu dibulatkan ke kelipatan 10 menit (Privasi maksimal)
    -- epoch / 600 detik = 10 menit
    v_waktu_bulat := to_timestamp(floor(extract(epoch from v_now) / 600) * 600);

    insert into public.suara (paslon_id, dicatat_pada)
    values (p_paslon_id, v_waktu_bulat);

    -- 5. Perbarui token menjadi terpakai
    update public.token
    set status = 'terpakai',
        bukti = p_bukti,
        dipakai_pada = v_now
    where kode = v_clean_kode;

    return 'ok';
end;
$$;

-- 5. ambil_hasil()
create or replace function public.ambil_hasil()
returns json
language plpgsql
security definer
as $$
declare
    v_peng record;
    v_now timestamptz := now();
    v_status_efektif text;
    v_boleh boolean := false;
    v_sementara boolean := false;
    v_total_suara int := 0;
    v_token_terpakai int := 0;
    v_token_total int := 0;
    v_paslon_data json := '[]'::json;
begin
    select * into v_peng from public.pengaturan where id = 1;
    v_status_efektif := coalesce(v_peng.status, 'belum_dibuka');
    if v_peng.status = 'dibuka' then
        if v_peng.buka_pada is not null and v_now < v_peng.buka_pada then
            v_status_efektif := 'belum_dibuka';
        elsif v_peng.tutup_pada is not null and v_now >= v_peng.tutup_pada then
            v_status_efektif := 'ditutup';
        end if;
    end if;

    -- Hitung kelayakan tampil
    if v_peng.tampilkan_hasil = true and (v_status_efektif = 'ditutup' or v_peng.hasil_langsung = true) then
        v_boleh := true;
    end if;

    if v_boleh and v_status_efektif <> 'ditutup' then
        v_sementara := true;
    end if;

    -- Jika tidak boleh, kembalikan tanpa data suara
    if not v_boleh then
        return json_build_object(
            'boleh', false,
            'sementara', false,
            'paslon', '[]'::json,
            'total_suara', 0,
            'token_terpakai', 0,
            'token_total', 0,
            'status', v_status_efektif
        );
    end if;

    select count(*) into v_total_suara from public.suara;
    select count(*) into v_token_total from public.token;
    select count(*) into v_token_terpakai from public.token where status = 'terpakai';

    select coalesce(json_agg(
        json_build_object(
            'id', p.id,
            'nomor_urut', p.nomor_urut,
            'nama_putri', p.nama_putri,
            'nama_putra', p.nama_putra,
            'foto_putri_url', p.foto_putri_url,
            'foto_putra_url', p.foto_putra_url,
            'suara', coalesce(s.hitung, 0)
        ) order by p.nomor_urut asc
    ), '[]'::json) into v_paslon_data
    from public.paslon p
    left join (
        select paslon_id, count(*) as hitung
        from public.suara
        group by paslon_id
    ) s on s.paslon_id = p.id
    where p.aktif = true;

    return json_build_object(
        'boleh', true,
        'sementara', v_sementara,
        'paslon', v_paslon_data,
        'total_suara', v_total_suara,
        'token_terpakai', v_token_terpakai,
        'token_total', v_token_total,
        'status', v_status_efektif
    );
end;
$$;

-- ====================================================================
-- FUNGSI ADMIN (Dapat dipanggil via auth admin / token)
-- ====================================================================

-- 1. admin_set_pengaturan
create or replace function public.admin_set_pengaturan(
    p_status text,
    p_tampilkan_hasil boolean,
    p_hasil_langsung boolean,
    p_buka_pada timestamptz,
    p_tutup_pada timestamptz
)
returns json
language plpgsql
security definer
as $$
begin
    update public.pengaturan
    set status = coalesce(p_status, status),
        tampilkan_hasil = coalesce(p_tampilkan_hasil, tampilkan_hasil),
        hasil_langsung = coalesce(p_hasil_langsung, hasil_langsung),
        buka_pada = p_buka_pada,
        tutup_pada = p_tutup_pada
    where id = 1;

    return public.ambil_pengaturan();
end;
$$;

-- 2. admin_buat_token
create or replace function public.admin_buat_token(
    p_jumlah int,
    p_batch text
)
returns json
language plpgsql
security definer
as $$
declare
    v_hasil text[] := array[]::text[];
    v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Huruf & angka mudah dibaca tanpa ambigu O/0/1/I
    v_kode text;
    v_i int;
    v_j int;
    v_batch_name text := coalesce(nullif(trim(p_batch), ''), 'Batch Umum');
begin
    if p_jumlah is null or p_jumlah < 1 then
        p_jumlah := 10;
    end if;
    if p_jumlah > 1000 then
        p_jumlah := 1000;
    end if;

    for v_i in 1..p_jumlah loop
        loop
            v_kode := '';
            for v_j in 1..6 loop
                v_kode := v_kode || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
            end loop;
            -- Format rapi: XXX-XXX
            v_kode := substr(v_kode, 1, 3) || '-' || substr(v_kode, 4, 3);

            -- Pastikan unik
            exit when not exists (select 1 from public.token where kode = v_kode);
        end loop;

        insert into public.token (kode, status, batch)
        values (v_kode, 'aktif', v_batch_name);

        v_hasil := array_append(v_hasil, v_kode);
    end loop;

    return to_json(v_hasil);
end;
$$;

-- 3. admin_batalkan_token
create or replace function public.admin_batalkan_token(p_kode text)
returns text
language plpgsql
security definer
as $$
declare
    v_clean text;
begin
    v_clean := upper(regexp_replace(coalesce(p_kode, ''), '[\s\-]', '', 'g'));
    update public.token
    set status = 'batal'
    where upper(regexp_replace(kode, '[\s\-]', '', 'g')) = v_clean
      and status = 'aktif';

    if found then
        return 'ok';
    else
        return 'gagal';
    end if;
end;
$$;

-- 4. admin_daftar_token
create or replace function public.admin_daftar_token()
returns json
language plpgsql
security definer
as $$
begin
    return coalesce(json_agg(
        json_build_object(
            'kode', kode,
            'status', status,
            'batch', batch,
            'dibuat_pada', dibuat_pada,
            'dipakai_pada', dipakai_pada
        ) order by dibuat_pada desc
    ), '[]'::json)
    from public.token;
end;
$$;

-- 5. admin_ringkasan()
create or replace function public.admin_ringkasan()
returns json
language plpgsql
security definer
as $$
declare
    v_total int := 0;
    v_aktif int := 0;
    v_terpakai int := 0;
    v_batal int := 0;
    v_suara int := 0;
begin
    select count(*) into v_total from public.token;
    select count(*) into v_aktif from public.token where status = 'aktif';
    select count(*) into v_terpakai from public.token where status = 'terpakai';
    select count(*) into v_batal from public.token where status = 'batal';
    select count(*) into v_suara from public.suara;

    return json_build_object(
        'token_total', v_total,
        'aktif', v_aktif,
        'terpakai', v_terpakai,
        'batal', v_batal,
        'suara_masuk', v_suara,
        'cocok', (v_terpakai = v_suara)
    );
end;
$$;

-- 6. admin_partisipasi_batch()
create or replace function public.admin_partisipasi_batch()
returns json
language plpgsql
security definer
as $$
begin
    return coalesce(json_agg(
        json_build_object(
            'batch', batch,
            'total', total,
            'terpakai', terpakai,
            'aktif', aktif,
            'batal', batal
        ) order by batch asc
    ), '[]'::json)
    from (
        select
            batch,
            count(*) as total,
            count(*) filter (where status = 'terpakai') as terpakai,
            count(*) filter (where status = 'aktif') as aktif,
            count(*) filter (where status = 'batal') as batal
        from public.token
        group by batch
    ) b;
end;
$$;

-- 7. admin_ekspor_hasil()
create or replace function public.admin_ekspor_hasil()
returns json
language plpgsql
security definer
as $$
declare
    v_total_suara int;
    v_paslon_list json;
begin
    select count(*) into v_total_suara from public.suara;

    select coalesce(json_agg(
        json_build_object(
            'nomor_urut', p.nomor_urut,
            'nama_putri', p.nama_putri,
            'nama_putra', p.nama_putra,
            'asal_putri', p.asal_putri,
            'asal_putra', p.asal_putra,
            'suara', coalesce(s.hitung, 0),
            'persen', case when v_total_suara > 0 then round((coalesce(s.hitung, 0)::numeric / v_total_suara::numeric) * 100, 2) else 0 end
        ) order by p.nomor_urut asc
    ), '[]'::json) into v_paslon_list
    from public.paslon p
    left join (
        select paslon_id, count(*) as hitung
        from public.suara
        group by paslon_id
    ) s on s.paslon_id = p.id
    where p.aktif = true;

    return json_build_object(
        'total_suara', v_total_suara,
        'paslon', v_paslon_list
    );
end;
$$;

-- 8. admin_reset_demo()
create or replace function public.admin_reset_demo()
returns text
language plpgsql
security definer
as $$
declare
    v_mode text;
begin
    select mode into v_mode from public.pengaturan where id = 1;
    if v_mode <> 'demo' then
        return 'bukan_mode_demo';
    end if;

    -- Kosongkan suara dan aktifkan kembali semua token
    truncate table public.suara;
    update public.token set status = 'aktif', bukti = null, dipakai_pada = null;
    return 'ok';
end;
$$;
