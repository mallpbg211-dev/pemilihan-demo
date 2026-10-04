/**
 * LOGIKA INTI BERSAMA - PEMILIHAN PRATAMA PRAMUKA
 * - Panggilan API Supabase (fetch murni, tanpa library)
 * - Mode Tiruan / Demo Lengkap (Simulasi lokal)
 * - Mesin Pengirim Suara Handal (Retry otomatis, idempotensi UUID, timeout 10s)
 * - Hitung Mundur Sinkron Jam Server
 * - Utilitas Pengolahan Foto Klien (Rasio 9:16, max 720x1280, WebP/JPEG < 200KB)
 * - Utilitas Fisher-Yates Shuffle & Ekspor CSV UTF-8 BOM
 */

// KONSTANTA RESMI
const LABEL_PUTRI = "Calon Pratama Putri";
const LABEL_PUTRA = "Calon Pratama Putra";

const PESAN_PEMILIH = {
  tidak_valid: "Token tidak ditemukan. Periksa lagi huruf dan angkanya ya.",
  terpakai: "Token ini sudah dipakai. Hubungi panitia kalau kamu belum memilih.",
  batal: "Token ini sudah tidak berlaku. Minta token pengganti ke panitia.",
  belum_dibuka: "Pemilihan belum dibuka.",
  ditutup: "Pemilihan sudah ditutup.",
  gangguan_jaringan: "Sinyal sedang lemah. Pilihanmu tersimpan di HP ini dan akan dikirim otomatis. Jangan tutup halaman ini.",
  sukses: "Terima kasih! Suaramu sudah tercatat."
};

