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
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                    <p>Gagal memuat data laporan.</p>
                </div>`;
        }
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) paginationContainer.innerHTML = '';
    }
}

function renderList() {
    const listContainer = document.getElementById('listContainer');
    if (!listContainer) return;

    if (allReports.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1"></i>
                <p class="mt-3">Tidak ada laporan ditemukan.</p>
            </div>`;
        return;
    }

    const badgeMap = {
        DRAFT: 'secondary', REPORTED: 'warning',
        VERIFIED: 'info', IN_PROGRESS: 'primary', RESOLVED: 'success'
    };

    const progressMap = {
        DRAFT:       { value: 10,  color: 'secondary' },
        REPORTED:    { value: 30,  color: 'warning'   },
        VERIFIED:    { value: 50,  color: 'info'      },
        IN_PROGRESS: { value: 75,  color: 'primary'   },
        RESOLVED:    { value: 100, color: 'success'   }
    };

    let html = '';
    allReports.forEach(report => {
        const badge    = badgeMap[report.status] || 'dark';
        const progress = progressMap[report.status] || { value: 0, color: 'dark' };
        const editBtn  = (report.status === 'DRAFT' && report.is_owner)
            ? `<button class="btn btn-sm btn-outline-primary mt-3" onclick="editDraft(${report.id})">
                <i class="bi bi-pencil me-1"></i>Edit Draft
               </button>`
            : '';

        const updatedAt = new Date(report.updated_at).toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        html += `
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="fw-bold mb-1">${report.title}</h5>
                            <span class="badge bg-secondary">${report.category}</span>
                        </div>
                        <span class="badge bg-${badge}">${report.status}</span>
                    </div>
                    <p class="text-muted mb-3">${report.description}</p>
                    <small class="d-block text-muted">📍 ${report.location}</small>
                    <small class="d-block text-muted">Pelapor: ${report.reporter}</small>
                    <small class="d-block text-muted mt-1">
                        <i class="bi bi-clock me-1"></i>${updatedAt}
                    </small>
                    <div class="mt-3">
                        <small class="text-muted">Progress Penanganan</small>
                        <div class="progress mt-1" style="height:8px;">
                            <div class="progress-bar bg-${progress.color}" style="width:${progress.value}%"></div>
                        </div>
                    </div>
                    ${editBtn}
                </div>
            </div>`;
    });

    listContainer.innerHTML = html;
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    let html = '<nav><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="loadDashboardData('${currentTab}', ${i})">${i}</button>
            </li>`;
    }
    html += '</ul></nav>';
    paginationContainer.innerHTML = html;
}

async function loadSummaryStats() {
    try {
        const data = await requestAPI('/api/report/?tab=my_reports&page_size=1000', 'GET');
        const reports = data.results || [];

        const draftCount      = reports.filter(r => r.status === 'DRAFT').length;
        const reportedCount   = reports.filter(r => r.status === 'REPORTED').length;
        const verifiedCount   = reports.filter(r => r.status === 'VERIFIED').length;
        const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS').length;
        const resolvedCount   = reports.filter(r => r.status === 'RESOLVED').length;

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

    const summaryContainer =
        document.getElementById('summaryContainer');

    if (!summaryContainer) return;

    summaryContainer.innerHTML = `
        <div class="d-flex justify-content-between mb-2 px-1">
            <span class="small fw-semibold text-secondary">Draft</span>
            <span class="fw-bold badge bg-secondary">${draftCount}</span>
        </div>

        <div class="d-flex justify-content-between mb-2 px-1">
            <span class="small fw-semibold text-warning">Reported</span>
            <span class="fw-bold badge bg-warning text-dark">${reportedCount}</span>
        </div>

        <div class="d-flex justify-content-between mb-2 px-1">
            <span class="small fw-semibold text-info">Verified</span>
            <span class="fw-bold badge bg-info text-dark">${verifiedCount}</span>
        </div>

        <div class="d-flex justify-content-between mb-2 px-1">
            <span class="small fw-semibold text-primary">In Progress</span>
            <span class="fw-bold badge bg-primary">${inProgressCount}</span>
        </div>

        <div class="d-flex justify-content-between px-1">
            <span class="small fw-semibold text-success">Resolved</span>
            <span class="fw-bold badge bg-success">${resolvedCount}</span>
        </div>
    `;
}

async function editDraft(id) {
    const report = allReports.find(item => item.id === id);
    if (!report) return;

    editingReportId = id;
    document.getElementById('title').value       = report.title;
    document.getElementById('category').value    = report.category;
    document.getElementById('location').value    = report.location;
    document.getElementById('description').value = report.description;

    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

async function saveReport(status) {
    try {
        const payload = {
            title:       document.getElementById('title').value,
            category:    document.getElementById('category').value,
            location:    document.getElementById('location').value,
            description: document.getElementById('description').value,
            status:      status
        };

        const endpoint = editingReportId ? `/api/report/${editingReportId}/` : '/api/report/';
        const method   = editingReportId ? 'PUT' : 'POST';

        await requestAPI(endpoint, method, payload);

        document.getElementById('reportForm').reset();
        editingReportId = null;

        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
        if (modalInstance) modalInstance.hide();

        loadDashboardData();

    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan laporan');
    }
}

function setupReportModal() {
    const btnOpen   = document.getElementById('btnOpenReportModal');
    const btnDraft  = document.getElementById('btnDraft');
    const btnSubmit = document.getElementById('btnSubmit');

    if (btnOpen) {
        btnOpen.onclick = () => {
            editingReportId = null;
            document.getElementById('reportForm').reset();
            const modal = new bootstrap.Modal(document.getElementById('reportModal'));
            modal.show();
        };
    }

    if (btnDraft)  btnDraft.onclick  = () => saveReport('DRAFT');
    if (btnSubmit) btnSubmit.onclick = () => saveReport('REPORTED');
}

function initializeDashboard() {
    const btnMyReports = document.getElementById('btnMyReports');
    const btnFeed      = document.getElementById('btnFeed');

    if (btnMyReports) {
        btnMyReports.onclick = () => {
            btnMyReports.classList.replace('btn-outline-primary', 'btn-primary');
            if (btnFeed) btnFeed.classList.replace('btn-primary', 'btn-outline-primary');
            loadDashboardData('my_reports', 1);
        };
    }

    if (btnFeed) {
        btnFeed.onclick = () => {
            btnFeed.classList.replace('btn-outline-primary', 'btn-primary');
            if (btnMyReports) btnMyReports.classList.replace('btn-primary', 'btn-outline-primary');
            loadDashboardData('feed', 1);
        };
    }

    setupReportModal();
    loadDashboardData('my_reports', 1);
}

window.initializeDashboard = initializeDashboard;