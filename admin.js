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
  const btnEksporPdfKupon = document.getElementById('btn-ekspor-pdf-kupon');
  const selectBatchEksporPdf = document.getElementById('select-batch-ekspor-pdf');
  const kotakProgresPdf = document.getElementById('kotak-progres-pdf');
  const teksProgresPdf = document.getElementById('teks-progres-pdf');
  const persenProgresPdf = document.getElementById('persen-progres-pdf');
  const barProgresPdf = document.getElementById('bar-progres-pdf');
  const wadahAksiUnduhManual = document.getElementById('wadah-aksi-unduh-manual');
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
      perbaruiPilihanBatchEksporPdf();
    } catch (e) {}
  }

  function perbaruiPilihanBatchEksporPdf() {
    if (!selectBatchEksporPdf) return;
    const nilaiLama = selectBatchEksporPdf.value;
    const batchSet = new Set();
    daftarTokenCache.forEach(t => {
      if (t.batch && t.batch.trim()) {
        batchSet.add(t.batch.trim());
      }
    });

    const daftarBatch = Array.from(batchSet).sort();
    selectBatchEksporPdf.innerHTML = '<option value="__SEMUA__">Semua Batch (Token Aktif)</option>';
    daftarBatch.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = `Batch: ${b}`;
      selectBatchEksporPdf.appendChild(opt);
    });

    if (daftarBatch.includes(nilaiLama) || nilaiLama === '__SEMUA__') {
      selectBatchEksporPdf.value = nilaiLama;
    }
  }

  // TAMPILAN FORMAT TOKEN 4 KARAKTER TERPISAH STRIP (HANYA UNTUK TAMPILAN)
  function formatTampilanToken4Karakter(kode) {
    if (!kode) return '';
    const bersih = String(kode).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!bersih) return kode;
    const kelompok = bersih.match(/.{1,4}/g);
    return kelompok ? kelompok.join('-') : bersih;
  }

  // FUNGSI BANTU CANVAS: GAMBAR ROUNDED RECTANGLE MANUAL (TANPA DEPENDENSI BROWSER)
  function drawManualRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
    let r = radius;
    if (typeof r === 'number') {
      r = { tl: r, tr: r, br: r, bl: r };
    } else {
      r = Object.assign({ tl: 0, tr: 0, br: 0, bl: 0 }, r);
    }
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + width - r.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
    ctx.lineTo(x + width, y + height - r.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
    ctx.lineTo(x + r.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // FUNGSI BANTU CANVAS: GAMBAR PATH BINTANG
  function drawStarPath(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  // GAMBAR 1 KUPON KE CANVAS (UKURAN 566 x 320 px)
  function gambarKuponKeCanvas(ctx, x, y, w, h, t, config, colors, isDemo) {
    const { warnaUtama, warnaAksen, warnaLatar, warnaTeks, warnaPudar } = colors;

    // 1. Latar Krem Kupon
    ctx.fillStyle = warnaLatar;
    drawManualRoundRect(ctx, x, y, w, h, 14, true, false);

    // 2. Bingkai Emas Tipis Di Dalam
    ctx.strokeStyle = warnaAksen;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    drawManualRoundRect(ctx, x + 3, y + 3, w - 6, h - 6, 11, false, true);

    // 3. Garis Potong Putus-Putus Luar
    ctx.strokeStyle = warnaUtama;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    drawManualRoundRect(ctx, x, y, w, h, 14, false, true);
    ctx.setLineDash([]);

    // 4. Pita Judul Atas
    ctx.fillStyle = warnaUtama;
    drawManualRoundRect(ctx, x + 3, y + 3, w - 6, 42, { tl: 11, tr: 11, br: 0, bl: 0 }, true, false);

    // Ikon Bintang di Pita Kiri
    drawStarPath(ctx, x + 24, y + 24, 5, 9, 4.5);
    ctx.fillStyle = '#fbe69d';
    ctx.fill();

    // Nama Acara
    const judulAcara = (config.NAMA_ACARA || 'PEMILIHAN PRATAMA PRAMUKA').toUpperCase();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(judulAcara, x + 40, y + 24);

    // Batch Badge di Kanan
    if (t.batch && t.batch.trim()) {
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#fbe69d';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.batch.trim(), x + w - 16, y + 24);
    }

    // 5. Label "KODE TOKEN KAMU"
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = warnaPudar;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KODE TOKEN KAMU', x + w / 2, y + 70);

    // 6. Kotak Putih Berbingkai Token
    const boxW = 390;
    const boxH = 66;
    const boxX = x + (w - boxW) / 2;
    const boxY = y + 86;

    ctx.fillStyle = '#ffffff';
    drawManualRoundRect(ctx, boxX, boxY, boxW, boxH, 8, true, false);
    ctx.strokeStyle = warnaAksen;
    ctx.lineWidth = 2;
    drawManualRoundRect(ctx, boxX, boxY, boxW, boxH, 8, false, true);

    // 7. Kode Token Monospace Besar (Ukuran Menyesuaikan Otomatis)
    const kodeTampil = formatTampilanToken4Karakter(t.kode);
    let fontSize = 36;
    ctx.font = `bold ${fontSize}px monospace`;
    while (ctx.measureText(kodeTampil).width > 360 && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px monospace`;
    }
    ctx.fillStyle = warnaUtama;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(kodeTampil, x + w / 2, boxY + boxH / 2);

    // 8. Petunjuk Singkat
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = warnaTeks;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1. Buka alamat di bawah.  2. Ketik kode ini.  3. Pilih calon pilihanmu.', x + w / 2, y + 178);

    // 9. Area Footer Bawah
    ctx.fillStyle = 'rgba(91, 58, 30, 0.05)';
    drawManualRoundRect(ctx, x + 3, y + 204, w - 6, 113, { tl: 0, tr: 0, br: 11, bl: 11 }, true, false);
    ctx.strokeStyle = 'rgba(91, 58, 30, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 204);
    ctx.lineTo(x + w - 3, y + 204);
    ctx.stroke();

    // 10. Alamat Web Jelas & Besar
    const alamatWeb = config.ALAMAT_WEB || (typeof window !== 'undefined' ? window.location.origin : '');
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = warnaUtama;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(alamatWeb, x + w / 2, y + 242);

    // 11. Catatan Kecil
    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = warnaPudar;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Satu kode untuk satu suara. Jangan dibagikan ya!', x + w / 2, y + 282);

    // 12. Cap Miring "PERCOBAAN" Bila Mode Demo
    if (isDemo) {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(-15 * Math.PI / 180);
      ctx.strokeStyle = 'rgba(198, 40, 40, 0.38)';
      ctx.fillStyle = 'rgba(198, 40, 40, 0.38)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      drawManualRoundRect(ctx, -130, -26, 260, 52, 8, false, true);
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PERCOBAAN', 0, 0);
      ctx.restore();
    }
  }

  // GAMBAR 1 HALAMAN A4 (1240 x 1754 px) BERISI HINGGA 10 KUPON (2 KOLOM X 5 BARIS)
  function gambarHalamanA4(daftarKupon10, config, colors, isDemo) {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');

    // Latar Putih Bersih Kertas A4
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1240, 1754);

    const startX = 47;
    const startY = 47;
    const colWidth = 566;
    const rowHeight = 320;
    const gapX = 14;
    const gapY = 15;

    // Gambar Garis Potong Putus-Putus Antar Kupon
    ctx.strokeStyle = '#b8a694';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);

    // Garis Vertikal Antar Kolom
    const midX = startX + colWidth + gapX / 2;
    ctx.beginPath();
    ctx.moveTo(midX, startY - 10);
    ctx.lineTo(midX, startY + 5 * rowHeight + 4 * gapY + 10);
    ctx.stroke();

    // Garis Horizontal Antar Baris
    for (let r = 1; r < 5; r++) {
      const midY = startY + r * rowHeight + (r - 0.5) * gapY;
      ctx.beginPath();
      ctx.moveTo(startX - 10, midY);
      ctx.lineTo(startX + 2 * colWidth + gapX + 10, midY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Gambar Setiap Kupon
    daftarKupon10.forEach((t, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = startX + col * (colWidth + gapX);
      const y = startY + row * (rowHeight + gapY);
      gambarKuponKeCanvas(ctx, x, y, colWidth, rowHeight, t, config, colors, isDemo);
    });

    return canvas;
  }

  // UBAH CANVAS JADI JPEG BYTES (Uint8Array, KUALITAS 0.85)
  function canvasKeJpegBytes(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          return reject(new Error('Gagal mengonversi canvas ke gambar JPEG.'));
        }
        blob.arrayBuffer()
          .then(buf => resolve(new Uint8Array(buf)))
          .catch(reject);
      }, 'image/jpeg', 0.85);
    });
  }

  // SUSUN FILE PDF MURNI DARI ARRAY JPEG BYTES (STANDAR PDF 1.4)
  function susunPdfDariJpeg(pagesJpegBytes) {
    const P = pagesJpegBytes.length;
    const N = 2 + P * 3;
    const offsets = new Array(N + 1);
    const chunks = [];
    let currentOffset = 0;

    function pushText(str) {
      const bytes = new TextEncoder().encode(str);
      chunks.push(bytes);
      currentOffset += bytes.length;
    }

    function pushBytes(u8) {
      chunks.push(u8);
      currentOffset += u8.length;
    }

    // Header PDF 1.4
    pushText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    // 1 0 obj: Catalog
    offsets[1] = currentOffset;
    pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    // 2 0 obj: Pages
    offsets[2] = currentOffset;
    const kids = [];
    for (let k = 0; k < P; k++) {
      kids.push(`${3 + k * 3} 0 R`);
    }
    pushText(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${P} >>\nendobj\n`);

    // Objek Per Halaman
    for (let k = 0; k < P; k++) {
      const pageObjId = 3 + k * 3;
      const contentObjId = 4 + k * 3;
      const imageObjId = 5 + k * 3;
      const jpeg = pagesJpegBytes[k];

      // Page Object (Ukuran 595 x 842 pt A4)
      offsets[pageObjId] = currentOffset;
      pushText(`${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageObjId} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObjId} 0 R >>\nendobj\n`);

      // Content Stream Object
      offsets[contentObjId] = currentOffset;
      const contentStr = "q 595 0 0 842 0 0 cm /Im0 Do Q";
      pushText(`${contentObjId} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}\nendstream\nendobj\n`);

      // Image XObject Object
      offsets[imageObjId] = currentOffset;
      pushText(`${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
      pushBytes(jpeg);
      pushText("\nendstream\nendobj\n");
    }

    // Cross-Reference Table (xref)
    const xrefOffset = currentOffset;
    let xref = `xref\n0 ${N + 1}\n0000000000 65535 f \r\n`;
    for (let id = 1; id <= N; id++) {
      const offStr = String(offsets[id]).padStart(10, '0');
      xref += `${offStr} 00000 n \r\n`;
    }
    xref += `trailer\n<< /Size ${N + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    pushText(xref);

    return new Blob(chunks, { type: 'application/pdf' });
  }

  // PEMICU UNDUHAN BLOB PDF DENGAN TOMBOL CADANGAN UNTUK HP
  function unduhBlobPdf(blob, namaFile) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = namaFile;
    link.rel = 'noopener';
    document.body.appendChild(link);
    try {
      link.click();
    } catch (e) {}
    document.body.removeChild(link);

    // Sediakan tombol unduh manual di layar agar pengguna HP bisa langsung mengetuk
    if (wadahAksiUnduhManual) {
      wadahAksiUnduhManual.style.display = 'block';
      wadahAksiUnduhManual.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; background: #ffffff; padding: 10px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--sukses);">
          <div style="font-size: 13px; font-weight: 700; color: var(--sukses);">
            ✓ File PDF siap: <strong>${namaFile}</strong>
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="${url}" download="${namaFile}" class="btn btn-utama" style="min-height: 32px; padding: 4px 12px; font-size: 12px; text-decoration: none;">
              📥 Unduh PDF
            </a>
            <a href="${url}" target="_blank" class="btn btn-sekunder" style="min-height: 32px; padding: 4px 10px; font-size: 12px; text-decoration: none;">
              Buka di Tab Baru
            </a>
          </div>
        </div>
      `;
    }

    // Cabut URL setelah 3 menit agar memori HP bersih
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch (e) {}
    }, 180000);
  }

  // EKSEKUSI PEMBUATAN PDF PER BAGIAN (MAKS 20 HALAMAN / 200 KUPON PER FILE)
  async function prosesEksporBagianPdf(tokenBagian, partIdx, totalParts, batchBersih, tanggal, onSelesaiBagian) {
    const totalHalaman = Math.ceil(tokenBagian.length / 10);
    const config = window.CONFIG || {};
    const styles = getComputedStyle(document.documentElement);
    const colors = {
      warnaUtama: styles.getPropertyValue('--utama').trim() || '#5b3a1e',
      warnaAksen: styles.getPropertyValue('--aksen').trim() || '#c59b27',
      warnaLatar: styles.getPropertyValue('--latar').trim() || '#fbf6ea',
      warnaTeks: styles.getPropertyValue('--teks').trim() || '#2a2118',
      warnaPudar: styles.getPropertyValue('--teks-pudar').trim() || '#7c6a58'
    };
    const isDemo = (config.MODE === 'demo' || config.MODE === 'tiruan') || apakahModeTiruan();

    const pagesJpegBytes = [];

    for (let p = 0; p < totalHalaman; p++) {
      const nomorHalaman = p + 1;
      const persen = Math.round((nomorHalaman / totalHalaman) * 100);

      if (kotakProgresPdf && teksProgresPdf && persenProgresPdf && barProgresPdf) {
        kotakProgresPdf.style.display = 'block';
        teksProgresPdf.style.color = 'var(--utama)';
        teksProgresPdf.textContent = totalParts > 1
          ? `Bagian ${partIdx + 1}/${totalParts}: Membuat halaman ${nomorHalaman} dari ${totalHalaman}...`
          : `Membuat halaman ${nomorHalaman} dari ${totalHalaman}...`;
        persenProgresPdf.textContent = `${persen}%`;
        barProgresPdf.style.width = `${persen}%`;
      }

      // Beri jeda singkat agar progres ter-render di HP dan UI tidak membeku
      await new Promise(r => setTimeout(r, 0));

      const sepuluhKupon = tokenBagian.slice(p * 10, p * 10 + 10);
      let canvas = gambarHalamanA4(sepuluhKupon, config, colors, isDemo);
      const jpegBytes = await canvasKeJpegBytes(canvas);
      pagesJpegBytes.push(jpegBytes);

      // Lepaskan referensi canvas agar GC dapat membebaskan memori
      canvas.width = 1;
      canvas.height = 1;
      canvas = null;

      await new Promise(r => setTimeout(r, 0));
    }

    if (teksProgresPdf) {
      teksProgresPdf.textContent = 'Menyusun file PDF...';
    }
    await new Promise(r => setTimeout(r, 0));

    // Susun PDF murni
    const pdfBlob = susunPdfDariJpeg(pagesJpegBytes);
    const namaFile = totalParts > 1
      ? `kupon-${batchBersih}-${tanggal}-bagian-${partIdx + 1}.pdf`
      : `kupon-${batchBersih}-${tanggal}.pdf`;

    unduhBlobPdf(pdfBlob, namaFile);

    if (teksProgresPdf) {
      teksProgresPdf.textContent = totalParts > 1
        ? `✓ Bagian ${partIdx + 1} dari ${totalParts} (${tokenBagian.length} kupon) selesai diunduh!`
        : `✓ Selesai! File ${namaFile} (${tokenBagian.length} kupon) berhasil diunduh.`;
    }

    if (onSelesaiBagian) {
      onSelesaiBagian();
    }
  }

  // EVENT LISTENER UTAMA TOMBOL EKSPOR PDF KUPON
  if (btnEksporPdfKupon) {
    btnEksporPdfKupon.addEventListener('click', async () => {
      // 1. Kunci tombol selama proses
      btnEksporPdfKupon.disabled = true;
      const teksAsli = btnEksporPdfKupon.innerHTML;
      btnEksporPdfKupon.textContent = 'Memuat Data...';

      if (kotakProgresPdf) {
        kotakProgresPdf.style.display = 'block';
        teksProgresPdf.style.color = 'var(--utama)';
        teksProgresPdf.textContent = 'Menyiapkan data token...';
        persenProgresPdf.textContent = '0%';
        barProgresPdf.style.width = '0%';
        if (wadahAksiUnduhManual) wadahAksiUnduhManual.style.display = 'none';
      }

      try {
        const dataFresh = await panggilAdminRPC('admin_daftar_token');
        if (Array.isArray(dataFresh)) {
          daftarTokenCache = dataFresh;
          renderTabelToken();
          perbaruiPilihanBatchEksporPdf();
        }

        const selectedBatch = selectBatchEksporPdf ? selectBatchEksporPdf.value : '__SEMUA__';

        // 2. Filter token aktif dan pastikan kode token unik (tidak boleh muncul lebih dari sekali)
        const seen = new Set();
        const tokenSiapCetak = [];
        daftarTokenCache.forEach(t => {
          if (t.status === 'aktif') {
            if (selectedBatch === '__SEMUA__' || (t.batch && t.batch.trim() === selectedBatch)) {
              if (!seen.has(t.kode)) {
                seen.add(t.kode);
                tokenSiapCetak.push(t);
              }
            }
          }
        });

        // 3. Bila daftar kupon kosong, tampilkan pesan dan jangan membuat file
        if (tokenSiapCetak.length === 0) {
          alert('Tidak ada token untuk dibuat');
          if (kotakProgresPdf) kotakProgresPdf.style.display = 'none';
          btnEksporPdfKupon.disabled = false;
          btnEksporPdfKupon.innerHTML = teksAsli;
          return;
        }

        // 4. Urutan kupon diacak (Fisher-Yates) sebelum ditata
        const tokenDiacak = acakFisherYates(tokenSiapCetak);

        // 5. Format nama file (kupon-{batch}-{tanggal}.pdf, huruf kecil tanpa spasi)
        const pad = n => String(n).padStart(2, '0');
        const now = new Date();
        const tanggal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const batchBersih = (selectedBatch === '__SEMUA__' ? 'semua' : selectedBatch)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'batch';

        // 6. Pecah per 200 kupon (maksimal 20 halaman per file PDF)
        const parts = [];
        for (let i = 0; i < tokenDiacak.length; i += 200) {
          parts.push(tokenDiacak.slice(i, i + 200));
        }

        let currentPartIdx = 0;

        const jalankanPart = async (idx) => {
          await prosesEksporBagianPdf(parts[idx], idx, parts.length, batchBersih, tanggal, () => {
            if (idx + 1 < parts.length) {
              // Jika ada bagian berikutnya, sediakan tombol lanjut
              if (wadahAksiUnduhManual) {
                const btnLanjut = document.createElement('button');
                btnLanjut.className = 'btn btn-aksen';
                btnLanjut.style.cssText = 'width: 100%; margin-top: 8px; font-weight: 800; min-height: 38px;';
                btnLanjut.textContent = `▶ Unduh Bagian Berikutnya (${idx + 2} dari ${parts.length})`;
                btnLanjut.addEventListener('click', () => {
                  btnLanjut.disabled = true;
                  btnLanjut.textContent = 'Memproses Bagian Berikutnya...';
                  jalankanPart(idx + 1);
                });
                wadahAksiUnduhManual.appendChild(btnLanjut);
              }
            } else {
              // Selesai seluruh bagian
              btnEksporPdfKupon.disabled = false;
              btnEksporPdfKupon.innerHTML = teksAsli;
            }
          });
        };

        await jalankanPart(currentPartIdx);

      } catch (err) {
        if (kotakProgresPdf && teksProgresPdf) {
          teksProgresPdf.textContent = 'Gagal membuat file PDF: ' + (err.message || 'Terjadi kesalahan');
          teksProgresPdf.style.color = 'var(--bahaya)';
          if (wadahAksiUnduhManual) {
            wadahAksiUnduhManual.style.display = 'block';
            wadahAksiUnduhManual.innerHTML = `
              <button type="button" id="btn-coba-lagi-pdf" class="btn btn-sekunder" style="min-height: 34px; padding: 4px 14px; font-size: 13px;">
                🔄 Coba Lagi
              </button>
            `;
            const btnCobaLagi = document.getElementById('btn-coba-lagi-pdf');
            if (btnCobaLagi) {
              btnCobaLagi.addEventListener('click', () => {
                btnEksporPdfKupon.click();
              });
            }
          }
        }
        btnEksporPdfKupon.disabled = false;
        btnEksporPdfKupon.innerHTML = teksAsli;
      }
    });
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
