/**
 * LOGIKA HALAMAN HASIL (HASIL.HTML)
 * Menampilkan hasil sementara atau hasil akhir, mode proyektor, grafik horizontal, dan penanda pemenang/seri.
 */

document.addEventListener('DOMContentLoaded', () => {
  let timerRefresh = null;
  let intervalDetikRefresh = null;
  let sisaDetikRefresh = 10;
  let jedaRefreshDetik = 10;
  let pengelolaHitungMundur = null;
  let modeProyektorAktif = false;

  // DOM
  const kotakHitungMundur = document.getElementById('kotak-hitung-mundur');
  const teksHitungMundur = document.getElementById('teks-hitung-mundur');

  const judulStatusHasil = document.getElementById('judul-status-hasil');
  const subStatusHasil = document.getElementById('sub-status-hasil');
  const teksTerakhirDiperbarui = document.getElementById('teks-terakhir-diperbarui');

  const wadahHasilTerkunci = document.getElementById('wadah-hasil-terkunci');
  const wadahHasilTerbuka = document.getElementById('wadah-hasil-terbuka');

  const statTotalSuara = document.getElementById('stat-total-suara');
  const statTokenTerpakai = document.getElementById('stat-token-terpakai');
  const statPersenPartisipasi = document.getElementById('stat-persen-partisipasi');
  const wadahGrafikPaslon = document.getElementById('wadah-grafik-paslon');
  const teksTimerAutoRefresh = document.getElementById('teks-timer-auto-refresh');
  const btnModeProyektor = document.getElementById('btn-mode-proyektor');
  const wadahKontenHasil = document.getElementById('wadah-konten-hasil');

  // HITUNG MUNDUR SINKRON
  pengelolaHitungMundur = new PengelolaHitungMundur(
    (info) => {
      if (info && info.teks) {
        kotakHitungMundur.style.display = 'flex';
        teksHitungMundur.textContent = info.teks;
      } else {
        kotakHitungMundur.style.display = 'none';
      }
    },
    () => {
      muatDataHasil();
    }
  );

  // VISIBILITY CHANGE HANDLER: Berhenti saat tab tidak terlihat
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (timerRefresh) clearTimeout(timerRefresh);
      if (intervalDetikRefresh) clearInterval(intervalDetikRefresh);
    } else {
      muatDataHasil();
    }
  });

  function formatPersenIndo(angka) {
    const n = parseFloat(angka) || 0;
    return n.toFixed(1).replace('.', ',') + '%';
  }

  async function muatPengaturanHeader() {
    try {
      const data = await panggilRPC('ambil_pengaturan');
      if (data.nama_acara) {
        const elJudul = document.getElementById('judul-acara-header');
        if (elJudul) elJudul.textContent = data.nama_acara;
      }
      const elGudepHeader = document.getElementById('subjudul-gudep-header');
      if (elGudepHeader && window.CONFIG && window.CONFIG.NAMA_GUDEP) {
        elGudepHeader.textContent = window.CONFIG.NAMA_GUDEP;
      }
      const elNamaGudepHasil = document.getElementById('nama-gudep-hasil');
      if (elNamaGudepHasil && window.CONFIG && window.CONFIG.NAMA_GUDEP) {
        elNamaGudepHasil.textContent = window.CONFIG.NAMA_GUDEP;
      }
      pengelolaHitungMundur.aturWaktuServer(
        data.waktu_server,
        data.buka_pada,
        data.tutup_pada,
        data.status
      );
    } catch (e) {}
  }

  async function muatDataHasil() {
    try {
      const hasil = await panggilRPC('ambil_hasil');
      await muatPengaturanHeader();

      const waktuSekarang = new Date();
      teksTerakhirDiperbarui.textContent = `Terakhir diperbarui: ${waktuSekarang.toTimeString().split(' ')[0]}`;

      if (!hasil.boleh) {
        wadahHasilTerkunci.style.display = 'block';
        wadahHasilTerbuka.style.display = 'none';
        judulStatusHasil.textContent = 'Hasil Belum Ditampilkan';
        subStatusHasil.textContent = 'Hasil akan ditampilkan setelah pemilihan resmi ditutup oleh panitia.';
        aturJedaRefresh(30);
        return;
      }

      wadahHasilTerkunci.style.display = 'none';
      wadahHasilTerbuka.style.display = 'block';

      if (hasil.sementara) {
        judulStatusHasil.textContent = 'HASIL SEMENTARA — Pemilihan Masih Berjalan';
        judulStatusHasil.style.color = 'var(--peringatan)';
        subStatusHasil.textContent = 'Data perolehan suara diperbarui secara otomatis.';
        aturJedaRefresh(10);
      } else {
        judulStatusHasil.textContent = 'HASIL AKHIR';
        judulStatusHasil.style.color = 'var(--utama)';
        subStatusHasil.textContent = 'Sesi pemilihan telah ditutup. Hasil perolehan bersifat resmi dan final.';
        aturJedaRefresh(30);
      }

      const totalSuara = hasil.total_suara || 0;
      const tokenTerpakai = hasil.token_terpakai || 0;
      const tokenTotal = hasil.token_total || 0;
      const persenPartisipasiVal = tokenTotal > 0 ? (tokenTerpakai / tokenTotal) * 100 : 0;

      statTotalSuara.textContent = totalSuara.toLocaleString('id-ID');
      statTokenTerpakai.textContent = `${tokenTerpakai} / ${tokenTotal}`;
      statPersenPartisipasi.textContent = formatPersenIndo(persenPartisipasiVal);

      renderGrafik(hasil.paslon || [], totalSuara, hasil.status === 'ditutup' && !hasil.sementara);

    } catch (error) {
      aturJedaRefresh(20);
    }
  }

  function renderGrafik(paslonList, totalSuara, statusTutupFinal) {
    wadahGrafikPaslon.innerHTML = '';

    if (!paslonList || paslonList.length === 0) {
      wadahGrafikPaslon.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--teks-pudar);">Belum ada data suara.</div>';
      return;
    }

    // Deteksi Pemenang / Seri jika status sudah ditutup final
    let suaraTertinggi = -1;
    let jumlahPemenang = 0;
    if (statusTutupFinal && totalSuara > 0) {
      paslonList.forEach(p => {
        const s = p.suara || 0;
        if (s > suaraTertinggi) {
          suaraTertinggi = s;
          jumlahPemenang = 1;
        } else if (s === suaraTertinggi) {
          jumlahPemenang++;
        }
      });
    }

    const apakahKondisiSeri = statusTutupFinal && totalSuara > 0 && jumlahPemenang > 1;

    paslonList.forEach(p => {
      const suara = p.suara || 0;
      const persenVal = totalSuara > 0 ? (suara / totalSuara) * 100 : 0;
      const persenTeks = formatPersenIndo(persenVal);
      const suaraTeks = `${suara.toLocaleString('id-ID')} suara`;

      const apakahPemenangTunggal = statusTutupFinal && totalSuara > 0 && suara === suaraTertinggi && jumlahPemenang === 1;
      const apakahPemenangSeri = statusTutupFinal && totalSuara > 0 && suara === suaraTertinggi && jumlahPemenang > 1;

      const item = document.createElement('div');
      item.className = `bar-hasil-item ${apakahPemenangTunggal ? 'menang' : ''}`;

      // 1. BARIS ATAS: DUA FOTO BERDAMPINGAN + IDENTITAS PASLON
      const barisAtas = document.createElement('div');
      barisAtas.className = 'hasil-baris-atas';

      const fotoDuo = document.createElement('div');
      fotoDuo.className = 'hasil-foto-duo';

      if (p.foto_putri_url) {
        fotoDuo.innerHTML += `<img src="${p.foto_putri_url}" class="hasil-foto-pasangan" alt="Foto Putri">`;
      } else {
        fotoDuo.innerHTML += `<div class="hasil-foto-placeholder">Putri</div>`;
      }

      if (p.foto_putra_url) {
        fotoDuo.innerHTML += `<img src="${p.foto_putra_url}" class="hasil-foto-pasangan" alt="Foto Putra">`;
      } else {
        fotoDuo.innerHTML += `<div class="hasil-foto-placeholder">Putra</div>`;
      }
      barisAtas.appendChild(fotoDuo);

      const identitas = document.createElement('div');
      identitas.className = 'hasil-identitas';

      let badgePemenang = '';
      if (apakahPemenangTunggal) {
        badgePemenang = `<div class="badge-terpilih">★ TERPILIH</div>`;
      } else if (apakahPemenangSeri) {
        badgePemenang = `<div class="badge-seri">⚖ SUARA SEIMBANG</div>`;
      }

      identitas.innerHTML = `
        ${badgePemenang}
        <div class="badge-nomor-kecil">No. ${String(p.nomor_urut).padStart(2, '0')}</div>
        <div class="hasil-nama-paslon">${p.nama_putri} &amp; ${p.nama_putra}</div>
      `;
      barisAtas.appendChild(identitas);
      item.appendChild(barisAtas);

      // 2. BARIS TENGAH: PERSENTASE (KIRI) & JUMLAH SUARA (KANAN)
      const barisTengah = document.createElement('div');
      barisTengah.className = 'hasil-baris-tengah';
      barisTengah.innerHTML = `
        <span class="hasil-persen-teks">${persenTeks}</span>
        <span class="hasil-suara-teks">${suaraTeks}</span>
      `;
      item.appendChild(barisTengah);

      // 3. BARIS BAWAH: BATANG GRAFIK SELEBAR KARTU PENUH
      const barisBawah = document.createElement('div');
      barisBawah.className = 'hasil-baris-bawah';

      const track = document.createElement('div');
      track.className = 'bar-track';

      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = '0%';
      track.appendChild(fill);
      barisBawah.appendChild(track);
      item.appendChild(barisBawah);

      wadahGrafikPaslon.appendChild(item);

      setTimeout(() => {
        fill.style.width = `${Math.max(persenVal, 0.5)}%`;
      }, 50);
    });
  }

  function aturJedaRefresh(detik) {
    jedaRefreshDetik = detik;
    sisaDetikRefresh = detik;
    teksTimerAutoRefresh.textContent = sisaDetikRefresh;

    if (timerRefresh) clearTimeout(timerRefresh);
    if (intervalDetikRefresh) clearInterval(intervalDetikRefresh);

    intervalDetikRefresh = setInterval(() => {
      sisaDetikRefresh--;
      if (sisaDetikRefresh <= 0) {
        sisaDetikRefresh = jedaRefreshDetik;
      }
      teksTimerAutoRefresh.textContent = sisaDetikRefresh;
    }, 1000);

    timerRefresh = setTimeout(() => {
      muatDataHasil();
    }, detik * 1000);
  }

  // MODE PROYEKTOR (LAYAR PENUH TEKS BESAR)
  btnModeProyektor.addEventListener('click', () => {
    modeProyektorAktif = !modeProyektorAktif;
    if (modeProyektorAktif) {
      wadahKontenHasil.classList.add('mode-proyektor');
      btnModeProyektor.textContent = '✕ Keluar Mode Proyektor';
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      wadahKontenHasil.classList.remove('mode-proyektor');
      btnModeProyektor.textContent = '🖥️ Mode Proyektor';
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  });

  muatDataHasil();
});
