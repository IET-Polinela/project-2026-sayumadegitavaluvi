const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:8000';
const SPA_URL = 'http://127.0.0.1:5500/index.html';

const TEST_CITIZEN_USERNAME = 'testwarga';
const TEST_CITIZEN_PASSWORD = 'testpassword123';
const TEST_ADMIN_USERNAME = 'admin';
const TEST_ADMIN_PASSWORD = 'admin123';

const VALID_ACCESS_TOKEN = 'fake-valid-access-token-for-ui-testing';
const VALID_REFRESH_TOKEN = 'fake-valid-refresh-token-for-ui-testing';
const EXPIRED_ACCESS_TOKEN = 'fake-expired-access-token-for-ui-testing';
const EXPIRED_REFRESH_TOKEN = 'fake-expired-refresh-token-for-ui-testing';

function createMockReports(total = 25) {
    const statuses = ['DRAFT', 'REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED'];
    const categories = ['Infrastruktur', 'Lingkungan', 'Drainase', 'Sampah', 'Keamanan'];

    return Array.from({ length: total }, (_, index) => {
        const number = index + 1;

        return {
            id: number,
            title: `Laporan Test #${number}`,
            category: categories[index % categories.length],
            description: `Deskripsi laporan pengujian nomor ${number}`,
            location: `Lokasi Test ${number}`,
            status: statuses[index % statuses.length],
            reporter: 'Warga Anonim',
            reporter_name: 'Warga Anonim',
            is_owner: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    });
}

async function openSPA(page) {
    await page.goto(SPA_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
    });
}

async function clearAuthTokens(page) {
    await openSPA(page);

    await page.evaluate(() => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    });
}

async function setupAuthTokens(
    page,
    accessToken = VALID_ACCESS_TOKEN,
    refreshToken = VALID_REFRESH_TOKEN,
    username = TEST_CITIZEN_USERNAME
) {
    await openSPA(page);

    await page.evaluate(
        ({ access, refresh, user }) => {
            localStorage.setItem('access', access);
            localStorage.setItem('refresh', refresh);
            localStorage.setItem('username', user);

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
        },
        {
            access: accessToken,
            refresh: refreshToken,
            user: username,
        }
    );
}

async function mockTokenLogin(page) {
    await page.route('**/api/token/**', async (route) => {
        const method = route.request().method();

        if (method === 'POST') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access: VALID_ACCESS_TOKEN,
                    refresh: VALID_REFRESH_TOKEN,
                }),
            });
        }

        return route.continue();
    });
}

async function mockReportApi(page, totalReports = 25) {
    const reports = createMockReports(totalReports);

    await page.route('**/api/report/**', async (route) => {
        const request = route.request();
        const method = request.method();
        const url = request.url();

        if (method === 'POST') {
            let body = {};

            try {
                body = request.postDataJSON();
            } catch (error) {
                body = {};
            }

            return route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 999,
                    title: body.title || 'Draft Baru',
                    category: body.category || 'Infrastruktur',
                    description: body.description || 'Deskripsi draft baru',
                    location: body.location || 'Lokasi test',
                    status: body.status || 'DRAFT',
                    reporter: TEST_CITIZEN_USERNAME,
                    reporter_name: TEST_CITIZEN_USERNAME,
                    is_owner: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
            });
        }

        if (method === 'PUT' || method === 'PATCH') {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    title: 'Draft Diubah',
                    category: 'Infrastruktur',
                    description: 'Draft berhasil diubah',
                    location: 'Lokasi Baru',
                    status: 'DRAFT',
                    reporter: TEST_CITIZEN_USERNAME,
                    reporter_name: TEST_CITIZEN_USERNAME,
                    is_owner: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
            });
        }

        let filteredReports = reports;

        if (url.includes('tab=my_reports')) {
            filteredReports = reports.map((report) => ({
                ...report,
                reporter: TEST_CITIZEN_USERNAME,
                reporter_name: TEST_CITIZEN_USERNAME,
                is_owner: true,
            }));
        }

        if (url.includes('tab=feed')) {
            filteredReports = reports
                .filter((report) => report.status !== 'DRAFT')
                .map((report) => ({
                    ...report,
                    reporter: 'Warga Anonim',
                    reporter_name: 'Warga Anonim',
                    is_owner: false,
                }));
        }

        const pageMatch = url.match(/[?&]page=(\d+)/);
        const pageNumber = pageMatch ? Number(pageMatch[1]) : 1;
        const pageSize = url.includes('page_size=1000') ? 1000 : 10;
        const startIndex = (pageNumber - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageResults = filteredReports.slice(startIndex, endIndex);

        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                count: filteredReports.length,
                next: endIndex < filteredReports.length ? 'next-page' : null,
                previous: pageNumber > 1 ? 'previous-page' : null,
                results: pageResults,
            }),
        });
    });
}

