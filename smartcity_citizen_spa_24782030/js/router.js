const routes = {

    '#login': `
        <div class="row justify-content-center mt-5">
            <div class="col-md-4 card shadow-sm border-0 p-4">
                <h4 class="text-center fw-bold mb-4">Login Warga</h4>
                <form id="loginForm">
                    <input type="text" id="loginUsername" class="form-control mb-3" placeholder="Username" required>
                    <input type="password" id="loginPassword" class="form-control mb-3" placeholder="Password" required>
                    <button type="submit" class="btn btn-primary w-100 fw-bold">Masuk</button>
                </form>
            </div>
        </div>
    `,

    '#dashboard': `
        <div class="row g-4">

            <!-- Sidebar Kiri -->
            <aside class="col-12 col-lg-3">
                <div class="card border-0 p-3 shadow-sm sticky-top" style="top:20px;background-color:#ffffff;">

                    <button
                        id="btnOpenReportModal"
                        class="btn btn-primary btn-lg w-100 fw-bold my-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                        style="border-radius:12px;"
                    >
                        <i class="bi bi-plus-circle-fill fs-5"></i>
                        Laporan Baru
                    </button>

                    <hr class="text-muted my-3 opacity-25">

                    <h6 class="fw-bold text-dark mb-3 px-1">
                        <i class="bi bi-bar-chart-fill me-2 text-primary"></i>
                        Rekap Status
                    </h6>

                    <div id="summaryContainer">
                        <div class="d-flex justify-content-between mb-2 px-1">
                            <span class="small fw-semibold text-secondary">Draft</span>
                            <span class="fw-bold badge bg-secondary">0</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2 px-1">
                            <span class="small fw-semibold text-warning">Reported</span>
                            <span class="fw-bold badge bg-warning text-dark">0</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2 px-1">
                            <span class="small fw-semibold text-info">Verified</span>
                            <span class="fw-bold badge bg-info text-dark">0</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2 px-1">
                            <span class="small fw-semibold text-primary">In Progress</span>
                            <span class="fw-bold badge bg-primary">0</span>
                        </div>

                        <div class="d-flex justify-content-between px-1">
                            <span class="small fw-semibold text-success">Resolved</span>
                            <span class="fw-bold badge bg-success">0</span>
                        </div>
                    </div>

                </div>
            </aside>

            <!-- Konten Tengah -->
            <section class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm p-4" style="background:#ffffff;border-radius:16px;">

                    <div class="d-flex gap-2 mb-4">
                        <button id="btnMyReports" class="btn btn-primary fw-bold">Laporan Saya</button>
                        <button id="btnFeed" class="btn btn-outline-primary fw-bold">Feed Kota</button>
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
                <div class="card border-0 p-4 shadow-sm" style="background-color:#ffffff;border-radius:16px;">
                    <h6 class="fw-bold text-dark mb-4">
                        <i class="bi bi-person-circle me-2 text-primary"></i>
                        Profil Pengguna
                    </h6>

                    <div class="text-center">

                        <div
                            class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style="width:80px;height:80px;"
                        >
                            <i class="bi bi-person-fill fs-1 text-secondary"></i>
                        </div>

                        <small class="text-muted d-block">
                            Selamat Datang,
                        </small>

                        <h5
                            class="fw-bold mb-2"
                            id="profileUsername"
                        >
                            Warga

                        </h5>

                        <span class="badge bg-primary">
                            Citizen
                        </span>

                    </div>

                </div>
            </aside>

        </div>
    `
};

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

        const profileUsername =
            document.getElementById(
                'profileUsername'
            );

        if (profileUsername) {

            profileUsername.textContent =
                localStorage.getItem(
                    'username'
                ) || 'Warga';

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