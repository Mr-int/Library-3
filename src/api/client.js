const DEFAULT_BASE_URL = '/api';

export function getBaseUrl() {
    return DEFAULT_BASE_URL;
}

export async function apiFetch(path, options = {}) {
    const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const body = options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body;

    console.log('[apiFetch] request to:', url);
    console.log('[apiFetch] method:', options.method || 'GET');
    console.log('[apiFetch] body:', options.body);

    let resp;
    try {
        resp = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body,
        });
    } catch (networkError) {
        console.error('[apiFetch] network error:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
    }

    console.log('[apiFetch] response status:', resp.status, resp.statusText);

    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.error('[apiFetch] error body:', text);
        const error = new Error(`Request failed ${resp.status}: ${text || resp.statusText}`);
        error.status = resp.status;
        error.body = text;
        throw error;
    }

    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const json = await resp.json();
        console.log('[apiFetch] json response:', json);
        return json;
    }

    const text = await resp.text();
    console.log('[apiFetch] text response:', text);
    return text;
}