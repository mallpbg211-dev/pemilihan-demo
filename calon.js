/**
 * LOGIKA HALAMAN CALON (CALON.HTML)
 * Membaca visi, misi, dan program kerja pasangan calon tanpa token.
 */

document.addEventListener('DOMContentLoaded', () => {
  let daftarPaslon = [];
  let pengelolaHitungMundur = null;

  // ELEMEN DOM
  const kotakHitungMundur = document.getElementById('kotak-hitung-mundur');
  const teksHitungMundur = document.getElementById('teks-hitung-mundur');
  const wadahKartuPaslon = document.getElementById('wadah-kartu-paslon');

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

  const modalLightbox = document.getElementById('modal-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxNama = document.getElementById('lightbox-nama');
  const lightboxPeran = document.getElementById('lightbox-peran');

  // HITUNG MUNDUR SINKRON SERVER
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
      muatPengaturan();
    }
  );

  async function muatPengaturan() {
    try {
      const data = await panggilRPC('ambil_pengaturan');
      if (data.nama_acara) {
        const elJudul = document.getElementById('judul-acara-header');
        if (elJudul) elJudul.textContent = data.nama_acara;
      }
      pengelolaHitungMundur.aturWaktuServer(
        data.waktu_server,
        data.buka_pada,
        data.tutup_pada,
        data.status
      );
    } catch (e) {}
  }

  // AMBIL PASLON
  async function muatPaslon() {
    try {
      const pas = await panggilRPC('ambil_paslon');
      if (Array.isArray(pas)) {
        daftarPaslon = pas;
        pasangKartuPaslon(daftarPaslon);
      }
    } catch (error) {
      // Retry otomatis setelah 3 detik
      setTimeout(async () => {
        try {
          const pas2 = await panggilRPC('ambil_paslon');
          if (Array.isArray(pas2)) {
            daftarPaslon = pas2;
            pasangKartuPaslon(daftarPaslon);
          }
        } catch (e2) {
          wadahKartuPaslon.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 30px;">
              <p style="color: var(--bahaya); font-weight: 700;">Gagal memuat daftar pasangan calon.</p>
              <button id="btn-coba-muat-paslon" class="btn btn-sekunder" style="margin-top: 10px;">Coba Lagi</button>
            </div>
          `;
          const btn = document.getElementById('btn-coba-muat-paslon');
          if (btn) btn.onclick = () => muatPaslon();
        }
      }, 3000);
    }
  }

  function pasangKartuPaslon(paslonArray) {
    wadahKartuPaslon.innerHTML = '';
    if (!paslonArray || paslonArray.length === 0) {
      wadahKartuPaslon.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--teks-pudar);">Belum ada pasangan calon yang terdaftar.</div>';
      return;
    }

    paslonArray.forEach(p => {
      const kartu = document.createElement('div');
      kartu.className = 'kartu-paslon';

      // Badge Nomor Urut
      const badgeNo = document.createElement('div');
      badgeNo.className = 'badge-nomor';
      badgeNo.textContent = String(p.nomor_urut).padStart(2, '0');
      kartu.appendChild(badgeNo);

      // Duo Foto Berdampingan 9:16 (50% - 50%)
      const fotoDuo = document.createElement('div');
      fotoDuo.className = 'foto-paslon-duo';

      const slotPutri = buatSlotFoto(p.foto_putri_url, p.nama_putri, 'Putri', p);
      const slotPutra = buatSlotFoto(p.foto_putra_url, p.nama_putra, 'Putra', p);
      fotoDuo.appendChild(slotPutri);
      fotoDuo.appendChild(slotPutra);
      kartu.appendChild(fotoDuo);

      // Info Calon Putri & Putra
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

      // Bawah: Cuplikan Visi & Tombol Detail
      const bawah = document.createElement('div');
      bawah.className = 'kartu-bawah';

      const visiCuplikan = document.createElement('div');
      visiCuplikan.className = 'visi-cuplikan';
      visiCuplikan.textContent = `Visi: ${p.visi}`;
      bawah.appendChild(visiCuplikan);

      const btnLihat = document.createElement('button');
      btnLihat.type = 'button';
      btnLihat.className = 'btn btn-utama btn-blok';
      btnLihat.textContent = 'Lihat Visi, Misi & Progja Lengkap';
      btnLihat.addEventListener('click', () => {
        bukaModalDetail(p);
      });
      bawah.appendChild(btnLihat);

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

  // MODAL DETAIL
  function bukaModalDetail(paslon) {
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

    // Visi
    if (paslon.visi && paslon.visi.trim()) {
      seksiVisi.style.display = 'block';
      detailTeksVisi.textContent = paslon.visi.trim();
    } else {
      seksiVisi.style.display = 'none';
    }

    // Misi
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

    // Progja
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

  // SLIDER DOTS
  detailSlider.addEventListener('scroll', () => {
    const lebar = detailSlider.offsetWidth;
    const index = Math.round(detailSlider.scrollLeft / (lebar || 1));
    const dots = detailDots.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      if (idx === index) dot.classList.add('aktif');
      else dot.classList.remove('aktif');
    });
  });

  // LIGHTBOX
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

  // JALANKAN AWAL
  muatPengaturan();
  muatPaslon();
});
