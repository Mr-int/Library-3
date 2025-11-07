import { apiFetch } from './client';

// POST /epub/pages expects body: { path: string, from: number, to: number }
export async function fetchEpubPages({ path, from, to }) {
    return await apiFetch('/epub/pages', {
        method: 'POST',
        body: { path, from, to },
    });
}


