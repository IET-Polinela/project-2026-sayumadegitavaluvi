const routes = {

    '#login': `
        <div class="login-shell">
            <div class="container">
                <div class="row g-4 align-items-stretch justify-content-center">

                    <div class="col-lg-6">
                        <div class="login-info p-4 p-md-5 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <span class="hero-kicker">
                                    <i class="bi bi-shield-check"></i>
                                    Citizen Access
                                </span>

                                <h1 class="fw-bold display-6 mt-3 mb-3">
                                    Portal Laporan Warga
                                </h1>

                                <p class="mb-0" style="line-height:1.8;color:rgba(255,255,255,0.88);">
                                    Laporkan masalah kota, pantau status penanganan, dan lihat perkembangan laporan masyarakat secara real-time melalui Citizen Portal.
                                </p>
                            </div>

                            <div class="row g-3 mt-4 position-relative" style="z-index:2;">
                                <div class="col-6">
                                    <div class="p-3 rounded-4" style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.18);">
                                        <i class="bi bi-lightning-charge-fill fs-3"></i>
                                        <div class="fw-bold mt-2">Cepat</div>
                                        <small style="color:rgba(255,255,255,0.80);">Laporan dikirim melalui API.</small>
                                    </div>
                                </div>

                                <div class="col-6">
                                    <div class="p-3 rounded-4" style="background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.18);">
                                        <i class="bi bi-eye-slash-fill fs-3"></i>
                                        <div class="fw-bold mt-2">Anonim</div>
                                        <small style="color:rgba(255,255,255,0.80);">Identitas pelapor tetap disamarkan.</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-5">
                        <div class="card login-card border-0 p-4 p-md-5 h-100 justify-content-center">
                            <div class="text-center mb-4">
                                <div class="profile-avatar mb-3">
                                    <i class="bi bi-person-lock fs-1"></i>
                                </div>
                                <h4 class="fw-bold mb-1">Login Warga</h4>
                                <p class="text-muted mb-0">Masuk untuk mengakses dashboard laporan.</p>
                            </div>

                            <form id="loginForm">
                                <div class="mb-3">
                                    <label class="form-label fw-semibold">Username</label>
                                    <div class="input-group">
                                        <span class="input-group-text border-0" style="border-radius:16px 0 0 16px;background:#edf8f8;">
                                            <i class="bi bi-person text-primary"></i>
                                        </span>
                                        <input type="text" id="loginUsername" class="form-control" placeholder="Masukkan username" required>
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label fw-semibold">Password</label>
                                    <div class="input-group">
                                        <span class="input-group-text border-0" style="border-radius:16px 0 0 16px;background:#edf8f8;">
                                            <i class="bi bi-key text-primary"></i>
                                        </span>
                                        <input type="password" id="loginPassword" class="form-control" placeholder="Masukkan password" required>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary w-100 fw-bold py-3">
                                    Masuk Dashboard
                                    <i class="bi bi-arrow-right-circle ms-1"></i>
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `,

    '#dashboard': `
        <div class="dashboard-hero">
            <div class="row align-items-center g-3 position-relative" style="z-index:2;">
                <div class="col-lg-8">
                    <span class="hero-kicker">
                        <i class="bi bi-grid-1x2-fill"></i>
                        Citizen Dashboard
                    </span>
                    <h1 class="hero-title">
                        Pantau Laporan Smart City
                    </h1>
                    <p class="hero-subtitle">
                        Kelola draft laporan, ajukan laporan baru, dan lihat feed kota dalam satu tampilan yang terhubung langsung ke backend Django REST Framework.
                    </p>
                </div>

                <div class="col-lg-4 text-lg-end">
                    <button
                        id="btnOpenReportModal"
                        class="btn btn-light fw-bold px-4 py-3"
                        style="color:#063f47;border-radius:18px;"
                    >
                        <i class="bi bi-plus-circle-fill me-2"></i>
                        Laporan Baru
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-4">

            <!-- Sidebar Kiri -->
            <aside class="col-12 col-lg-3">
                <div class="card soft-card border-0 p-3 sticky-top" style="top:96px;">

                    <div class="d-flex align-items-center gap-2 mb-3">
                        <div class="report-icon">
                            <i class="bi bi-bar-chart-fill"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0">Rekap Status</h6>
                            <small class="text-muted">Laporan Saya</small>
                        </div>
                    </div>

                    <div id="summaryContainer">
                        <div class="summary-row">
                            <span class="summary-label">
                                <i class="bi bi-file-earmark text-secondary"></i>
                                Draft
                            </span>
                            <span class="fw-bold badge bg-secondary">0</span>
                        </div>

                        <div class="summary-row">
                            <span class="summary-label">
                                <i class="bi bi-megaphone text-warning"></i>
                                Reported
                            </span>
                            <span class="fw-bold badge bg-warning text-dark">0</span>
                        </div>

                        <div class="summary-row">
                            <span class="summary-label">
                                <i class="bi bi-patch-check text-info"></i>
                                Verified
                            </span>
                            <span class="fw-bold badge bg-info text-dark">0</span>
                        </div>

                        <div class="summary-row">
                            <span class="summary-label">
                                <i class="bi bi-gear text-primary"></i>
                                In Progress
                            </span>
                            <span class="fw-bold badge bg-primary">0</span>
                        </div>

                        <div class="summary-row mb-0">
                            <span class="summary-label">
                                <i class="bi bi-check-circle text-success"></i>
                                Resolved
                            </span>
                            <span class="fw-bold badge bg-success">0</span>
                        </div>
                    </div>

                </div>
            </aside>

            <!-- Konten Tengah -->
            <section class="col-12 col-lg-6">
                <div class="card soft-card border-0 p-3 p-md-4">

                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <div>
                            <h5 class="fw-bold mb-1">Daftar Laporan</h5>
                            <small class="text-muted">Data ditarik dari API backend secara asinkron.</small>
                        </div>

                        <div class="d-flex gap-2">
                            <button id="btnMyReports" class="btn btn-primary fw-bold">
                                <i class="bi bi-folder2-open me-1"></i>
                                Laporan Saya
                            </button>
                            <button id="btnFeed" class="btn btn-outline-primary fw-bold">
                                <i class="bi bi-globe2 me-1"></i>
                                Feed Kota
                            </button>
                        </div>
                    </div>

                    <div id="listContainer">
                        <div class="text-center text-muted py-5">
                            <div class="spinner-border text-secondary mb-3"></div>
                            <p class="mb-0">Memuat data laporan...</p>
                        </div>
                    </div>

                    <div id="paginationContainer" class="mt-4"></div>

                </div>
            </section>

            <!-- Sidebar Kanan -->
            <aside class="col-12 col-lg-3">
                <div class="card soft-card border-0 p-4">

                    <div class="d-flex align-items-center gap-2 mb-4">
                        <div class="report-icon">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold text-dark mb-0">Profil Pengguna</h6>
                            <small class="text-muted">Citizen Portal</small>
                        </div>
                    </div>

                    <div class="text-center">
                        <div class="profile-avatar mb-3">
                            <i class="bi bi-person-fill fs-1"></i>
                        </div>

                        <small class="text-muted d-block">
                            Selamat Datang,
                        </small>

                        <h5 class="fw-bold mb-2" id="profileUsername">
                            Warga
                        </h5>

                        <span class="badge bg-primary">
                            Citizen
                        </span>
                    </div>

                    <hr class="my-4">

                    <div class="d-grid gap-2">
                        <div class="summary-row mb-0">
                            <span class="summary-label">
                                <i class="bi bi-check-circle text-success"></i>
                                Status Akun
                            </span>
                            <span class="badge bg-success">Aktif</span>
                        </div>

                        <div class="summary-row mb-0">
                            <span class="summary-label">
                                <i class="bi bi-shield-check text-info"></i>
                                Akses
                            </span>
                            <span class="badge bg-info text-dark">Warga</span>
                        </div>
                    </div>

                    <div class="mt-4 p-3 rounded-4" style="background:rgba(10,107,107,0.08);border:1px solid rgba(10,107,107,0.10);">
                        <small class="text-muted" style="line-height:1.7;">
                            <i class="bi bi-info-circle me-1"></i>
                            Draft hanya dapat diedit oleh pemilik laporan sebelum diajukan.
                        </small>
                    </div>
                </div>
            </aside>

        </div>
    `
};

function formatUsername(name) {
    if (!name) return 'Warga';

    return name
        .trim()
        .split(' ')
        .map(word => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function handleRouting() {
    const hash = window.location.hash || '#login';

    document.getElementById('app-content').innerHTML =
        routes[hash] || routes['#login'];

    const navbarLogout = document.getElementById('logout-btn-navbar');

    if (navbarLogout) {
        if (hash === '#dashboard') {
            navbarLogout.style.display = 'inline-block';
            navbarLogout.onclick = logout;
        } else {
            navbarLogout.style.display = 'none';
        }
    }

    if (hash === '#login') {
        setupLoginForm();
    }

    if (hash === '#dashboard') {
        const profileUsername = document.getElementById('profileUsername');

        if (profileUsername) {
            const username = localStorage.getItem('username') || 'Warga';
            profileUsername.textContent = formatUsername(username);
        }

        if (typeof setupReportModal === 'function') {
            setupReportModal();
        }

        setTimeout(() => {
            if (typeof initializeDashboard === 'function') {
                initializeDashboard();
            }
        }, 100);
    }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);