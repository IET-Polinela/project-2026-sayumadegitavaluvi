console.log('Smart City SPA Loaded');

let allReports = [];
let currentTab = 'my_reports';
let currentPage = 1;
let totalPages = 1;
let editingReportId = null;

async function loadDashboardData(tab = currentTab, page = currentPage) {
    currentTab = tab;
    currentPage = page;

    try {
        const data = await requestAPI(`/api/report/?tab=${tab}&page=${page}`, 'GET');

        allReports = data.results || [];
        const totalData = data.count || 0;
        totalPages = Math.max(1, Math.ceil(totalData / 10));

        renderList();
        renderPagination();
        loadSummaryStats();

    } catch (error) {
        console.error(error);

        const listContainer = document.getElementById('listContainer');

        if (listContainer) {
            listContainer.innerHTML = `
                <div class="text-center text-muted p-5">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <h6 class="fw-bold mt-3">Gagal Memuat Data</h6>
                    <p class="mb-0">Periksa koneksi backend atau token login.</p>
                </div>
            `;
        }

        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
    }
}

function getStatusMeta(status) {
    const meta = {
        DRAFT: {
            badge: 'secondary',
            icon: 'bi-file-earmark-text',
            label: 'Draft',
            progress: 10,
            progressColor: 'secondary'
        },
        REPORTED: {
            badge: 'warning text-dark',
            icon: 'bi-megaphone-fill',
            label: 'Reported',
            progress: 30,
            progressColor: 'warning'
        },
        VERIFIED: {
            badge: 'info text-dark',
            icon: 'bi-patch-check-fill',
            label: 'Verified',
            progress: 50,
            progressColor: 'info'
        },
        IN_PROGRESS: {
            badge: 'primary',
            icon: 'bi-gear-fill',
            label: 'In Progress',
            progress: 75,
            progressColor: 'primary'
        },
        RESOLVED: {
            badge: 'success',
            icon: 'bi-check-circle-fill',
            label: 'Resolved',
            progress: 100,
            progressColor: 'success'
        }
    };

    return meta[status] || {
        badge: 'dark',
        icon: 'bi-question-circle',
        label: status,
        progress: 0,
        progressColor: 'dark'
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

function formatName(name) {
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

function renderList() {
    const listContainer = document.getElementById('listContainer');
    if (!listContainer) return;

    if (allReports.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1"></i>
                <h6 class="fw-bold mt-3">Tidak Ada Laporan</h6>
                <p class="mb-0">Belum ada laporan yang tersedia pada tab ini.</p>
            </div>
        `;
        return;
    }

    let html = '';

    allReports.forEach(report => {
        const status = getStatusMeta(report.status);

        const editBtn = (report.status === 'DRAFT' && report.is_owner)
            ? `
                <button class="btn btn-sm btn-outline-primary mt-3" onclick="editDraft(${report.id})">
                    <i class="bi bi-pencil-square me-1"></i>
                    Edit Draft
                </button>
            `
            : '';

        const updatedAt = report.updated_at
            ? new Date(report.updated_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : '-';

        html += `
            <div class="card report-card border-0 shadow-sm mb-3">
                <div class="card-body p-4">

                    <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div class="d-flex gap-3">
                            <div class="report-icon">
                                <i class="bi ${status.icon} fs-5"></i>
                            </div>

                            <div>
                                <h5 class="fw-bold mb-2">
                                    ${escapeHtml(report.title)}
                                </h5>

                                <span class="badge" style="background:rgba(10,107,107,0.10);color:#0a6b6b;">
                                    <i class="bi bi-tag-fill me-1"></i>
                                    ${escapeHtml(report.category)}
                                </span>
                            </div>
                        </div>

                        <span class="badge bg-${status.badge}">
                            ${status.label}
                        </span>
                    </div>

                    <p class="small-muted mb-3" style="line-height:1.75;">
                        ${escapeHtml(report.description)}
                    </p>

                    <div class="row g-2 mb-3">
                        <div class="col-12">
                            <small class="d-flex align-items-start gap-2 small-muted">
                                <i class="bi bi-geo-alt-fill text-primary"></i>
                                <span>${escapeHtml(report.location)}</span>
                            </small>
                        </div>

                        <div class="col-md-6">
                            <small class="d-flex align-items-center gap-2 small-muted">
                                <i class="bi bi-person-badge text-primary"></i>
                                <span>Pelapor: ${escapeHtml(formatName(report.reporter))}</span>
                            </small>
                        </div>

                        <div class="col-md-6">
                            <small class="d-flex align-items-center gap-2 small-muted">
                                <i class="bi bi-clock-history text-primary"></i>
                                <span>${updatedAt}</span>
                            </small>
                        </div>
                    </div>

                    <div class="mt-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="fw-semibold text-muted">Progress Penanganan</small>
                            <small class="fw-bold text-muted">${status.progress}%</small>
                        </div>

                        <div class="progress" style="height:10px;">
                            <div
                                class="progress-bar bg-${status.progressColor}"
                                role="progressbar"
                                style="width:${status.progress}%"
                                aria-valuenow="${status.progress}"
                                aria-valuemin="0"
                                aria-valuemax="100">
                            </div>
                        </div>
                    </div>

                    ${editBtn}
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '<nav><ul class="pagination justify-content-center flex-wrap">';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="loadDashboardData('${currentTab}', ${i})">
                    ${i}
                </button>
            </li>
        `;
    }

    html += '</ul></nav>';

    paginationContainer.innerHTML = html;
}

async function loadSummaryStats() {
    try {
        const data = await requestAPI('/api/report/?tab=my_reports&page_size=1000', 'GET');
        const reports = data.results || [];

        const draftCount = reports.filter(r => r.status === 'DRAFT').length;
        const reportedCount = reports.filter(r => r.status === 'REPORTED').length;
        const verifiedCount = reports.filter(r => r.status === 'VERIFIED').length;
        const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS').length;
        const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;

        renderSummaryStats(draftCount, reportedCount, verifiedCount, inProgressCount, resolvedCount);

    } catch (error) {
        console.error('Summary Stats Error:', error);
    }
}

function renderSummaryStats(
    draftCount,
    reportedCount,
    verifiedCount,
    inProgressCount,
    resolvedCount
) {
    const summaryContainer = document.getElementById('summaryContainer');

    if (!summaryContainer) return;

    summaryContainer.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">
                <i class="bi bi-file-earmark text-secondary"></i>
                Draft
            </span>
            <span class="fw-bold badge bg-secondary">${draftCount}</span>
        </div>

        <div class="summary-row">
            <span class="summary-label">
                <i class="bi bi-megaphone text-warning"></i>
                Reported
            </span>
            <span class="fw-bold badge bg-warning text-dark">${reportedCount}</span>
        </div>

        <div class="summary-row">
            <span class="summary-label">
                <i class="bi bi-patch-check text-info"></i>
                Verified
            </span>
            <span class="fw-bold badge bg-info text-dark">${verifiedCount}</span>
        </div>

        <div class="summary-row">
            <span class="summary-label">
                <i class="bi bi-gear text-primary"></i>
                In Progress
            </span>
            <span class="fw-bold badge bg-primary">${inProgressCount}</span>
        </div>

        <div class="summary-row mb-0">
            <span class="summary-label">
                <i class="bi bi-check-circle text-success"></i>
                Resolved
            </span>
            <span class="fw-bold badge bg-success">${resolvedCount}</span>
        </div>
    `;
}

async function editDraft(id) {
    const report = allReports.find(item => item.id === id);
    if (!report) return;

    editingReportId = id;

    document.getElementById('title').value = report.title;
    document.getElementById('category').value = report.category;
    document.getElementById('location').value = report.location;
    document.getElementById('description').value = report.description;

    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

async function saveReport(status) {
    const btnDraft = document.getElementById('btnDraft');
    const btnSubmit = document.getElementById('btnSubmit');

    try {
        const payload = {
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            status: status
        };

        const endpoint = editingReportId ? `/api/report/${editingReportId}/` : '/api/report/';
        const method = editingReportId ? 'PUT' : 'POST';

        if (btnDraft) btnDraft.disabled = true;
        if (btnSubmit) btnSubmit.disabled = true;

        await requestAPI(endpoint, method, payload);

        document.getElementById('reportForm').reset();
        editingReportId = null;

        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
        if (modalInstance) modalInstance.hide();

        loadDashboardData();

    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan laporan');
    } finally {
        if (btnDraft) btnDraft.disabled = false;
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

function setupReportModal() {
    const btnOpen = document.getElementById('btnOpenReportModal');
    const btnDraft = document.getElementById('btnDraft');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnOpen) {
        btnOpen.onclick = () => {
            editingReportId = null;
            document.getElementById('reportForm').reset();

            const modal = new bootstrap.Modal(document.getElementById('reportModal'));
            modal.show();
        };
    }

    if (btnDraft) btnDraft.onclick = () => saveReport('DRAFT');
    if (btnSubmit) btnSubmit.onclick = () => saveReport('REPORTED');
}

function initializeDashboard() {
    const btnMyReports = document.getElementById('btnMyReports');
    const btnFeed = document.getElementById('btnFeed');

    if (btnMyReports) {
        btnMyReports.onclick = () => {
            btnMyReports.classList.remove('btn-outline-primary');
            btnMyReports.classList.add('btn-primary');

            if (btnFeed) {
                btnFeed.classList.remove('btn-primary');
                btnFeed.classList.add('btn-outline-primary');
            }

            loadDashboardData('my_reports', 1);
        };
    }

    if (btnFeed) {
        btnFeed.onclick = () => {
            btnFeed.classList.remove('btn-outline-primary');
            btnFeed.classList.add('btn-primary');

            if (btnMyReports) {
                btnMyReports.classList.remove('btn-primary');
                btnMyReports.classList.add('btn-outline-primary');
            }

            loadDashboardData('feed', 1);
        };
    }

    setupReportModal();
    loadDashboardData('my_reports', 1);
}

window.initializeDashboard = initializeDashboard;