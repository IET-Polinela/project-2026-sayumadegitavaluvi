const routes = {

    '#login': `
        <div class="row justify-content-center mt-5">

            <div class="col-md-4 card shadow-sm border-0 p-4">

                <h4 class="text-center fw-bold mb-4">
                    Login Warga
                </h4>

                <form id="loginForm">

                    <input
                        type="text"
                        id="loginUsername"
                        class="form-control mb-3"
                        placeholder="Username"
                        required
                    >

                    <input
                        type="password"
                        id="loginPassword"
                        class="form-control mb-3"
                        placeholder="Password"
                        required
                    >

                    <button
                        type="submit"
                        class="btn btn-primary w-100 fw-bold"
                    >
                        Masuk
                    </button>

                </form>

            </div>

        </div>
    `,

    '#dashboard': `
        <div class="row g-4">

            <!-- Sidebar Kiri -->
            <aside class="col-12 col-lg-3">

                <div
                    class="card border-0 p-3 shadow-sm sticky-top"
                    style="top:20px;background-color:#ffffff;"
                >

                    <div class="d-flex align-items-center mb-3 px-2">

                        <div
                            class="bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                            style="width:40px;height:40px;"
                        >
                            <i class="bi bi-person-badge text-muted fs-5"></i>
                        </div>

                        <div>
                            <small
                                class="text-muted d-block"
                                style="font-size:11px;"
                            >
                                Selamat Datang,
                            </small>

                            <span
                                class="fw-bold text-dark"
                                style="font-size:14px;"
                            >
                                Warga Smart City
                            </span>
                        </div>

                    </div>

                    <hr class="text-muted my-2 opacity-25">

                    <button
                        class="btn btn-primary btn-lg w-100 fw-bold my-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                        style="
                            border-radius:12px;
                        "
                    >
                        <i class="bi bi-plus-circle-fill fs-5"></i>
                        Laporan Baru
                    </button>

                </div>

            </aside>

            <!-- Konten Tengah -->
            <section class="col-12 col-lg-6">

                <div
                    class="card border-0 shadow-sm text-center text-muted d-flex justify-content-center align-items-center p-4 p-lg-5"
                    style="
                        background:#ffffff;
                        min-height:300px;
                        border-radius:16px;
                    "
                >

                    <div
                        class="bg-light rounded-circle d-flex align-items-center justify-content-center mb-4"
                        style="
                            width:80px;
                            height:80px;
                            background:radial-gradient(#f8f9fa,#eef5f5);
                        "
                    >
                        <i
                            class="bi bi-chat-left-heart"
                            style="
                                font-size:2.2rem;
                                color:#0a6b6b;
                            "
                        ></i>
                    </div>

                    <h4 class="fw-bold text-dark mb-2">
                        Halo, Selamat Datang!
                    </h4>

                    <p
                        class="text-secondary mb-4"
                        style="
                            max-width:420px;
                            font-size:14px;
                            line-height:1.6;
                        "
                    >
                        Senang melihat Anda kembali.
                        Ruang aspirasi dan pelaporan warga siap membantu
                        mewujudkan lingkungan kota yang lebih baik.
                    </p>

                    <div
                        class="px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2 flex-wrap justify-content-center"
                        style="
                            background-color:#eef5f5;
                            border:1px dashed #0a6b6b;
                        "
                    >

                        <i
                            class="bi bi-cloud-arrow-down-fill"
                            style="color:#0a6b6b;"
                        ></i>

                        <small
                            class="fw-medium text-dark"
                            style="font-size:12px;"
                        >
                            Koneksi API data laporan akan diimplementasikan
                            pada <strong>Lab 12</strong>.
                        </small>

                    </div>

                </div>

            </section>

            <!-- Sidebar Kanan -->
            <aside class="col-12 col-lg-3">

                <div
                    class="card border-0 p-4 shadow-sm"
                    style="
                        background-color:#ffffff;
                        border-radius:16px;
                    "
                >

                    <h6
                        class="fw-bold text-dark d-flex align-items-center gap-2 mb-3"
                    >

                        <span
                            class="p-1 rounded d-flex align-items-center justify-content-center"
                            style="
                                background-color:
                                rgba(10,107,107,0.1);
                            "
                        >

                            <i
                                class="bi bi-info-circle-fill"
                                style="color:#0a6b6b;"
                            ></i>

                        </span>

                        Pengumuman

                    </h6>

                    <div
                        class="p-3 rounded-3"
                        style="
                            background-color:#f8f9fa;
                            border-left:4px solid #0a6b6b;
                        "
                    >

                        <small
                            class="text-muted d-block mb-1"
                            style="font-size:11px;"
                        >
                            Informasi Sistem
                        </small>

                        <p
                            class="mb-0 fw-semibold text-dark"
                            style="font-size:13px;"
                        >
                            Informasi terbaru dari admin dan layanan
                            warga akan ditampilkan pada bagian ini.
                        </p>

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

    const navbarLogout =
        document.getElementById('logout-btn-navbar');

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
}

window.addEventListener(
    'hashchange',
    handleRouting
);

window.addEventListener(
    'DOMContentLoaded',
    handleRouting
);