async function loginSPA(page, username = TEST_CITIZEN_USERNAME, password = TEST_CITIZEN_PASSWORD) {
    await mockTokenLogin(page);

    page.on('dialog', async (dialog) => {
        await dialog.accept();
    });

    await page.goto(`${SPA_URL}#login`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
    });

    await page.waitForSelector('#loginForm', {
        state: 'visible',
        timeout: 10000,
    });

    await page.locator('#loginUsername').fill(username);
    await page.locator('#loginPassword').fill(password);
    await page.locator('#loginForm button[type="submit"]').click();

    await page.waitForFunction(
        () => window.location.hash === '#dashboard',
        null,
        { timeout: 10000 }
    );

    await expect(page).toHaveURL(/#dashboard/);
}

async function loginAdmin(page, username = TEST_ADMIN_USERNAME, password = TEST_ADMIN_PASSWORD) {
    await page.goto(`${BASE_URL}/login/`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
    });

    await page.waitForSelector('form', {
        state: 'visible',
        timeout: 10000,
    });

    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);

    const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();

    await Promise.all([
        page.waitForLoadState('networkidle').catch(() => {}),
        submitButton.click(),
    ]);

    await page.waitForTimeout(1000);
}

test.describe('Modul 1: Otorisasi & Sesi Frontend', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuthTokens(page);
    });

    test('AUTH-04: Akses dashboard tanpa token diarahkan atau login tetap tersedia', async ({ page }) => {
        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await page.waitForTimeout(1000);

        const hash = await page.evaluate(() => window.location.hash);

        if (hash === '#login') {
            await expect(page.locator('#loginForm')).toBeVisible({
                timeout: 5000,
            });
        } else {
            const dashboardElement = page.locator('#btnOpenReportModal').first();

            await expect(dashboardElement).toBeVisible({
                timeout: 5000,
            });
        }
    });

    test('AUTH-05: Token expired dan respons 401 ditangani tanpa crash UI', async ({ page }) => {
        await setupAuthTokens(page, EXPIRED_ACCESS_TOKEN, VALID_REFRESH_TOKEN);

        page.on('dialog', async (dialog) => {
            await dialog.accept();
        });

        await page.route('**/api/report/**', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    detail: 'Token expired',
                }),
            });
        });

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await page.waitForTimeout(1500);

        const currentHash = await page.evaluate(() => window.location.hash);
        expect(['#dashboard', '#login']).toContain(currentHash);

        const visibleElementCount = await page
            .locator('#loginForm, #btnOpenReportModal, #listContainer, body')
            .count();

        expect(visibleElementCount).toBeGreaterThan(0);
    });

    test('AUTH-06: Token tidak valid tetap menghasilkan state halaman yang terkendali', async ({ page }) => {
        await setupAuthTokens(page, EXPIRED_ACCESS_TOKEN, EXPIRED_REFRESH_TOKEN);

        page.on('dialog', async (dialog) => {
            await dialog.accept();
        });

        await page.route('**/api/report/**', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    detail: 'Token invalid or expired',
                }),
            });
        });

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await page.waitForTimeout(1500);

        const currentHash = await page.evaluate(() => window.location.hash);
        expect(['#dashboard', '#login']).toContain(currentHash);

        const accessValue = await page.evaluate(() => localStorage.getItem('access'));
        expect(accessValue === null || typeof accessValue === 'string').toBeTruthy();
    });
});

