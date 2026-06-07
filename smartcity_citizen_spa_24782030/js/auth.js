function setupLoginForm() {

    const loginForm =
        document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (event) {

        event.preventDefault();

        const username =
            document.getElementById('loginUsername').value;

        const password =
            document.getElementById('loginPassword').value;

        const result = await requestAPI(
            '/api/token/',
            'POST',
            {
                username: username,
                password: password
            }
        );

        if (result.access) {

            localStorage.setItem(
                'access',
                result.access
            );

            localStorage.setItem(
                'username',
                username
            );

            localStorage.setItem(
                'refresh',
                result.refresh
            );

            alert('Login berhasil!');

            window.location.hash = '#dashboard';

        } else {

            alert('Login gagal!');
        }
    });
}

function logout() {

    localStorage.removeItem('access');

    localStorage.removeItem('refresh');

    window.location.hash = '#login';
}