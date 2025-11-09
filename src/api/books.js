import { apiFetch } from './client';

export async function fetchEpubPages({ path, from, to }) {
    return await apiFetch('/epub/pages', {
        method: 'POST',
        body: { path, from, to },
    });
}