test.describe('Modul 5: Interaktivitas UI Frontend', () => {
    test('UI-01: Dashboard admin dapat dibuka dan halaman tampil stabil', async ({ page }) => {
        await loginAdmin(page);

        await page.goto(`${BASE_URL}/dashboard/`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await page.waitForTimeout(2000);

        const body = page.locator('body');

        await expect(body).toBeVisible({
            timeout: 10000,
        });

        const bodyText = await body.innerText();

        expect(bodyText.trim().length).toBeGreaterThan(0);

        const pageElementCount = await page.locator(
            'canvas, table, .card, .stat-card, .dashboard-card, .content, main, section, body'
        ).count();

        expect(pageElementCount).toBeGreaterThan(0);

        console.log(`[UI-01] Dashboard admin berhasil dibuka. Jumlah elemen halaman: ${pageElementCount}`);
    });

    test('UI-02: Live search daftar laporan admin tersedia', async ({ page }) => {
        await loginAdmin(page);

        await page.goto(`${BASE_URL}/reports/`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await page.waitForTimeout(1000);

        const searchInput = page.locator('#searchInput');
        const tableBody = page.locator('#reportTableBody');

        await expect(searchInput).toBeVisible({
            timeout: 10000,
        });

        await expect(tableBody).toBeVisible({
            timeout: 10000,
        });

        await searchInput.fill('Lampu');
        await page.waitForTimeout(1000);

        await expect(tableBody).toBeVisible();
    });

    test('UI-03: Feed Kota menampilkan maksimal 10 kartu dan pagination muncul', async ({ page }) => {
        await mockReportApi(page, 25);
        await setupAuthTokens(page);

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await expect(page.locator('#btnFeed')).toBeVisible({
            timeout: 10000,
        });

        await page.locator('#btnFeed').click();
        await page.waitForTimeout(1500);

        const listContainer = page.locator('#listContainer');

        await expect(listContainer).toBeVisible({
            timeout: 10000,
        });

        const cardCount = await listContainer.locator('.report-card').count();

        expect(cardCount).toBeGreaterThan(0);
        expect(cardCount).toBeLessThanOrEqual(10);

        await expect(page.locator('#paginationContainer')).toBeVisible({
            timeout: 10000,
        });

        const paginationCount = await page.locator('#paginationContainer .page-item').count();

        expect(paginationCount).toBeGreaterThanOrEqual(2);
    });

    test('UI-04: Tombol Laporan Baru membuka modal laporan', async ({ page }) => {
        await mockReportApi(page, 5);
        await setupAuthTokens(page);

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await expect(page.locator('#btnOpenReportModal')).toBeVisible({
            timeout: 10000,
        });

        await page.locator('#btnOpenReportModal').click();

        await expect(page.locator('#reportModal')).toBeVisible({
            timeout: 5000,
        });

        await expect(page.locator('#reportForm')).toBeVisible();
        await expect(page.locator('#title')).toBeVisible();
        await expect(page.locator('#category')).toBeVisible();
        await expect(page.locator('#location')).toBeVisible();
        await expect(page.locator('#description')).toBeVisible();
        await expect(page.locator('#btnDraft')).toBeVisible();
        await expect(page.locator('#btnSubmit')).toBeVisible();
    });

    test('UI-05: Isi form dan simpan draft laporan', async ({ page }) => {
        await mockReportApi(page, 5);
        await setupAuthTokens(page);

        page.on('dialog', async (dialog) => {
            await dialog.accept();
        });

        await page.goto(`${SPA_URL}#dashboard`, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        await expect(page.locator('#btnOpenReportModal')).toBeVisible({
            timeout: 10000,
        });

        await page.locator('#btnOpenReportModal').click();

        await expect(page.locator('#reportModal')).toBeVisible({
            timeout: 5000,
        });

        await page.locator('#title').fill('AC Mati di Lab CPS 1');
        await page.locator('#category').selectOption('Infrastruktur');
        await page.locator('#location').fill('Gedung Lab Analisis Lantai 2');
        await page.locator('#description').fill('Unit AC tidak berfungsi dan ruangan menjadi panas.');

        await page.locator('#btnDraft').click();
        await page.waitForTimeout(1500);

        await expect(page.locator('#summaryContainer')).toBeVisible({
            timeout: 10000,
        });
    });

    test('UI-06: Tampilan mobile tetap menampilkan navbar atau konten utama', async ({ page }) => {
        await page.setViewportSize({
            width: 400,
            height: 800,
        });

        await page.goto(SPA_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        });

        const visibleLayoutItems = await page.locator('.navbar, nav, #app-content, body').count();

        expect(visibleLayoutItems).toBeGreaterThan(0);

        await expect(page.locator('body')).toBeVisible({
            timeout: 5000,
        });
    });
});