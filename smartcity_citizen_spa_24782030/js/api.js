const BASE_URL = 'http://127.0.0.1:8000';

async function requestAPI(endpoint, method = 'GET', bodyData = null) {
    const accessToken = localStorage.getItem('access');

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (bodyData) {
        options.body = JSON.stringify(bodyData);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return response.json();
}