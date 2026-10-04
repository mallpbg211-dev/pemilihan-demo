/**
 * LOGIKA PANEL ADMIN (ADMIN.HTML)
 * - Autentikasi Pengaman PIN / Kata Sandi Panitia (sessionStorage)
 * - Ringkasan & Alarm Audit Suara
 * - Pemantau Partisipasi Batch (Auto refresh 30s saat tab aktif)
 * - Manajemen Paslon & Pengolahan Foto Klien (9:16, WebP < 200KB)
 * - Generator & Filter Token, Cetak Kupon 10/A4 Fisher-Yates
 * - Berita Acara Cetak Resmi & Watermark Draft
 * - Ekspor CSV UTF-8 BOM
 * - Manajemen Penggantian PIN Panitia
 */

document.addEventListener('DOMContentLoaded', () => {
  let adminSessionToken = sessionStorage.getItem('pramuka_admin_session_token') || null;
  let adminAuthActive = sessionStorage.getItem('pramuka_admin_auth_active') === 'true';
  let daftarTokenCache = [];
  let daftarPaslonCache = [];
  let intervalRefreshBatch = null;

  let fotoPutriOlah = null;
  let fotoPutraOlah = null;

  // DOM UTAMA
  const seksiLogin = document.getElementById('seksi-login');
  const seksiPanelAdmin = document.getElementById('seksi-panel-admin');
  const adminSubStatus = document.getElementById('admin-sub-status');
  const btnKeluarAdmin = document.getElementById('btn-keluar-admin');

  // FORM LOGIN DOM
  const tabLoginPinBtn = document.getElementById('tab-login-pin-btn');
  const tabLoginSupabaseBtn = document.getElementById('tab-login-supabase-btn');
  const formLoginPin = document.getElementById('form-login-pin');
  const loginPinInput = document.getElementById('login-pin-input');
  const pesanErrorPin = document.getElementById('pesan-error-pin');
  const btnSubmitPin = document.getElementById('btn-submit-pin');

  const formLoginAdmin = document.getElementById('form-login-admin');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const pesanErrorLogin = document.getElementById('pesan-error-login');
  const btnSubmitLogin = document.getElementById('btn-submit-login');

  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabIsi = document.querySelectorAll('.tab-isi');

  // TAB 1: RINGKASAN
  const adminStatTotal = document.getElementById('admin-stat-total');
  const adminStatAktif = document.getElementById('admin-stat-aktif');
  const adminStatTerpakai = document.getElementById('admin-stat-terpakai');
  const adminStatBatal = document.getElementById('admin-stat-batal');
  const adminStatSuara = document.getElementById('admin-stat-suara');
  const adminStatAudit = document.getElementById('admin-stat-audit');

  const formPengaturanStatus = document.getElementById('form-pengaturan-status');
  const setStatus = document.getElementById('set-status');
  const setBukaPada = document.getElementById('set-buka-pada');
  const setTutupPada = document.getElementById('set-tutup-pada');
  const setTampilkanHasil = document.getElementById('set-tampilkan-hasil');
  const setHasilLangsung = document.getElementById('set-hasil-langsung');
  const btnSimpanPengaturan = document.getElementById('btn-simpan-pengaturan');
  const btnRefreshRingkasan = document.getElementById('btn-refresh-ringkasan');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const kotakAksiDemo = document.getElementById('kotak-aksi-demo');

  // TAB 2: BATCH
  const tbodyBatch = document.getElementById('tbody-batch');
  const btnRefreshBatch = document.getElementById('btn-refresh-batch');

  // TAB 3: PASLON
  const btnTambahPaslonBaru = document.getElementById('btn-tambah-paslon-baru');
  const wadahFormPaslon = document.getElementById('wadah-form-paslon');
  const judulFormPaslon = document.getElementById('judul-form-paslon');
  const peringatanEditDibuka = document.getElementById('peringatan-edit-dibuka');
  const formPaslon = document.getElementById('form-paslon');
  const paslonId = document.getElementById('paslon-id');
  const paslonNomor = document.getElementById('paslon-nomor');
  const paslonAktif = document.getElementById('paslon-aktif');
  const paslonNamaPutri = document.getElementById('paslon-nama-putri');
  const paslonAsalPutri = document.getElementById('paslon-asal-putri');
  const paslonFilePutri = document.getElementById('paslon-file-putri');
  const pratinjauPutriWrap = document.getElementById('pratinjau-putri-wrap');
  const paslonNamaPutra = document.getElementById('paslon-nama-putra');
  const paslonAsalPutra = document.getElementById('paslon-asal-putra');
  const paslonFilePutra = document.getElementById('paslon-file-putra');
  const pratinjauPutraWrap = document.getElementById('pratinjau-putra-wrap');
  const paslonVisi = document.getElementById('paslon-visi');
  const paslonMisi = document.getElementById('paslon-misi');
  const paslonProgja = document.getElementById('paslon-progja');
  const btnSimpanPaslon = document.getElementById('btn-simpan-paslon');
  const btnBatalPaslon = document.getElementById('btn-batal-paslon');
  const tbodyPaslon = document.getElementById('tbody-paslon');

  // TAB 4: TOKEN & CETAK
  const formBuatToken = document.getElementById('form-buat-token');
  const buatTokenJumlah = document.getElementById('buat-token-jumlah');
  const buatTokenBatch = document.getElementById('buat-token-batch');
  const btnBuatTokenSubmit = document.getElementById('btn-buat-token-submit');
  const filterStatusToken = document.getElementById('filter-status-token');
  const tbodyToken = document.getElementById('tbody-token');
  const btnRefreshToken = document.getElementById('btn-refresh-token');
  const btnCetakSlipKupon = document.getElementById('btn-cetak-slip-kupon');
  const btnEksporCsvToken = document.getElementById('btn-ekspor-csv-token');
  const wadahCetakKupon = document.getElementById('wadah-cetak-kupon');
  const gridKuponCetak = document.getElementById('grid-kupon-cetak');

  // TAB 5: REKAP
  const watermarkDraft = document.getElementById('watermark-draft');
  const rekapTanggal = document.getElementById('rekap-tanggal');
  const rekapNamaAcara = document.getElementById('rekap-nama-acara');
  const rekapTbodyPaslon = document.getElementById('rekap-tbody-paslon');
  const rekapTotalSuara = document.getElementById('rekap-total-suara');
  const rekapTokenTotal = document.getElementById('rekap-token-total');
  const rekapTokenTerpakai = document.getElementById('rekap-token-terpakai');
  const rekapTokenSisa = document.getElementById('rekap-token-sisa');
  const rekapStatusAudit = document.getElementById('rekap-status-audit');
  const btnEksporCsv = document.getElementById('btn-ekspor-csv');

  // TAB 6: DATABASE, PIN & SQL
  const formUbahPin = document.getElementById('form-ubah-pin');
  const inputPinBaru = document.getElementById('input-pin-baru');
  const inputPinBaruKonfirm = document.getElementById('input-pin-baru-konfirm');
  const pesanStatusPin = document.getElementById('pesan-status-pin');

  const formConfigOverride = document.getElementById('form-config-override');
  const cfgMode = document.getElementById('cfg-mode');
  const cfgSupabaseUrl = document.getElementById('cfg-supabase-url');
  const cfgSupabaseKey = document.getElementById('cfg-supabase-key');
  const btnTestKoneksi = document.getElementById('btn-test-koneksi');
  const pesanStatusKoneksi = document.getElementById('pesan-status-koneksi');
  const areaSqlView = document.getElementById('area-sql-view');
  const btnSalinSql = document.getElementById('btn-salin-sql');

  // AMBIL PIN SAAT INI
  function ambilPinPanitiaSaatIni() {
    return localStorage.getItem('pramuka_custom_pin_admin') || (window.CONFIG && window.CONFIG.PIN_ADMIN) || '123456';
  }

  // STATUS LOGIN & SESSION
  function cekStatusLogin() {
    adminAuthActive = sessionStorage.getItem('pramuka_admin_auth_active') === 'true';

    if (!adminAuthActive) {
      adminSubStatus.textContent = 'Terkunci (Masukkan PIN)';
      seksiLogin.style.display = 'block';
      seksiPanelAdmin.style.display = 'none';
      btnKeluarAdmin.style.display = 'none';
      setTimeout(() => {
        if (loginPinInput) loginPinInput.focus();
      }, 100);
      return;
    }

    // Sudah Login / Terotentikasi
    seksiLogin.style.display = 'none';
    seksiPanelAdmin.style.display = 'block';
    btnKeluarAdmin.style.display = 'inline-flex';

    if (apakahModeTiruan()) {
      adminSubStatus.textContent = 'Mode Tiruan / Demo Aktif';
      kotakAksiDemo.style.display = 'block';
    } else {
      adminSubStatus.textContent = 'Terhubung Supabase (Login Panitia)';
      kotakAksiDemo.style.display = 'none';
    }

    muatSemuaDataAdmin();
  }

  // TOGGLE TAB LOGIN (PIN VS SUPABASE)
  tabLoginPinBtn.addEventListener('click', () => {
    tabLoginPinBtn.className = 'btn btn-utama';
    tabLoginPinBtn.style.border = 'none';
    tabLoginSupabaseBtn.className = 'btn btn-sekunder';
    tabLoginSupabaseBtn.style.border = 'none';
    formLoginPin.style.display = 'block';
    formLoginAdmin.style.display = 'none';
    pesanErrorPin.textContent = '';
    pesanErrorLogin.textContent = '';
    loginPinInput.focus();
  });

  tabLoginSupabaseBtn.addEventListener('click', () => {
    tabLoginSupabaseBtn.className = 'btn btn-utama';
    tabLoginSupabaseBtn.style.border = 'none';
    tabLoginPinBtn.className = 'btn btn-sekunder';
    tabLoginPinBtn.style.border = 'none';
    formLoginPin.style.display = 'none';
    formLoginAdmin.style.display = 'block';
    pesanErrorPin.textContent = '';
    pesanErrorLogin.textContent = '';
    loginEmail.focus();
  });

  // SUBMIT PIN PANITIA
  formLoginPin.addEventListener('submit', () => {
    const pinKetik = loginPinInput.value.trim();
    pesanErrorPin.textContent = '';

    if (!pinKetik) {
      pesanErrorPin.textContent = 'Masukkan PIN panitia terlebih dahulu.';
      loginPinInput.focus();
      return;
    }

    const pinBenar = ambilPinPanitiaSaatIni();
    if (pinKetik === pinBenar) {
      loginPinInput.classList.remove('salah');
      loginPinInput.classList.add('benar');
      sessionStorage.setItem('pramuka_admin_auth_active', 'true');
      loginPinInput.value = '';
      setTimeout(() => {
        loginPinInput.classList.remove('benar');
        cekStatusLogin();
      }, 200);
    } else {
      loginPinInput.classList.add('salah');
      pesanErrorPin.textContent = 'PIN Panitia salah. Hubungi Ketua Panitia / Pembina.';
      loginPinInput.select();
    }
  });

  // SUBMIT LOGIN SUPABASE
  formLoginAdmin.addEventListener('submit', async () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    pesanErrorLogin.textContent = '';

    if (!email || !password) {
      pesanErrorLogin.textContent = 'Mohon masukkan email dan password admin.';
      return;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.textContent = 'Memverifikasi...';

    const config = window.CONFIG;
    try {
      const url = `${config.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`;
      const respon = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.SUPABASE_KEY
        },
        body: JSON.stringify({ email, password })
      });

      if (!respon.ok) {
        const err = await respon.json();
        throw new Error(err.error_description || err.msg || 'Login gagal. Periksa kembali email dan kata sandi.');
      }

      const authData = await respon.json();
      adminSessionToken = authData.access_token;
      sessionStorage.setItem('pramuka_admin_session_token', adminSessionToken);
      sessionStorage.setItem('pramuka_admin_auth_active', 'true');
      cekStatusLogin();
    } catch (e) {
      pesanErrorLogin.textContent = e.message;
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.textContent = 'Masuk Supabase';
    }
  });

  // LOGOUT (KELUAR)
  btnKeluarAdmin.addEventListener('click', () => {
    sessionStorage.removeItem('pramuka_admin_auth_active');
    sessionStorage.removeItem('pramuka_admin_session_token');
    adminSessionToken = null;
    adminAuthActive = false;
    cekStatusLogin();
  });

  // FORM UBAH PIN PANITIA BARU
  formUbahPin.addEventListener('submit', () => {
    const pin1 = inputPinBaru.value.trim();
    const pin2 = inputPinBaruKonfirm.value.trim();
    pesanStatusPin.textContent = '';

    if (pin1.length < 4) {
      pesanStatusPin.textContent = 'PIN minimal 4 karakter.';
      pesanStatusPin.style.color = 'var(--bahaya)';
      return;
    }

    if (pin1 !== pin2) {
      pesanStatusPin.textContent = 'Konfirmasi PIN tidak cocok.';
      pesanStatusPin.style.color = 'var(--bahaya)';
      return;
    }

    localStorage.setItem('pramuka_custom_pin_admin', pin1);
    inputPinBaru.value = '';
    inputPinBaruKonfirm.value = '';
    pesanStatusPin.textContent = '✓ PIN Panitia berhasil diperbarui!';
    pesanStatusPin.style.color = 'var(--sukses)';
  });

  // WRAPPER ADMIN RPC DENGAN PENANGANAN 401
  async function panggilAdminRPC(namaFungsi, parameter = {}) {
    try {
      return await panggilRPC(namaFungsi, parameter, adminSessionToken);
    } catch (err) {
      if (err.status === 401) {
        alert('Sesi admin telah kedaluwarsa. Silakan login kembali.');
        sessionStorage.removeItem('pramuka_admin_auth_active');
        sessionStorage.removeItem('pramuka_admin_session_token');
        cekStatusLogin();
      }
      throw err;
    }
  }

  // TAB SWITCHER
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('aktif'));
      tabIsi.forEach(t => t.style.display = 'none');

      btn.classList.add('aktif');
      const targetId = btn.getAttribute('data-tab');
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = 'block';
        if (targetId === 'tab-batch') {
          muatPartisipasiBatch();
          mulaiAutoRefreshBatch();
        } else {
          hentikanAutoRefreshBatch();
        }

        if (targetId === 'tab-paslon') muatDaftarPaslonAdmin();
        else if (targetId === 'tab-token') muatDaftarToken();
        else if (targetId === 'tab-cetak-rekap') muatRekapBeritaAcara();
        else if (targetId === 'tab-database') muatTampilanDatabaseDanSql();
      }
    });
  });

  function mulaiAutoRefreshBatch() {
    hentikanAutoRefreshBatch();
    intervalRefreshBatch = setInterval(() => {
      if (document.visibilityState === 'visible') {
        muatPartisipasiBatch();
      }
    }, 30000);
  }

  function hentikanAutoRefreshBatch() {
    if (intervalRefreshBatch) {
      clearInterval(intervalRefreshBatch);
      intervalRefreshBatch = null;
    }
  }

  async function muatSemuaDataAdmin() {
    await muatRingkasan();
    await muatPengaturanForm();
  }

  // TAB 1: RINGKASAN
  async function muatRingkasan() {
    try {
      const ringkasan = await panggilAdminRPC('admin_ringkasan');
      adminStatTotal.textContent = ringkasan.token_total || 0;
      adminStatAktif.textContent = ringkasan.aktif || 0;
      adminStatTerpakai.textContent = ringkasan.terpakai || 0;
      adminStatBatal.textContent = ringkasan.batal || 0;
      adminStatSuara.textContent = ringkasan.suara_masuk || 0;

      if (ringkasan.cocok) {
        adminStatAudit.innerHTML = '<span class="badge-audit-cocok">✓ Cocok</span>';
        rekapStatusAudit.textContent = 'COCOK (Suara Masuk = Token Terpakai)';
        rekapStatusAudit.style.color = 'var(--sukses)';
      } else {
        adminStatAudit.innerHTML = '<span class="badge-audit-selisih">⚠️ TIDAK COCOK</span>';
        rekapStatusAudit.textContent = 'TIDAK COCOK (Ada Selisih Token & Suara)';
        rekapStatusAudit.style.color = 'var(--bahaya)';
      }
    } catch (e) {}
  }

  async function muatPengaturanForm() {
    try {
      const peng = await panggilRPC('ambil_pengaturan');
      setStatus.value = peng.status || 'belum_dibuka';
      setTampilkanHasil.checked = !!peng.tampilkan_hasil;
      setHasilLangsung.checked = !!peng.hasil_langsung;

      if (peng.buka_pada) {
        setBukaPada.value = formatInputDatetime(peng.buka_pada);
      } else {
        setBukaPada.value = '';
      }

      if (peng.tutup_pada) {
        setTutupPada.value = formatInputDatetime(peng.tutup_pada);
      } else {
        setTutupPada.value = '';
      }
    } catch (e) {}
  }

  function formatInputDatetime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  formPengaturanStatus.addEventListener('submit', async () => {
    btnSimpanPengaturan.disabled = true;
    btnSimpanPengaturan.textContent = 'Menyimpan...';

    const bukaIso = setBukaPada.value ? new Date(setBukaPada.value).toISOString() : null;
    const tutupIso = setTutupPada.value ? new Date(setTutupPada.value).toISOString() : null;

    try {
      await panggilAdminRPC('admin_set_pengaturan', {
        p_status: setStatus.value,
        p_tampilkan_hasil: setTampilkanHasil.checked,
        p_hasil_langsung: setHasilLangsung.checked,
        p_buka_pada: bukaIso,
        p_tutup_pada: tutupIso
      });

      alert('Pengaturan pemilihan berhasil diperbarui!');
      muatSemuaDataAdmin();
    } catch (e) {
      alert(`Gagal menyimpan pengaturan: ${e.message}`);
    } finally {
      btnSimpanPengaturan.disabled = false;
      btnSimpanPengaturan.textContent = 'Simpan Perubahan Pengaturan';
    }
  });

  btnRefreshRingkasan.addEventListener('click', muatSemuaDataAdmin);

  btnResetDemo.addEventListener('click', async () => {
    if (!confirm('KONFIRMASI 1: Apakah kamu yakin ingin mengosongkan seluruh perolehan suara?')) return;
    if (!confirm('KONFIRMASI 2: Seluruh token kupon akan diaktifkan kembali. Lanjutkan reset demo?')) return;

    try {
      await panggilAdminRPC('admin_reset_demo');
      alert('Simulasi pemilihan berhasil di-reset!');
      muatSemuaDataAdmin();
    } catch (e) {
      alert(`Gagal reset demo: ${e.message}`);
    }
  });

  // TAB 2: BATCH PARTICIPATION
  async function muatPartisipasiBatch() {
    try {
      const data = await panggilAdminRPC('admin_partisipasi_batch');
      tbodyBatch.innerHTML = '';

      if (!data || data.length === 0) {
        tbodyBatch.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px; color:var(--teks-pudar);">Belum ada data batch token.</td></tr>';
        return;
      }

      data.forEach(b => {
        const total = b.total || 0;
        const terpakai = b.terpakai || 0;
        const aktif = b.aktif || 0;
        const batal = b.batal || 0;
        const persen = total > 0 ? ((terpakai / total) * 100).toFixed(1) : "0.0";

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${b.batch}</strong></td>
          <td>${total}</td>
          <td><span style="color: var(--sukses); font-weight: 700;">${terpakai}</span></td>
          <td>${aktif}</td>
          <td><span style="color: var(--bahaya);">${batal}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 8px; background: var(--latar-subtle); border-radius: 4px; overflow: hidden;">
                <div style="width: ${persen}%; height: 100%; background: var(--utama);"></div>
              </div>
              <span style="font-weight: 800; font-size: 13px; min-width: 44px; text-align: right;">${persen}%</span>
            </div>
          </td>
        `;
        tbodyBatch.appendChild(tr);
      });
    } catch (e) {}
  }

  btnRefreshBatch.addEventListener('click', muatPartisipasiBatch);

  // TAB 3: PASLON MANAGEMENT
  async function muatDaftarPaslonAdmin() {
    try {
      const pas = await panggilRPC('ambil_paslon');
      daftarPaslonCache = Array.isArray(pas) ? pas : [];
      tbodyPaslon.innerHTML = '';

      if (daftarPaslonCache.length === 0) {
        tbodyPaslon.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px;">Belum ada pasangan calon.</td></tr>';
        return;
      }

      daftarPaslonCache.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong style="font-size:16px;">0${p.nomor_urut}</strong></td>
          <td>
            <strong>${p.nama_putri}</strong><br>
            <span style="font-size:11px; color:var(--teks-pudar);">${p.asal_putri || '-'}</span>
          </td>
          <td>
            <strong>${p.nama_putra}</strong><br>
            <span style="font-size:11px; color:var(--teks-pudar);">${p.asal_putra || '-'}</span>
          </td>
          <td style="max-width: 200px; font-size: 12px; color: var(--teks-pudar);">
            <div class="visi-cuplikan">${p.visi}</div>
          </td>
          <td>
            <span style="color: var(--sukses); font-weight: 700;">Aktif</span>
          </td>
          <td>
            <button class="btn btn-sekunder btn-edit-paslon" data-id="${p.id}" style="min-height: 28px; padding: 2px 8px; font-size: 12px;">
              Ubah Data
            </button>
          </td>
        `;

        const btnEdit = tr.querySelector('.btn-edit-paslon');
        btnEdit.addEventListener('click', () => {
          bukaFormEditPaslon(p);
        });

        tbodyPaslon.appendChild(tr);
      });
    } catch (e) {}
  }

  btnTambahPaslonBaru.addEventListener('click', () => {
    paslonId.value = '';
    formPaslon.reset();
    pratinjauPutriWrap.innerHTML = '';
    pratinjauPutraWrap.innerHTML = '';
    fotoPutriOlah = null;
    fotoPutraOlah = null;
    judulFormPaslon.textContent = 'Tambah Pasangan Calon Baru';
    
    const maxNo = daftarPaslonCache.reduce((m, p) => Math.max(m, p.nomor_urut || 0), 0);
    paslonNomor.value = maxNo + 1;
    paslonNomor.disabled = false;

    const peng = ambilDariStorage(KUNCI_STORAGE.PENGATURAN, {});
    peringatanEditDibuka.style.display = peng.status === 'dibuka' ? 'block' : 'none';

    wadahFormPaslon.style.display = 'block';
    paslonNomor.focus();
  });

  function bukaFormEditPaslon(p) {
    paslonId.value = p.id;
    paslonNomor.value = p.nomor_urut;
    paslonNomor.disabled = true;
    paslonAktif.value = p.aktif !== false ? 'true' : 'false';
    paslonNamaPutri.value = p.nama_putri;
    paslonAsalPutri.value = p.asal_putri || '';
    paslonNamaPutra.value = p.nama_putra;
    paslonAsalPutra.value = p.asal_putra || '';
    paslonVisi.value = p.visi;
    paslonMisi.value = p.misi;
    paslonProgja.value = p.program_kerja;

    pratinjauPutriWrap.innerHTML = p.foto_putri_url ? `<img src="${p.foto_putri_url}" style="width:70px; aspect-ratio:9/16; object-fit:cover; border-radius:4px; border:1px solid var(--kartu-border);">` : '';
    pratinjauPutraWrap.innerHTML = p.foto_putra_url ? `<img src="${p.foto_putra_url}" style="width:70px; aspect-ratio:9/16; object-fit:cover; border-radius:4px; border:1px solid var(--kartu-border);">` : '';

    fotoPutriOlah = p.foto_putri_url;
    fotoPutraOlah = p.foto_putra_url;

    judulFormPaslon.textContent = `Ubah Data Paslon No. ${String(p.nomor_urut).padStart(2, '0')}`;

    const peng = ambilDariStorage(KUNCI_STORAGE.PENGATURAN, {});
    peringatanEditDibuka.style.display = peng.status === 'dibuka' ? 'block' : 'none';

    wadahFormPaslon.style.display = 'block';
    wadahFormPaslon.scrollIntoView({ behavior: 'smooth' });
  }

  btnBatalPaslon.addEventListener('click', () => {
    wadahFormPaslon.style.display = 'none';
  });

  paslonFilePutri.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const hasil = await olahFotoKlien(file);
      fotoPutriOlah = hasil.dataUrl;
      pratinjauPutriWrap.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${hasil.dataUrl}" style="width:70px; aspect-ratio:9/16; object-fit:cover; border-radius:4px; border:1.5px solid var(--utama);">
          <div style="font-size:11px; color:var(--sukses);">
            ✓ ${hasil.ukuranKB} KB (${hasil.format.split('/')[1].toUpperCase()})
            ${hasil.resolusiRendah ? '<br><span style="color:var(--peringatan);">⚠️ Resolusi rendah</span>' : ''}
          </div>
        </div>
      `;
    } catch (err) {
      alert(err.message);
    }
  });

  paslonFilePutra.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const hasil = await olahFotoKlien(file);
      fotoPutraOlah = hasil.dataUrl;
      pratinjauPutraWrap.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="${hasil.dataUrl}" style="width:70px; aspect-ratio:9/16; object-fit:cover; border-radius:4px; border:1.5px solid var(--utama);">
          <div style="font-size:11px; color:var(--sukses);">
            ✓ ${hasil.ukuranKB} KB (${hasil.format.split('/')[1].toUpperCase()})
            ${hasil.resolusiRendah ? '<br><span style="color:var(--peringatan);">⚠️ Resolusi rendah</span>' : ''}
          </div>
        </div>
      `;
    } catch (err) {
      alert(err.message);
    }
  });

  formPaslon.addEventListener('submit', async () => {
    const id = paslonId.value ? parseInt(paslonId.value, 10) : null;
    const nomor = parseInt(paslonNomor.value, 10);
    const aktif = paslonAktif.value === 'true';

    btnSimpanPaslon.disabled = true;
    btnSimpanPaslon.textContent = 'Menyimpan...';

    const dataPaslon = {
      id: id,
      nomor_urut: nomor,
      nama_putri: paslonNamaPutri.value.trim(),
      nama_putra: paslonNamaPutra.value.trim(),
      asal_putri: paslonAsalPutri.value.trim(),
      asal_putra: paslonAsalPutra.value.trim(),
      foto_putri_url: fotoPutriOlah || buatSvgPotretPramuka(nomor, 'putri', paslonNamaPutri.value.trim()),
      foto_putra_url: fotoPutraOlah || buatSvgPotretPramuka(nomor, 'putra', paslonNamaPutra.value.trim()),
      visi: paslonVisi.value.trim(),
      misi: paslonMisi.value.trim(),
      program_kerja: paslonProgja.value.trim(),
      aktif: aktif
    };

    try {
      const res = await panggilAdminRPC('admin_simpan_paslon', { paslon: dataPaslon });
      if (res && res.ok === false) {
        alert(res.pesan);
        return;
      }

      alert('Data pasangan calon berhasil disimpan!');
      wadahFormPaslon.style.display = 'none';
      muatDaftarPaslonAdmin();
    } catch (e) {
      alert(`Gagal menyimpan paslon: ${e.message}`);
    } finally {
      btnSimpanPaslon.disabled = false;
      btnSimpanPaslon.textContent = 'Simpan Paslon';
    }
  });

  // TAB 4: TOKEN & CETAK
  formBuatToken.addEventListener('submit', async () => {
    const jumlah = parseInt(buatTokenJumlah.value, 10) || 10;
    const batch = buatTokenBatch.value.trim() || 'Batch 1';

    btnBuatTokenSubmit.disabled = true;
    btnBuatTokenSubmit.textContent = 'Membuat...';

    try {
      const hasil = await panggilAdminRPC('admin_buat_token', {
        p_jumlah: jumlah,
        p_batch: batch
      });
      alert(`Berhasil membuat ${hasil.length} token baru untuk ${batch}!`);
      buatTokenBatch.value = '';
      muatDaftarToken();
      muatRingkasan();
    } catch (e) {
      alert(`Gagal membuat token: ${e.message}`);
    } finally {
      btnBuatTokenSubmit.disabled = false;
      btnBuatTokenSubmit.textContent = '+ Generate Token';
    }
  });

  async function muatDaftarToken() {
    try {
      const data = await panggilAdminRPC('admin_daftar_token');
      daftarTokenCache = Array.isArray(data) ? data : [];
      renderTabelToken();
    } catch (e) {}
  }

  function renderTabelToken() {
    const filter = filterStatusToken.value;
    tbodyToken.innerHTML = '';

    const list = daftarTokenCache.filter(t => {
      if (filter === 'semua') return true;
      return t.status === filter;
    });

    if (list.length === 0) {
      tbodyToken.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:16px; color:var(--teks-pudar);">Tidak ada token yang sesuai filter.</td></tr>';
      return;
    }

    list.forEach(t => {
      const tr = document.createElement('tr');
      let badgeStatus = '';
      if (t.status === 'aktif') badgeStatus = '<span style="color: var(--sukses); font-weight: bold;">● Aktif</span>';
      else if (t.status === 'terpakai') badgeStatus = '<span style="color: var(--teks-pudar);">✓ Terpakai</span>';
      else if (t.status === 'batal') badgeStatus = '<span style="color: var(--bahaya); font-weight: bold;">✕ Batal</span>';

      tr.innerHTML = `
        <td><strong style="letter-spacing: 1.5px; font-family: monospace; font-size: 14px;">${t.kode}</strong></td>
        <td>${t.batch || '-'}</td>
        <td>${badgeStatus}</td>
        <td style="font-size: 12px;">${formatWaktuIndo(t.dibuat_pada)}</td>
        <td style="font-size: 12px;">${formatWaktuIndo(t.dipakai_pada)}</td>
        <td>
          ${t.status === 'aktif' ? `<button class="btn btn-bahaya btn-batalkan" data-kode="${t.kode}" style="min-height: 26px; padding: 2px 6px; font-size: 11px;">Batalkan</button>` : '-'}
        </td>
      `;

      const btnBatal = tr.querySelector('.btn-batalkan');
      if (btnBatal) {
        btnBatal.addEventListener('click', async () => {
          if (confirm(`Batalkan kupon token ${t.kode}? Token ini tidak akan bisa digunakan lagi.`)) {
            await panggilAdminRPC('admin_batalkan_token', { p_kode: t.kode });
            muatDaftarToken();
            muatRingkasan();
          }
        });
      }

      tbodyToken.appendChild(tr);
    });
  }

  filterStatusToken.addEventListener('change', renderTabelToken);
  btnRefreshToken.addEventListener('click', muatDaftarToken);

  // CETAK KUPON (10 PER A4)
  btnCetakSlipKupon.addEventListener('click', () => {
    const tokenAktifSaja = daftarTokenCache.filter(t => t.status === 'aktif');
    if (tokenAktifSaja.length === 0) {
      alert('Tidak ada token berstatus aktif untuk dicetak.');
      return;
    }

    const tokenAcak = acakFisherYates(tokenAktifSaja);

    gridKuponCetak.innerHTML = '';
    const config = window.CONFIG;
    const webUrl = config.ALAMAT_WEB || window.location.origin;
    const namaAcara = config.NAMA_ACARA || 'Pemilihan Pratama Pramuka';

    tokenAcak.forEach(t => {
      const kupon = document.createElement('div');
      kupon.className = 'kupon-satuan';
      kupon.innerHTML = `
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #5b3a1e;">
          GERAKAN PRAMUKA GUGUS DEPAN
        </div>
        <div style="font-size: 11px; font-weight: 900; margin-bottom: 2px;">
          ${namaAcara.toUpperCase()}
        </div>
        <div style="font-size: 22px; font-weight: 900; font-family: monospace; letter-spacing: 3px; margin: 4px 0; border: 1.5px dashed #000; padding: 4px; background: #fafafa;">
          ${t.kode}
        </div>
        <div style="font-size: 10px; color: #333;">
          ${t.batch || 'Batch Umum'} · 1 Token = 1 Kali Memilih
        </div>
        <div style="font-size: 9px; color: #555; margin-top: 2px;">
          Akses bilik suara: <strong>${webUrl}</strong>
        </div>
      `;
      gridKuponCetak.appendChild(kupon);
    });

    wadahCetakKupon.style.display = 'block';
    window.print();
    setTimeout(() => {
      wadahCetakKupon.style.display = 'none';
    }, 1000);
  });

  btnEksporCsvToken.addEventListener('click', () => {
    if (daftarTokenCache.length === 0) {
      alert('Belum ada token untuk diekspor.');
      return;
    }
    let csv = '\uFEFFKode Token,Batch,Status,Dibuat Pada,Waktu Dipakai\n';
    daftarTokenCache.forEach(t => {
      csv += `"${t.kode}","${t.batch || ''}","${t.status}","${t.dibuat_pada || ''}","${t.dipakai_pada || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daftar-token-pramuka-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // TAB 5: REKAP RESMI
  async function muatRekapBeritaAcara() {
    try {
      const data = await panggilAdminRPC('admin_ekspor_hasil');
      const ring = await panggilAdminRPC('admin_ringkasan');
      const peng = await panggilRPC('ambil_pengaturan');

      if (peng.status !== 'ditutup') {
        watermarkDraft.style.display = 'block';
      } else {
        watermarkDraft.style.display = 'none';
      }

      rekapTanggal.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      rekapNamaAcara.textContent = (peng.nama_acara || 'PEMILIHAN PRATAMA PRAMUKA').toUpperCase();

      rekapTotalSuara.textContent = (data.total_suara || 0).toLocaleString('id-ID');
      rekapTokenTotal.textContent = ring.token_total || 0;
      rekapTokenTerpakai.textContent = ring.terpakai || 0;
      rekapTokenSisa.textContent = (ring.token_total || 0) - (ring.terpakai || 0);

      rekapTbodyPaslon.innerHTML = '';
      (data.paslon || []).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">
            ${String(p.nomor_urut).padStart(2, '0')}
          </td>
          <td style="border: 1px solid #000; padding: 6px;">
            <strong>${p.nama_putri}</strong><br>
            <span style="font-size: 11px; color: #444;">${p.asal_putri || '-'}</span>
          </td>
          <td style="border: 1px solid #000; padding: 6px;">
            <strong>${p.nama_putra}</strong><br>
            <span style="font-size: 11px; color: #444;">${p.asal_putra || '-'}</span>
          </td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">
            ${p.suara} suara
          </td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">
            ${p.persen}%
          </td>
        `;
        rekapTbodyPaslon.appendChild(tr);
      });
    } catch (e) {}
  }

  btnEksporCsv.addEventListener('click', async () => {
    try {
      const data = await panggilAdminRPC('admin_ekspor_hasil');
      let csv = '\uFEFFNomor Urut,Calon Pratama Putri,Calon Pratama Putra,Asal Putri,Asal Putra,Perolehan Suara,Persentase\n';
      (data.paslon || []).forEach(p => {
        csv += `"${p.nomor_urut}","${p.nama_putri}","${p.nama_putra}","${p.asal_putri || ''}","${p.asal_putra || ''}",${p.suara},"${p.persen}%"\n`;
      });
      csv += `\nTotal Suara Sah,,,,,${data.total_suara},100%\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap-hasil-pratama-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(`Gagal ekspor CSV: ${e.message}`);
    }
  });

  // TAB 6: DATABASE & SQL
  function muatTampilanDatabaseDanSql() {
    cfgMode.value = window.CONFIG.MODE || 'tiruan';
    cfgSupabaseUrl.value = window.CONFIG.SUPABASE_URL === 'ISI_URL_PROYEK' ? '' : window.CONFIG.SUPABASE_URL;
    cfgSupabaseKey.value = window.CONFIG.SUPABASE_KEY === 'ISI_KUNCI_PUBLIK' ? '' : window.CONFIG.SUPABASE_KEY;

    fetch('./supabase_schema.sql')
      .then(res => res.text())
      .then(sql => {
        areaSqlView.value = sql;
      })
      .catch(() => {
        areaSqlView.value = '-- Skema tersimpan di file supabase_schema.sql';
      });
  }

  formConfigOverride.addEventListener('submit', () => {
    const mode = cfgMode.value;
    const url = cfgSupabaseUrl.value.trim();
    const key = cfgSupabaseKey.value.trim();

    window.CONFIG.MODE = mode;
    if (url) window.CONFIG.SUPABASE_URL = url;
    if (key) window.CONFIG.SUPABASE_KEY = key;

    pesanStatusKoneksi.textContent = '✓ Pengaturan tersimpan untuk sesi browser ini.';
    pesanStatusKoneksi.style.color = 'var(--sukses)';
    cekStatusLogin();
  });

  btnTestKoneksi.addEventListener('click', async () => {
    pesanStatusKoneksi.textContent = 'Menghubungkan ke Supabase...';
    pesanStatusKoneksi.style.color = 'var(--teks-pudar)';

    try {
      const data = await panggilRPC('ambil_pengaturan');
      pesanStatusKoneksi.textContent = `✓ Berhasil terhubung! Status: ${data.status} (Jam Server: ${formatWaktuIndo(data.waktu_server)})`;
      pesanStatusKoneksi.style.color = 'var(--sukses)';
    } catch (e) {
      pesanStatusKoneksi.textContent = `✕ Gagal terhubung: ${e.message}`;
      pesanStatusKoneksi.style.color = 'var(--bahaya)';
    }
  });

  btnSalinSql.addEventListener('click', () => {
    areaSqlView.select();
    navigator.clipboard.writeText(areaSqlView.value)
      .then(() => alert('Seluruh skema SQL Supabase berhasil disalin ke clipboard!'))
      .catch(() => alert('Silakan salin manual dari kotak teks.'));
  });

  // INISIALISASI
  cekStatusLogin();
});
