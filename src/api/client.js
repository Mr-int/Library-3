// Используем относительный путь, чтобы работать через Vite proxy в dev
const DEFAULT_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || '/api';

export function getBaseUrl() {
    return DEFAULT_BASE_URL.replace(/\/$/, '');
}

export async function apiFetch(path, options = {}) {
    const url = `${getBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = {
        'Accept': 'application/json',
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
    };
    const body = options.body && !(options.body instanceof FormData) && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body;

    console.groupCollapsed('[apiFetch] request');
    console.log('URL:', url);
    console.log('method:', options.method || 'GET');
    console.log('headers:', headers);
    if (body) {
        try { console.log('body:', typeof body === 'string' ? JSON.parse(body) : body); } catch { console.log('body(raw):', body); }
    }
    console.groupEnd();

    let resp;
    try {
        resp = await fetch(url, {
            headers,
            ...options,
            body,
        });
    } catch (networkError) {
        console.error('[apiFetch] network error:', networkError);
        throw networkError;
    }

    console.groupCollapsed('[apiFetch] response');
    console.log('status:', resp.status, resp.statusText);
    console.log('ok:', resp.ok);
    console.log('url:', resp.url);
    console.log('headers:', Object.fromEntries(resp.headers.entries()));
    console.groupEnd();

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
        console.log('[apiFetch] json:', json);
        return json;
    }
    const text = await resp.text();
    console.log('[apiFetch] text:', text);
    return text;
}