// SVG POTRET RESMI PRAMUKA (Format 9:16, 720x1280)
function buatSvgPotretPramuka(nomor, jenis, nama) {
  const warnaAksen = nomor === 1 ? '#d4a017' : (nomor === 2 ? '#1b5e20' : '#8e24aa');
  const bgGrad = jenis === 'putri' ? '#6b4324' : '#4a2c16';
  const roleText = jenis === 'putri' ? 'CALON PRATAMA PUTRI' : 'CALON PRATAMA PUTRA';
  const hijabOrHair = jenis === 'putri'
    ? `<path d="M 270 340 Q 360 270 450 340 L 470 540 Q 360 620 250 540 Z" fill="#2b1a0d"/>
       <ellipse cx="360" cy="430" rx="90" ry="115" fill="#fbd3b6"/>`
    : `<circle cx="360" cy="410" r="105" fill="#fbd3b6"/>
       <path d="M 230 360 Q 360 240 490 350 Q 520 400 480 410 L 240 400 Z" fill="#3b2311"/>
       <circle cx="280" cy="365" r="18" fill="${warnaAksen}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1280" width="720" height="1280">
    <defs>
      <linearGradient id="bg_${nomor}_${jenis}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a180e"/>
        <stop offset="50%" stop-color="${bgGrad}"/>
        <stop offset="100%" stop-color="#140a05"/>
      </linearGradient>
      <linearGradient id="kacu" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d32f2f"/>
        <stop offset="50%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#d32f2f"/>
      </linearGradient>
    </defs>
    <rect width="720" height="1280" fill="url(#bg_${nomor}_${jenis})"/>
    
    <circle cx="360" cy="640" r="300" fill="none" stroke="${warnaAksen}" stroke-width="4" opacity="0.15"/>
    <circle cx="360" cy="640" r="340" fill="none" stroke="${warnaAksen}" stroke-width="1.5" stroke-dasharray="10 10" opacity="0.2"/>

    <circle cx="100" cy="110" r="54" fill="${warnaAksen}" stroke="#ffffff" stroke-width="5"/>
    <text x="100" y="128" font-family="sans-serif" font-size="52" font-weight="900" fill="#2a180e" text-anchor="middle">0${nomor}</text>

    <rect x="520" y="80" width="150" height="48" rx="8" fill="rgba(0,0,0,0.5)" stroke="${warnaAksen}" stroke-width="1.5"/>
    <text x="595" y="110" font-family="sans-serif" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">GUDEP 01.00${nomor}</text>

    <g transform="translate(0, 80)">
      <path d="M 170 820 L 220 570 Q 360 550 500 570 L 550 820 Z" fill="#9c7a56"/>
      <path d="M 270 560 L 360 690 L 450 560 Z" fill="#7a5c3a"/>
      <polygon points="310,570 360,740 410,570" fill="url(#kacu)" stroke="#222" stroke-width="1"/>
      <rect x="345" y="660" width="30" height="16" rx="4" fill="#ffd700"/>
      ${hijabOrHair}
      <circle cx="325" cy="425" r="7" fill="#2a180e"/>
      <circle cx="395" cy="425" r="7" fill="#2a180e"/>
      <path d="M 330 460 Q 360 485 390 460" stroke="#a35438" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>

    <rect y="1040" width="720" height="240" fill="rgba(20, 10, 5, 0.85)"/>
    <line x1="0" y1="1040" x2="720" y2="1040" stroke="${warnaAksen}" stroke-width="4"/>
    <text x="360" y="1100" font-family="sans-serif" font-size="24" font-weight="bold" fill="${warnaAksen}" text-anchor="middle" letter-spacing="2">${roleText}</text>
    <text x="360" y="1160" font-family="sans-serif" font-size="36" font-weight="900" fill="#ffffff" text-anchor="middle">${nama}</text>
    <text x="360" y="1210" font-family="sans-serif" font-size="20" fill="#d0c4b6" text-anchor="middle">Pasangan Calon No. Urut ${nomor}</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// 3 PASANGAN CONTOH DENGAN VISI, MISI, PROGRAM KERJA, DAN FOTO POTRET
const DEMO_PASLON_AWAL = [
  {
    id: 1,
    nomor_urut: 1,
    nama_putri: "Aisyah Nur Ramadhani",
    nama_putra: "Muhammad Farhan Pratama",
    asal_putri: "Kelas 8A · Regu Melati",
    asal_putra: "Kelas 8B · Regu Rajawali",
    foto_putri_url: buatSvgPotretPramuka(1, 'putri', "Aisyah N. Ramadhani"),
    foto_putra_url: buatSvgPotretPramuka(1, 'putra', "M. Farhan Pratama"),
    visi: "Mewujudkan Gerakan Pramuka Gugus Depan yang berkarakter tangguh, terampil, mandiri, dan berjiwa sosial tinggi berdasarkan Dasa Darma.",
    misi: "Meningkatkan kedisiplinan dan kehadiran latihan rutin mingguan.\nMengadakan kegiatan bakti sosial dan peduli lingkungan gugus depan.\nMengembangkan keterampilan kepramukaan (scouting skill) modern yang asyik dan menantang.",
    program_kerja: "Perkemahan Sabtu Minggu (Persami) Akbar Gugus Depan.\nLatihan gabungan teknik kepramukaan (pioneering dan semapur kreatif).\nGerakan Pramuka Bersih Lingkungan Sekolah (Scout Clean Campaign).",
    aktif: true
  },
  {
    id: 2,
    nomor_urut: 2,
    nama_putri: "Putri Anindya Zahra",
    nama_putra: "Bima Arya Kusuma",
    asal_putri: "Kelas 8C · Regu Mawar",
    asal_putra: "Kelas 8A · Regu Garuda",
    foto_putri_url: buatSvgPotretPramuka(2, 'putri', "Putri Anindya Zahra"),
    foto_putra_url: buatSvgPotretPramuka(2, 'putra', "Bima Arya Kusuma"),
    visi: "Menjadikan Pramuka sebagai wadah persaudaraan yang ceria, inklusif, berprestasi dalam lomba tingkat, dan mencintai alam semesta.",
    misi: "Menciptakan suasana latihan kepramukaan yang menyenangkan tanpa kekerasan.\nMempersiapkan tim regu berprestasi untuk Lomba Tingkat (LT II & LT III).\nMenanamkan kepemimpinan muda yang solutif dan saling merangkul.",
    program_kerja: "Lomba Asah Terampil Penggalang Ceria antar-regu tiap bulan.\nJelajah Alam dan Orientering di bukit perkemahan.\nPengadaan modul digital saku dan perpustakaan mini kepramukaan.",
    aktif: true
  },
  {
    id: 3,
    nomor_urut: 3,
    nama_putri: "Siti Rahma Azzahra",
    nama_putra: "Rizky Aditya Nugroho",
    asal_putri: "Kelas 8D · Regu Anggrek",
    asal_putra: "Kelas 8C · Regu Elang",
    foto_putri_url: buatSvgPotretPramuka(3, 'putri', "Siti Rahma Azzahra"),
    foto_putra_url: buatSvgPotretPramuka(3, 'putra', "Rizky Aditya Nugroho"),
    visi: "Membangun kepanduan yang inovatif, sigap tanggap bencana, dan berakhlak mulia di era digital.",
    misi: "Melatih kesiapsiagaan P3K dan tanggap darurat bencana untuk seluruh anggota.\nMenjalin keakraban lintas regu putra dan putri secara sportif.\nMengajak anggota pramuka bijak bermedia sosial dan berprestasi.",
    program_kerja: "Pelatihan First-Aid dan Simulasi Evakuasi Bencana.\nScout Adventure Camp & Api Unggun Harmoni.\nPembuatan buletin karya regu dan dokumentasi kegiatan kepramukaan.",
    aktif: true
  }
];

const KUNCI_STORAGE = {
  PENGATURAN: 'pramuka_db_pengaturan',
  PASLON: 'pramuka_db_paslon',
  TOKEN: 'pramuka_db_token',
  SUARA: 'pramuka_db_suara',
  PENDING_VOTE: 'pramuka_pending_vote',
  ADMIN_SESSION: 'pramuka_admin_session_token'
};

function inisialisasiDbTiruanJikaPerlu() {
  if (!localStorage.getItem(KUNCI_STORAGE.PENGATURAN)) {
    const pengaturanAwal = {
      id: 1,
      mode: 'tiruan',
      status: 'dibuka',
      tampilkan_hasil: false,
      hasil_langsung: false,
      nama_acara: (window.CONFIG && window.CONFIG.NAMA_ACARA) || 'Pemilihan Pratama Pramuka',
      buka_pada: null,
      tutup_pada: null
    };
    localStorage.setItem(KUNCI_STORAGE.PENGATURAN, JSON.stringify(pengaturanAwal));
  }

  if (!localStorage.getItem(KUNCI_STORAGE.PASLON)) {
    localStorage.setItem(KUNCI_STORAGE.PASLON, JSON.stringify(DEMO_PASLON_AWAL));
  }

  if (!localStorage.getItem(KUNCI_STORAGE.TOKEN)) {
    const tokenAwal = [];
    const batches = [
      { nama: "Batch 1 - Kelas 7", awalan: "PRM-70", jumlah: 10 },
      { nama: "Batch 2 - Kelas 8", awalan: "PRM-80", jumlah: 10 },
      { nama: "Batch 3 - Kelas 9", awalan: "PRM-90", jumlah: 10 }
    ];

    batches.forEach(b => {
      for (let i = 1; i <= b.jumlah; i++) {
        tokenAwal.push({
          kode: b.awalan + (i < 10 ? '0' + i : i),
          status: 'aktif',
          bukti: null,
          batch: b.nama,
          dibuat_pada: new Date(Date.now() - 3600000).toISOString(),
          dipakai_pada: null
        });
      }
    });

    localStorage.setItem(KUNCI_STORAGE.TOKEN, JSON.stringify(tokenAwal));
  }

  if (!localStorage.getItem(KUNCI_STORAGE.SUARA)) {
    localStorage.setItem(KUNCI_STORAGE.SUARA, JSON.stringify([]));
  }
}

function apakahModeTiruan() {
  const config = window.CONFIG || {};
  if (config.MODE === 'tiruan' || config.MODE === 'demo') return true;
  if (!config.SUPABASE_URL || config.SUPABASE_URL === 'ISI_URL_PROYEK') return true;
  return false;
}

function ambilDariStorage(kunci, nilaiBawaan) {
  try {
    const data = localStorage.getItem(kunci);
    return data ? JSON.parse(data) : nilaiBawaan;
  } catch (e) {
    return nilaiBawaan;
  }
}

function simpanKeStorage(kunci, nilai) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
    return true;
  } catch (e) {
    return false;
  }
}

function buatUUID() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
      ].join('-');
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function bulatkanWaktuKe10Menit(tanggal) {
  const t = tanggal instanceof Date ? tanggal : new Date(tanggal);
  const ms = 10 * 60 * 1000;
  return new Date(Math.floor(t.getTime() / ms) * ms).toISOString();
}

// PANGGILAN RPC KE SUPABASE REST API
async function panggilRPC(namaFungsi, parameter = {}, tokenAdmin = null) {
  if (apakahModeTiruan()) {
    inisialisasiDbTiruanJikaPerlu();
    return await simulasiEksekusiRPC(namaFungsi, parameter);
  }

  const config = window.CONFIG;
  const url = `${config.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/rpc/${namaFungsi}`;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': config.SUPABASE_KEY
  };

  // Header Bearer hanya untuk JWT atau token admin login
  if (tokenAdmin) {
    headers['Authorization'] = `Bearer ${tokenAdmin}`;
  } else if (config.SUPABASE_KEY && config.SUPABASE_KEY.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${config.SUPABASE_KEY}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const respon = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(parameter),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!respon.ok) {
      const teksError = await respon.text();
      const err = new Error(`HTTP ${respon.status}: ${teksError}`);
      err.status = respon.status;
      throw err;
    }

    const data = await respon.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// SIMULASI EKSEKUSI RPC DI MODE TIRUAN
async function simulasiEksekusiRPC(namaFungsi, param) {
  await new Promise(r => setTimeout(r, 100));

  const peng = ambilDariStorage(KUNCI_STORAGE.PENGATURAN, {});
  const paslonList = ambilDariStorage(KUNCI_STORAGE.PASLON, []);
  const tokenList = ambilDariStorage(KUNCI_STORAGE.TOKEN, []);
  const suaraList = ambilDariStorage(KUNCI_STORAGE.SUARA, []);

  const sekarang = new Date();
  let statusEfektif = peng.status || 'belum_dibuka';

  if (peng.status === 'dibuka') {
    if (peng.buka_pada && sekarang < new Date(peng.buka_pada)) {
      statusEfektif = 'belum_dibuka';
    } else if (peng.tutup_pada && sekarang >= new Date(peng.tutup_pada)) {
      statusEfektif = 'ditutup';
    }
  }

  switch (namaFungsi) {
    case 'ambil_pengaturan':
      return {
        mode: peng.mode || 'tiruan',
        status: statusEfektif,
        nama_acara: peng.nama_acara || 'Pemilihan Pratama Pramuka',
        tampilkan_hasil: !!peng.tampilkan_hasil,
        hasil_langsung: !!peng.hasil_langsung,
        buka_pada: peng.buka_pada || null,
        tutup_pada: peng.tutup_pada || null,
        waktu_server: sekarang.toISOString()
      };

    case 'ambil_paslon':
      return paslonList
        .filter(p => p.aktif !== false)
        .sort((a, b) => a.nomor_urut - b.nomor_urut)
        .map(p => ({
          id: p.id,
          nomor_urut: p.nomor_urut,
          nama_putri: p.nama_putri,
          nama_putra: p.nama_putra,
          asal_putri: p.asal_putri,
          asal_putra: p.asal_putra,
          foto_putri_url: p.foto_putri_url,
          foto_putra_url: p.foto_putra_url,
          visi: p.visi,
          misi: p.misi,
          program_kerja: p.program_kerja
        }));

    case 'cek_token': {
      const cleanKode = (param.p_kode || '').toUpperCase().replace(/[\s\-]/g, '');
      if (!cleanKode) return 'tidak_valid';

      if (statusEfektif === 'belum_dibuka') return 'belum_dibuka';
      if (statusEfektif === 'ditutup') return 'ditutup';

      const t = tokenList.find(x => x.kode.toUpperCase().replace(/[\s\-]/g, '') === cleanKode);
      if (!t) return 'tidak_valid';
      if (t.status === 'batal') return 'batal';
      if (t.status === 'terpakai') return 'terpakai';
      if (t.status === 'aktif') return 'valid';
      return 'tidak_valid';
    }

    case 'kirim_suara': {
      const cleanKode = (param.p_kode || '').toUpperCase().replace(/[\s\-]/g, '');
      if (!cleanKode || !param.p_paslon_id || !param.p_bukti) return 'tidak_valid';

      if (statusEfektif === 'belum_dibuka') return 'belum_dibuka';
      if (statusEfektif === 'ditutup') return 'ditutup';

      const t = tokenList.find(x => x.kode.toUpperCase().replace(/[\s\-]/g, '') === cleanKode);
      if (!t) return 'tidak_valid';

      // Idempotency: jika token sudah tercatat dengan UUID bukti sama
      if (t.status === 'terpakai' && t.bukti === param.p_bukti) {
        return 'sudah_tercatat';
      }

      if (t.status === 'terpakai') return 'terpakai';
      if (t.status === 'batal') return 'batal';

      const pas = paslonList.find(p => p.id === param.p_paslon_id && p.aktif !== false);
      if (!pas) return 'paslon_tidak_valid';

      // Suara tercatat dengan waktu dibulatkan 10 menit
      const waktuBulat = bulatkanWaktuKe10Menit(sekarang);
      suaraList.push({
        id: suaraList.length + 1,
        paslon_id: param.p_paslon_id,
        dicatat_pada: waktuBulat
      });
      simpanKeStorage(KUNCI_STORAGE.SUARA, suaraList);

      t.status = 'terpakai';
      t.bukti = param.p_bukti;
      t.dipakai_pada = sekarang.toISOString();
      simpanKeStorage(KUNCI_STORAGE.TOKEN, tokenList);

      return 'ok';
    }

    case 'ambil_hasil': {
      let boleh = false;
      if (peng.tampilkan_hasil && (statusEfektif === 'ditutup' || peng.hasil_langsung)) {
        boleh = true;
      }
      const sementara = boleh && statusEfektif !== 'ditutup';

      if (!boleh) {
        return {
          boleh: false,
          sementara: false,
          paslon: [],
          total_suara: 0,
          token_terpakai: 0,
          token_total: 0,
          status: statusEfektif
        };
      }

      const countMap = {};
      suaraList.forEach(s => {
        countMap[s.paslon_id] = (countMap[s.paslon_id] || 0) + 1;
      });

      const paslonHasil = paslonList
        .filter(p => p.aktif !== false)
        .sort((a, b) => a.nomor_urut - b.nomor_urut)
        .map(p => ({
          id: p.id,
          nomor_urut: p.nomor_urut,
          nama_putri: p.nama_putri,
          nama_putra: p.nama_putra,
          foto_putri_url: p.foto_putri_url,
          foto_putra_url: p.foto_putra_url,
          suara: countMap[p.id] || 0
        }));

      const terpakai = tokenList.filter(t => t.status === 'terpakai').length;

      return {
        boleh: true,
        sementara: sementara,
        paslon: paslonHasil,
        total_suara: suaraList.length,
        token_terpakai: terpakai,
        token_total: tokenList.length,
        status: statusEfektif
      };
    }

    case 'admin_set_pengaturan': {
      peng.status = param.p_status !== undefined ? param.p_status : peng.status;
      peng.tampilkan_hasil = param.p_tampilkan_hasil !== undefined ? !!param.p_tampilkan_hasil : peng.tampilkan_hasil;
      peng.hasil_langsung = param.p_hasil_langsung !== undefined ? !!param.p_hasil_langsung : peng.hasil_langsung;
      peng.buka_pada = param.p_buka_pada !== undefined ? param.p_buka_pada : peng.buka_pada;
      peng.tutup_pada = param.p_tutup_pada !== undefined ? param.p_tutup_pada : peng.tutup_pada;
      simpanKeStorage(KUNCI_STORAGE.PENGATURAN, peng);
      return await simulasiEksekusiRPC('ambil_pengaturan', {});
    }

    case 'admin_buat_token': {
      const jml = Math.min(Math.max(parseInt(param.p_jumlah, 10) || 10, 1), 1000);
      const batchName = (param.p_batch || '').trim() || 'Batch Baru';
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      const hasil = [];

      for (let i = 0; i < jml; i++) {
        let kodeBaru = '';
        do {
          kodeBaru = '';
          for (let c = 0; c < 6; c++) {
            kodeBaru += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          kodeBaru = kodeBaru.substring(0, 3) + '-' + kodeBaru.substring(3, 6);
        } while (tokenList.some(t => t.kode === kodeBaru));

        tokenList.push({
          kode: kodeBaru,
          status: 'aktif',
          bukti: null,
          batch: batchName,
          dibuat_pada: new Date().toISOString(),
          dipakai_pada: null
        });
        hasil.push(kodeBaru);
      }

      simpanKeStorage(KUNCI_STORAGE.TOKEN, tokenList);
      return hasil;
    }

    case 'admin_batalkan_token': {
      const clean = (param.p_kode || '').toUpperCase().replace(/[\s\-]/g, '');
      const t = tokenList.find(x => x.kode.toUpperCase().replace(/[\s\-]/g, '') === clean);
      if (t && t.status === 'aktif') {
        t.status = 'batal';
        simpanKeStorage(KUNCI_STORAGE.TOKEN, tokenList);
        return 'ok';
      }
      return 'gagal';
    }

    case 'admin_daftar_token':
      return tokenList.map(t => ({
        kode: t.kode,
        status: t.status,
        batch: t.batch,
        dibuat_pada: t.dibuat_pada,
        dipakai_pada: t.dipakai_pada
      }));

    case 'admin_ringkasan': {
      const total = tokenList.length;
      const aktif = tokenList.filter(t => t.status === 'aktif').length;
      const terpakai = tokenList.filter(t => t.status === 'terpakai').length;
      const batal = tokenList.filter(t => t.status === 'batal').length;
      const suaraMasuk = suaraList.length;
      return {
        token_total: total,
        aktif: aktif,
        terpakai: terpakai,
        batal: batal,
        suara_masuk: suaraMasuk,
        cocok: (terpakai === suaraMasuk)
      };
    }

    case 'admin_partisipasi_batch': {
      const batchMap = {};
      tokenList.forEach(t => {
        const b = t.batch || 'Batch Umum';
        if (!batchMap[b]) {
          batchMap[b] = { batch: b, total: 0, terpakai: 0, aktif: 0, batal: 0 };
        }
        batchMap[b].total++;
        if (t.status === 'terpakai') batchMap[b].terpakai++;
        else if (t.status === 'aktif') batchMap[b].aktif++;
        else if (t.status === 'batal') batchMap[b].batal++;
      });
      return Object.values(batchMap).sort((a, b) => a.batch.localeCompare(b.batch));
    }

    case 'admin_ekspor_hasil': {
      const countMap = {};
      suaraList.forEach(s => {
        countMap[s.paslon_id] = (countMap[s.paslon_id] || 0) + 1;
      });
      const total = suaraList.length;
      const pas = paslonList
        .filter(p => p.aktif !== false)
        .sort((a, b) => a.nomor_urut - b.nomor_urut)
        .map(p => {
          const suara = countMap[p.id] || 0;
          const persen = total > 0 ? Number(((suara / total) * 100).toFixed(2)) : 0;
          return {
            nomor_urut: p.nomor_urut,
            nama_putri: p.nama_putri,
            nama_putra: p.nama_putra,
            asal_putri: p.asal_putri,
            asal_putra: p.asal_putra,
            suara: suara,
            persen: persen
          };
        });
      return {
        total_suara: total,
        paslon: pas
      };
    }

    case 'admin_simpan_paslon': {
      // Simpan / Tambah Paslon baru di mode tiruan
      const pData = param.paslon;
      if (!pData) return { ok: false, pesan: "Data paslon kosong" };

      // Validasi nomor urut unik
      const nomorAda = paslonList.find(p => p.nomor_urut === pData.nomor_urut && p.id !== pData.id);
      if (nomorAda) {
        return { ok: false, pesan: `Nomor urut ${pData.nomor_urut} sudah dipakai oleh pasangan lain.` };
      }

      if (pData.id) {
        const idx = paslonList.findIndex(p => p.id === pData.id);
        if (idx >= 0) {
          const paslonLama = paslonList[idx];
          const adaSuara = suaraList.some(s => s.paslon_id === pData.id);
          if (adaSuara && paslonLama.nomor_urut !== pData.nomor_urut) {
            return { ok: false, pesan: "Nomor urut tidak dapat diubah karena pasangan calon ini sudah memiliki suara masuk." };
          }
          paslonList[idx] = { ...paslonList[idx], ...pData };
        }
      } else {
        const newId = (paslonList.reduce((max, p) => Math.max(max, p.id || 0), 0)) + 1;
        paslonList.push({ ...pData, id: newId });
      }
      simpanKeStorage(KUNCI_STORAGE.PASLON, paslonList);
      return { ok: true };
    }

    case 'admin_reset_demo': {
      simpanKeStorage(KUNCI_STORAGE.SUARA, []);
      const resetTokens = tokenList.map(t => ({
        ...t,
        status: 'aktif',
        bukti: null,
        dipakai_pada: null
      }));
      simpanKeStorage(KUNCI_STORAGE.TOKEN, resetTokens);
      return 'ok';
    }

    default:
      throw new Error(`Fungsi RPC tidak dikenal: ${namaFungsi}`);
  }
}

// MESIN HITUNG MUNDUR SINKRON JAM SERVER
class PengelolaHitungMundur {
  constructor(padaUpdate, padaSelesai) {
    this.selisihServerMs = 0;
    this.targetWaktuMs = null;
    this.tipeTarget = null;
    this.intervalId = null;
    this.padaUpdate = padaUpdate;
    this.padaSelesai = padaSelesai;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.hentikan();
      } else {
        if (this.targetWaktuMs) {
          this.mulaiLoop();
        }
      }
    });
  }

  aturWaktuServer(waktuServerISO, bukaPadaISO, tutupPadaISO, status) {
    if (waktuServerISO) {
      const serverMs = Date.parse(waktuServerISO);
      if (!isNaN(serverMs)) {
        this.selisihServerMs = serverMs - Date.now();
      }
    }

    const sekarangServer = Date.now() + this.selisihServerMs;

    this.hentikan();
    this.targetWaktuMs = null;
    this.tipeTarget = null;

    if (bukaPadaISO && status === 'belum_dibuka') {
      const target = Date.parse(bukaPadaISO);
      if (!isNaN(target) && target > sekarangServer) {
        this.targetWaktuMs = target;
        this.tipeTarget = 'buka';
      }
    } else if (tutupPadaISO && status === 'dibuka') {
      const target = Date.parse(tutupPadaISO);
      if (!isNaN(target) && target > sekarangServer) {
        this.targetWaktuMs = target;
        this.tipeTarget = 'tutup';
      }
    }

    if (this.targetWaktuMs) {
      this.mulaiLoop();
    } else if (this.padaUpdate) {
      this.padaUpdate(null);
    }
  }

  mulaiLoop() {
    this.hentikan();
    this.detikkan();
    this.intervalId = setInterval(() => this.detikkan(), 1000);
  }

  detikkan() {
    if (!this.targetWaktuMs) return;

    const sekarangServer = Date.now() + this.selisihServerMs;
    const sisaMs = this.targetWaktuMs - sekarangServer;

    if (sisaMs <= 0) {
      this.hentikan();
      if (this.padaUpdate) this.padaUpdate(null);
      if (this.padaSelesai) this.padaSelesai();
      return;
    }

    const sisaDetik = Math.floor(sisaMs / 1000);
    const hari = Math.floor(sisaDetik / 86400);
    const jam = Math.floor((sisaDetik % 86400) / 3600);
    const menit = Math.floor((sisaDetik % 3600) / 60);
    const detik = sisaDetik % 60;

    let formatTeks = '';
    if (hari > 0) {
      formatTeks = `${hari} hari ${jam} jam ${menit} menit`;
    } else if (jam > 0) {
      formatTeks = `${jam} jam ${menit} menit`;
    } else if (menit > 0) {
      formatTeks = `${menit} menit ${detik} detik`;
    } else {
      formatTeks = `${detik} detik`;
    }

    const pesan = this.tipeTarget === 'buka'
      ? `Pemilihan dibuka dalam ${formatTeks}`
      : `Pemilihan ditutup dalam ${formatTeks}`;

    if (this.padaUpdate) {
      this.padaUpdate({
        teks: pesan,
        tipe: this.tipeTarget,
        sisaDetik: sisaDetik
      });
    }
  }

  hentikan() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// MESIN PENGIRIM SUARA HANDAL (RETRY 2s, 5s, 10s, 20s)
class PengirimSuaraHandal {
  constructor(callbacks = {}) {
    this.onStatus = callbacks.onStatus || (() => {});
    this.onSukses = callbacks.onSukses || (() => {});
    this.onGagalFinal = callbacks.onGagalFinal || (() => {});
    this.timerRetry = null;
    this.sedangMengirim = false;
    this.jedaDaftar = [2000, 5000, 10000, 20000];
    this.indeksJeda = 0;
  }

  ambilPending() {
    return ambilDariStorage(KUNCI_STORAGE.PENDING_VOTE, null);
  }

  simpanPending(data) {
    simpanKeStorage(KUNCI_STORAGE.PENDING_VOTE, data);
  }

  hapusPending() {
    try {
      localStorage.removeItem(KUNCI_STORAGE.PENDING_VOTE);
    } catch (e) {}
  }

  mulaiKirim(kode, paslonId) {
    let pending = this.ambilPending();
    if (!pending || pending.kode !== kode || pending.paslon_id !== paslonId) {
      const bukti = buatUUID();
      pending = {
        kode: kode,
        paslon_id: paslonId,
        bukti: bukti,
        dibuat_pada: Date.now()
      };
      this.simpanPending(pending);
    }

    this.indeksJeda = 0;
    this.eksekusiKirim(pending);
  }

  cobaLagiSekarang() {
    if (this.timerRetry) {
      clearTimeout(this.timerRetry);
      this.timerRetry = null;
    }
    const pending = this.ambilPending();
    if (pending) {
      this.eksekusiKirim(pending);
    }
  }

  async eksekusiKirim(pending) {
    if (this.sedangMengirim) return;
    this.sedangMengirim = true;

    this.onStatus({
      status: 'mengirim',
      pesan: 'Mengirim suaramu ke panitia...'
    });

    try {
      const hasil = await panggilRPC('kirim_suara', {
        p_kode: pending.kode,
        p_paslon_id: pending.paslon_id,
        p_bukti: pending.bukti
      });

      this.sedangMengirim = false;

      if (hasil === 'ok' || hasil === 'sudah_tercatat') {
        this.hapusPending();
        this.onSukses(hasil);
        return;
      }

      const pesanError = PESAN_PEMILIH[hasil] || `Gagal: ${hasil}`;
      this.hapusPending();
      this.onGagalFinal({
        kodeHasil: hasil,
        pesan: pesanError
      });
    } catch (error) {
      this.sedangMengirim = false;

      const jedaMs = this.jedaDaftar[this.indeksJeda] || 20000;
      if (this.indeksJeda < this.jedaDaftar.length - 1) {
        this.indeksJeda++;
      }

      this.onStatus({
        status: 'retry',
        pesan: PESAN_PEMILIH.gangguan_jaringan,
        jedaDetik: Math.round(jedaMs / 1000)
      });

      this.timerRetry = setTimeout(() => {
        const dataPending = this.ambilPending();
        if (dataPending) {
          this.eksekusiKirim(dataPending);
        }
      }, jedaMs);
    }
  }

  batalSemua() {
    if (this.timerRetry) {
      clearTimeout(this.timerRetry);
      this.timerRetry = null;
    }
    this.sedangMengirim = false;
  }
}

// PENGOLAHAN FOTO KLIEN (Rasio 9:16, max 720x1280, WebP/JPEG, < 200KB)
async function olahFotoKlien(file, cropBox = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const asliLebar = img.naturalWidth;
        const asliTinggi = img.naturalHeight;
        const resolusiRendah = (asliLebar < 720 || asliTinggi < 1280);

        // Target rasio 9:16
        const targetW = 720;
        const targetH = 1280;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        // Hitung crop tengah jika cropBox tidak disediakan
        let sx, sy, sw, sh;
        if (cropBox) {
          sx = cropBox.x;
          sy = cropBox.y;
          sw = cropBox.w;
          sh = cropBox.h;
        } else {
          const rasioTarget = 9 / 16;
          const rasioAsli = asliLebar / asliTinggi;

          if (rasioAsli > rasioTarget) {
            sh = asliTinggi;
            sw = sh * rasioTarget;
            sx = (asliLebar - sw) / 2;
            sy = 0;
          } else {
            sw = asliLebar;
            sh = sw / rasioTarget;
            sx = 0;
            sy = (asliTinggi - sh) / 4; // Sedikit lebih ke atas agar kepala tidak terpotong
          }
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

        // Kompresi bertahap mulai kualitas 0.82 sampai < 200 KB
        let format = 'image/webp';
        let kualitas = 0.82;

        function cobaKompres() {
          canvas.toBlob((blob) => {
            if (!blob) {
              // Cadangan JPEG bila WebP gagal
              if (format === 'image/webp') {
                format = 'image/jpeg';
                kualitas = 0.82;
                cobaKompres();
                return;
              }
              reject(new Error("Gagal mengolah gambar"));
              return;
            }

            const ukuranKB = blob.size / 1024;
            if (ukuranKB > 200 && kualitas > 0.4) {
              kualitas -= 0.1;
              cobaKompres();
            } else {
              const dataUrl = canvas.toDataURL(format, kualitas);
              resolve({
                blob: blob,
                dataUrl: dataUrl,
                ukuranKB: Math.round(ukuranKB),
                format: format,
                resolusiRendah: resolusiRendah
              });
            }
          }, format, kualitas);
        }

        cobaKompres();
      };
      img.onerror = () => reject(new Error("File bukan gambar yang valid."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

// FISHER-YATES SHUFFLE UNTUK CETAK KUPON ACAK
function acakFisherYates(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// FORMAT WAKTU INDONESIA
function formatWaktuIndo(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
}

function pasangBannerDemoJikaPerlu() {
  if (apakahModeTiruan()) {
    let banner = document.getElementById('banner-demo');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'banner-demo';
      banner.className = 'banner-demo';
      banner.textContent = 'MODE PERCOBAAN / TIRUAN';
      document.body.prepend(banner);
    }
  } else {
    const banner = document.getElementById('banner-demo');
    if (banner) banner.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  pasangBannerDemoJikaPerlu();
});
