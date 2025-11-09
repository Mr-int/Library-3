const STORAGE_KEY = 'book-notes';

export const getNotes = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		console.error('Ошибка загрузки заметок:', e);
		return [];
	}
};

export const addNote = (noteData) => {
	try {
		const notes = getNotes();
		const newNote = {
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			...noteData
		};

		const updatedNotes = [newNote, ...notes];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));

		window.dispatchEvent(new CustomEvent('notes:updated'));

		return true;
	} catch (e) {
		console.error('Ошибка сохранения заметки:', e);
		return false;
	}
};

export const deleteNote = (id) => {
	try {
		const notes = getNotes();
		const updatedNotes = notes.filter(note => note.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
		window.dispatchEvent(new CustomEvent('notes:updated'));
		return true;
	} catch (e) {
		console.error('Ошибка удаления заметки:', e);
		return false;
	}
};