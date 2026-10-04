/**
 * LOGIKA HALAMAN PEMILIH (INDEX.HTML)
 * Alur: Input Token -> Pilih Paslon -> Konfirmasi -> Kirim Handal -> Selesai
 */

document.addEventListener('DOMContentLoaded', () => {
  let tokenAktif = null;
  let daftarPaslon = [];
  let paslonTerpilih = null;
  let detailPaslonAktif = null;
  let pengaturanSistem = null;
  let pengirimSuara = null;
  let pengelolaHitungMundur = null;
  let timerResetOtomatis = null;
  let intervalPollingStatus = null;

  // DOM
  const layarStatusKhusus = document.getElementById('layar-status-khusus');
  const judulStatusKhusus = document.getElementById('judul-status-khusus');
  const pesanStatusKhusus = document.getElementById('pesan-status-khusus');
  const ikonStatusKhusus = document.getElementById('ikon-status-khusus');
  const btnCekLagiStatus = document.getElementById('btn-cek-lagi-status');

  const kotakHitungMundur = document.getElementById('kotak-hitung-mundur');
  const teksHitungMundur = document.getElementById('teks-hitung-mundur');

  const layarToken = document.getElementById('layar-token');
  const formToken = document.getElementById('form-token');
  const inputToken = document.getElementById('input-token');
  const btnLanjutToken = document.getElementById('btn-lanjut-token');
  const pesanErrorToken = document.getElementById('pesan-error-token');

  const layarPilih = document.getElementById('layar-pilih');
  const wadahKartuPaslon = document.getElementById('wadah-kartu-paslon');
  const btnGantiToken = document.getElementById('btn-ganti-token');

  const layarProses = document.getElementById('layar-proses');
  const judulProses = document.getElementById('judul-proses');
  const pesanProses = document.getElementById('pesan-proses');
  const wadahRetryBox = document.getElementById('wadah-retry-box');
  const teksRetryPesan = document.getElementById('teks-retry-pesan');
  const btnRetrySekarang = document.getElementById('btn-retry-sekarang');

  const layarSukses = document.getElementById('layar-sukses');
  const confettiBox = document.getElementById('confetti-box');
  const hitungMundurReset = document.getElementById('hitung-mundur-reset');
  const btnSelesaiManual = document.getElementById('btn-selesai-manual');

  const modalDetail = document.getElementById('modal-detail');
  const detailNomor = document.getElementById('detail-nomor');
  const detailJudulPaslon = document.getElementById('detail-judul-paslon');
  const btnTutupDetail = document.getElementById('btn-tutup-detail');
  const detailSlider = document.getElementById('detail-slider');
  const detailImgPutri = document.getElementById('detail-img-putri');
  const detailImgPutra = document.getElementById('detail-img-putra');
  const detailNamaPutri = document.getElementById('detail-nama-putri');
  const detailNamaPutra = document.getElementById('detail-nama-putra');
  const detailAsalPutri = document.getElementById('detail-asal-putri');
  const detailAsalPutra = document.getElementById('detail-asal-putra');
  const detailDots = document.getElementById('detail-dots');
  const detailTeksVisi = document.getElementById('detail-teks-visi');
  const detailDaftarMisi = document.getElementById('detail-daftar-misi');
  const detailDaftarProgja = document.getElementById('detail-daftar-progja');
  const seksiVisi = document.getElementById('seksi-visi');
  const seksiMisi = document.getElementById('seksi-misi');
  const seksiProgja = document.getElementById('seksi-progja');
  const btnPilihDariDetail = document.getElementById('btn-pilih-dari-detail');

  const modalLightbox = document.getElementById('modal-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxNama = document.getElementById('lightbox-nama');
  const lightboxPeran = document.getElementById('lightbox-peran');

  const modalKonfirmasi = document.getElementById('modal-konfirmasi');
  const sheetTeksPertanyaan = document.getElementById('sheet-teks-pertanyaan');
  const sheetFotoPutri = document.getElementById('sheet-foto-putri');
  const sheetFotoPutra = document.getElementById('sheet-foto-putra');
  const btnKirimPilihanFinal = document.getElementById('btn-kirim-pilihan-final');
  const btnBatalKonfirmasi = document.getElementById('btn-batal-konfirmasi');

  // MESIN PENGIRIM HANDAL
  pengirimSuara = new PengirimSuaraHandal({
    onStatus: (info) => {
      tampilkanLayar('proses');
      if (info.status === 'retry') {
        wadahRetryBox.style.display = 'block';
        teksRetryPesan.textContent = info.pesan;
      } else {
        wadahRetryBox.style.display = 'none';
        judulProses.textContent = 'Mencatat Suara...';
        pesanProses.textContent = info.pesan || 'Menghubungkan ke server...';
      }
    },
    onSukses: () => {
      tampilkanLayarSukses();
    },
    onGagalFinal: (err) => {
      tampilkanLayar('token');
      tampilkanErrorToken(err.pesan);
      inputToken.classList.add('salah');
      tokenAktif = null;
    }
  });

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
      muatPengaturanDanStatus(true);
    }
  );

  function sembunyikanSemuaLayar() {
    layarStatusKhusus.style.display = 'none';
    layarToken.style.display = 'none';
    layarPilih.style.display = 'none';
    layarProses.style.display = 'none';
    layarSukses.style.display = 'none';
  }

  function tampilkanLayar(namaLayar) {
    sembunyikanSemuaLayar();
    if (namaLayar === 'status_khusus') layarStatusKhusus.style.display = 'block';
    else if (namaLayar === 'token') layarToken.style.display = 'block';
    else if (namaLayar === 'pilih') layarPilih.style.display = 'block';
    else if (namaLayar === 'proses') layarProses.style.display = 'block';
    else if (namaLayar === 'sukses') layarSukses.style.display = 'block';

    try {
      history.replaceState({ layar: namaLayar }, document.title, window.location.pathname);
    } catch (e) {}
  }

  async function muatPengaturanDanStatus() {
    try {
      const data = await panggilRPC('ambil_pengaturan');
      pengaturanSistem = data;

      if (data.nama_acara) {
        const elJudul = document.getElementById('judul-acara-header');
        if (elJudul) elJudul.textContent = data.nama_acara;
      }
      const elGudep = document.getElementById('subjudul-gudep-header');
      if (elGudep && window.CONFIG && window.CONFIG.NAMA_GUDEP) {
        elGudep.textContent = window.CONFIG.NAMA_GUDEP;
      }

      pengelolaHitungMundur.aturWaktuServer(
        data.waktu_server,
        data.buka_pada,
        data.tutup_pada,
        data.status
      );

      if (data.status === 'belum_dibuka') {
        ikonStatusKhusus.textContent = '⏳';
        judulStatusKhusus.textContent = 'Pemilihan Belum Dibuka';
        pesanStatusKhusus.textContent = 'Sesi pemilihan suara belum dibuka oleh panitia. Silakan tunggu jadwal resmi dari pembina pramuka.';
        tampilkanLayar('status_khusus');
        mulaiPollingStatus();
        return false;
      } else if (data.status === 'ditutup') {
        ikonStatusKhusus.textContent = '🔒';
        judulStatusKhusus.textContent = 'Pemilihan Sudah Ditutup';
        pesanStatusKhusus.textContent = 'Sesi pemberian suara telah resmi ditutup oleh panitia. Terima kasih atas partisipasi seluruh adik-adik pramuka!';
        tampilkanLayar('status_khusus');
        hentikanPollingStatus();
        return false;
      } else {
        hentikanPollingStatus();
        return true;
      }
    } catch (error) {
      return true;
    }
  }

  function mulaiPollingStatus() {
    hentikanPollingStatus();
    intervalPollingStatus = setInterval(() => {
      muatPengaturanDanStatus();
    }, 60000);
  }

  function hentikanPollingStatus() {
    if (intervalPollingStatus) {
      clearInterval(intervalPollingStatus);
      intervalPollingStatus = null;
    }
  }

  async function muatPaslonLatar() {
    if (daftarPaslon.length > 0) return;
    try {
      const pas = await panggilRPC('ambil_paslon');
      if (Array.isArray(pas)) {
        daftarPaslon = pas;
        pasangKartuPaslon(daftarPaslon);
      }
    } catch (e) {
      setTimeout(async () => {
        try {
          const pas2 = await panggilRPC('ambil_paslon');
          if (Array.isArray(pas2)) {
            daftarPaslon = pas2;
            pasangKartuPaslon(daftarPaslon);
          }
        } catch (e2) {}
      }, 3000);
    }
  }

  function pasangKartuPaslon(paslonArray) {
    wadahKartuPaslon.innerHTML = '';
    if (!paslonArray || paslonArray.length === 0) {
      wadahKartuPaslon.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--teks-pudar);">Belum ada pasangan calon aktif.</div>';
      return;
    }

    paslonArray.forEach(p => {
      const kartu = document.createElement('div');
      kartu.className = 'kartu-paslon';

      const badgeNo = document.createElement('div');
      badgeNo.className = 'badge-nomor';
      badgeNo.textContent = String(p.nomor_urut).padStart(2, '0');
      kartu.appendChild(badgeNo);

      const fotoDuo = document.createElement('div');
      fotoDuo.className = 'foto-paslon-duo';

      const slotPutri = buatSlotFoto(p.foto_putri_url, p.nama_putri, 'Putri', p);
      const slotPutra = buatSlotFoto(p.foto_putra_url, p.nama_putra, 'Putra', p);
      fotoDuo.appendChild(slotPutri);
      fotoDuo.appendChild(slotPutra);
      kartu.appendChild(fotoDuo);

      const infoDuo = document.createElement('div');
      infoDuo.className = 'info-calon-duo';
      infoDuo.innerHTML = `
        <div class="calon-orang">
          <span class="calon-peran">Pratama Putri</span>
          <div class="calon-nama">${p.nama_putri}</div>
          <div class="calon-asal">${p.asal_putri || '-'}</div>
        </div>
        <div class="calon-orang">
          <span class="calon-peran">Pratama Putra</span>
          <div class="calon-nama">${p.nama_putra}</div>
          <div class="calon-asal">${p.asal_putra || '-'}</div>
        </div>
      `;
      kartu.appendChild(infoDuo);

      const bawah = document.createElement('div');
      bawah.className = 'kartu-bawah';

      const visiCuplikan = document.createElement('div');
      visiCuplikan.className = 'visi-cuplikan';
      visiCuplikan.textContent = `Visi: ${p.visi}`;
      bawah.appendChild(visiCuplikan);

      const aksiWrap = document.createElement('div');
      aksiWrap.className = 'aksi-paslon';

      const btnLihat = document.createElement('button');
      btnLihat.type = 'button';
      btnLihat.className = 'btn btn-sekunder';
      btnLihat.textContent = 'Lihat Visi, Misi & Program Kerja';
      btnLihat.addEventListener('click', (e) => {
        e.stopPropagation();
        bukaModalDetail(p);
      });
      aksiWrap.appendChild(btnLihat);

      const btnPilih = document.createElement('button');
      btnPilih.type = 'button';
      btnPilih.className = 'btn btn-utama';
      btnPilih.textContent = `Pilih No. ${String(p.nomor_urut).padStart(2, '0')}`;
      btnPilih.addEventListener('click', (e) => {
        e.stopPropagation();
        konfirmasiPilihan(p);
      });
      aksiWrap.appendChild(btnPilih);

      bawah.appendChild(aksiWrap);
      kartu.appendChild(bawah);
      wadahKartuPaslon.appendChild(kartu);
    });
  }

  function buatSlotFoto(url, nama, peran, paslon) {
    const wadah = document.createElement('div');
    wadah.className = 'foto-paslon-item';

    if (url) {
      const img = document.createElement('img');
      img.className = 'foto-paslon-img';
      img.alt = `Foto Calon Pratama ${peran}: ${nama}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = url;

      img.addEventListener('click', (e) => {
        e.stopPropagation();
        bukaLightbox(url, nama, `Calon Pratama ${peran} (No. ${paslon.nomor_urut})`);
      });

      img.onerror = () => {
        wadah.innerHTML = '';
        wadah.appendChild(buatPlaceholderInisial(nama, peran));
      };

      wadah.appendChild(img);
    } else {
      wadah.appendChild(buatPlaceholderInisial(nama, peran));
    }

    return wadah;
  }

  function buatPlaceholderInisial(nama, peran) {
    const wrap = document.createElement('div');
    wrap.className = 'foto-placeholder';
    const inisial = nama ? nama.trim().charAt(0).toUpperCase() : '?';
    wrap.innerHTML = `
      <div class="foto-placeholder-inisial">${inisial}</div>
      <div class="foto-placeholder-peran">${peran}</div>
    `;
    return wrap;
  }

  // INPUT TOKEN & PREFETCH
  inputToken.addEventListener('input', () => {
    pesanErrorToken.textContent = '';
    inputToken.classList.remove('salah', 'benar');

    const teks = inputToken.value.toUpperCase().replace(/\s/g, '');
    if (inputToken.value !== teks) {
      inputToken.value = teks;
    }

    if (teks.length >= 2) {
      muatPaslonLatar();
    }
  });

  formToken.addEventListener('submit', async (e) => {
    e.preventDefault();
    const kode = inputToken.value.toUpperCase().replace(/[\s\-]/g, '');

    if (!kode) {
      tampilkanErrorToken('Silakan ketik token kuponmu terlebih dahulu.');
      return;
    }

    pesanErrorToken.textContent = '';
    btnLanjutToken.disabled = true;
    btnLanjutToken.textContent = 'Memeriksa Token...';

    try {
      const hasil = await panggilRPC('cek_token', { p_kode: kode });

      if (hasil === 'valid') {
        inputToken.classList.remove('salah');
        inputToken.classList.add('benar');
        tokenAktif = kode;

        if (daftarPaslon.length === 0) {
          await muatPaslonLatar();
        }

        setTimeout(() => {
          tampilkanLayar('pilih');
        }, 300);
      } else {
        const pesan = PESAN_PEMILIH[hasil] || 'Token tidak dapat digunakan.';
        tampilkanErrorToken(pesan);
        inputToken.classList.add('salah');
      }
    } catch (err) {
      tampilkanErrorToken('Gagal memeriksa token. Periksa koneksi internetmu.');
      inputToken.classList.add('salah');
    } finally {
      btnLanjutToken.disabled = false;
      btnLanjutToken.textContent = 'Lanjut Memilih';
    }
  });

  function tampilkanErrorToken(pesan) {
    pesanErrorToken.textContent = pesan;
    inputToken.focus();
  }

  btnGantiToken.addEventListener('click', () => {
    tokenAktif = null;
    inputToken.value = '';
    inputToken.classList.remove('benar', 'salah');
    tampilkanLayar('token');
  });

  // DETAIL VISI, MISI, PROGJA
  function bukaModalDetail(paslon) {
    detailPaslonAktif = paslon;
    detailNomor.textContent = String(paslon.nomor_urut).padStart(2, '0');
    detailJudulPaslon.textContent = `Pasangan Calon No. ${String(paslon.nomor_urut).padStart(2, '0')}`;

    detailImgPutri.src = paslon.foto_putri_url || '';
    detailImgPutra.src = paslon.foto_putra_url || '';
    detailNamaPutri.textContent = paslon.nama_putri;
    detailNamaPutra.textContent = paslon.nama_putra;
    detailAsalPutri.textContent = paslon.asal_putri || '-';
    detailAsalPutra.textContent = paslon.asal_putra || '-';

    detailImgPutri.onclick = () => bukaLightbox(paslon.foto_putri_url, paslon.nama_putri, 'Calon Pratama Putri');
    detailImgPutra.onclick = () => bukaLightbox(paslon.foto_putra_url, paslon.nama_putra, 'Calon Pratama Putra');

    if (paslon.visi && paslon.visi.trim()) {
      seksiVisi.style.display = 'block';
      detailTeksVisi.textContent = paslon.visi.trim();
    } else {
      seksiVisi.style.display = 'none';
    }

    if (paslon.misi && paslon.misi.trim()) {
      seksiMisi.style.display = 'block';
      detailDaftarMisi.innerHTML = '';
      const barisMisi = paslon.misi.split('\n').map(b => b.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      barisMisi.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m;
        detailDaftarMisi.appendChild(li);
      });
    } else {
      seksiMisi.style.display = 'none';
    }

    if (paslon.program_kerja && paslon.program_kerja.trim()) {
      seksiProgja.style.display = 'block';
      detailDaftarProgja.innerHTML = '';
      const barisProgja = paslon.program_kerja.split('\n').map(b => b.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
      barisProgja.forEach(pk => {
        const li = document.createElement('li');
        li.textContent = pk;
        detailDaftarProgja.appendChild(li);
      });
    } else {
      seksiProgja.style.display = 'none';
    }

    btnPilihDariDetail.textContent = `Pilih Pasangan No. ${String(paslon.nomor_urut).padStart(2, '0')}`;
    modalDetail.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function tutupModalDetail() {
    modalDetail.style.display = 'none';
    document.body.style.overflow = '';
  }

  btnTutupDetail.addEventListener('click', tutupModalDetail);
  modalDetail.addEventListener('click', (e) => {
    if (e.target === modalDetail) tutupModalDetail();
  });

  btnPilihDariDetail.addEventListener('click', () => {
    if (detailPaslonAktif) {
      tutupModalDetail();
      konfirmasiPilihan(detailPaslonAktif);
    }
  });

  detailSlider.addEventListener('scroll', () => {
    const lebar = detailSlider.offsetWidth;
    const index = Math.round(detailSlider.scrollLeft / (lebar || 1));
    const dots = detailDots.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add('aktif');
      else dot.classList.remove('aktif');
    });
  });

  function bukaLightbox(url, nama, peran) {
    if (!url) return;
    lightboxImg.src = url;
    lightboxNama.textContent = nama;
    lightboxPeran.textContent = peran;
    modalLightbox.style.display = 'flex';
  }

  modalLightbox.addEventListener('click', () => {
    modalLightbox.style.display = 'none';
  });

  // BOTTOM SHEET KONFIRMASI: "Kamu memilih No. X: [nama putri] & [nama putra]. Yakin?"
  function konfirmasiPilihan(paslon) {
    paslonTerpilih = paslon;
    sheetTeksPertanyaan.textContent = `Kamu memilih No. ${String(paslon.nomor_urut).padStart(2, '0')}: ${paslon.nama_putri} & ${paslon.nama_putra}. Yakin?`;
    sheetFotoPutri.src = paslon.foto_putri_url || '';
    sheetFotoPutra.src = paslon.foto_putra_url || '';
    modalKonfirmasi.style.display = 'flex';
  }

  function tutupKonfirmasi() {
    modalKonfirmasi.style.display = 'none';
    paslonTerpilih = null;
  }

  btnBatalKonfirmasi.addEventListener('click', tutupKonfirmasi);
  modalKonfirmasi.addEventListener('click', (e) => {
    if (e.target === modalKonfirmasi) tutupKonfirmasi();
  });

  btnKirimPilihanFinal.addEventListener('click', () => {
    if (!paslonTerpilih || !tokenAktif) return;
    btnKirimPilihanFinal.disabled = true;
    modalKonfirmasi.style.display = 'none';
    pengirimSuara.mulaiKirim(tokenAktif, paslonTerpilih.id);
  });

  btnRetrySekarang.addEventListener('click', () => {
    pengirimSuara.cobaLagiSekarang();
  });

  function tampilkanLayarSukses() {
    tampilkanLayar('sukses');
    buatConfettiCSS();

    tokenAktif = null;
    paslonTerpilih = null;
    inputToken.value = '';

    let sisaDetik = 10;
    hitungMundurReset.textContent = sisaDetik;

    if (timerResetOtomatis) clearInterval(timerResetOtomatis);
    timerResetOtomatis = setInterval(() => {
      sisaDetik--;
      if (sisaDetik <= 0) {
        clearInterval(timerResetOtomatis);
        timerResetOtomatis = null;
        resetKeLayarAwal();
      } else {
        hitungMundurReset.textContent = sisaDetik;
      }
    }, 1000);
  }

  function resetKeLayarAwal() {
    if (timerResetOtomatis) {
      clearInterval(timerResetOtomatis);
      timerResetOtomatis = null;
    }
    inputToken.value = '';
    inputToken.classList.remove('salah', 'benar');
    pesanErrorToken.textContent = '';
    btnKirimPilihanFinal.disabled = false;
    muatPengaturanDanStatus();
    tampilkanLayar('token');
  }

  btnSelesaiManual.addEventListener('click', resetKeLayarAwal);

  function buatConfettiCSS() {
    confettiBox.innerHTML = '';
    const warna = ['#d4a017', '#5b3a1e', '#2e7d32', '#c62828', '#ffffff', '#fbe69d'];
    for (let i = 0; i < 30; i++) {
      const keping = document.createElement('div');
      keping.className = 'confetti-keping';
      keping.style.left = `${Math.random() * 100}%`;
      keping.style.background = warna[Math.floor(Math.random() * warna.length)];
      keping.style.animationDelay = `${Math.random() * 2}s`;
      keping.style.animationDuration = `${2 + Math.random() * 2}s`;
      confettiBox.appendChild(keping);
    }
  }

  btnCekLagiStatus.addEventListener('click', () => {
    btnCekLagiStatus.disabled = true;
    btnCekLagiStatus.textContent = 'Memeriksa...';
    muatPengaturanDanStatus(true).finally(() => {
      btnCekLagiStatus.disabled = false;
      btnCekLagiStatus.textContent = 'Muat Ulang Status';
    });
  });

  const pendingTerdahulu = pengirimSuara.ambilPending();
  if (pendingTerdahulu && pendingTerdahulu.kode && pendingTerdahulu.paslon_id) {
    tampilkanLayar('proses');
    judulProses.textContent = 'Melanjutkan Pengiriman Suara...';
    pesanProses.textContent = 'Pilihanmu yang tersimpan di HP ini sedang dikirim ulang ke server panitia.';
    pengirimSuara.eksekusiKirim(pendingTerdahulu);
  } else {
    muatPengaturanDanStatus().then((buka) => {
      if (buka) {
        tampilkanLayar('token');
      }
    });
    muatPaslonLatar();
  }
});
