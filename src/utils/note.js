const COOKIE_NAME = 'user_notes';
const COOKIE_MAX_AGE_DAYS = 365 * 5;

function readCookie(name) {
	const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
	return match ? decodeURIComponent(match[1]) : '';
}

function writeCookie(name, value, days) {
	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getNotes() {
	try {
		const raw = readCookie(COOKIE_NAME);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function addNote(note) {
	const notes = getNotes();
	const item = {
		id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		createdAt: new Date().toISOString(),
		...note
	};
	notes.push(item);
	writeCookie(COOKIE_NAME, JSON.stringify(notes), COOKIE_MAX_AGE_DAYS);
	// уведомим UI, что заметки изменились
	window.dispatchEvent(new Event('notes:updated'));
	return item;
}