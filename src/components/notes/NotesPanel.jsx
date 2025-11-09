import { useEffect, useState } from 'react';
import './NotesPanel.css';
import { getNotes } from '../../utils/note';

const NotesPanel = ({ onClose }) => {
	const [notes, setNotes] = useState([]);

	useEffect(() => {
		const load = () => setNotes(getNotes());
		load();
		const onUpdated = () => load();
		window.addEventListener('notes:updated', onUpdated);
		return () => window.removeEventListener('notes:updated', onUpdated);
	}, []);

	return (
		<div className="NotesPanelOverlay" onClick={onClose}>
			<div className="NotesPanel" onClick={(e) => e.stopPropagation()}>
				<div className="notes-header">
					<h3 className="notes-title">Заметки ({notes.length})</h3>
					<button className="notes-close" onClick={onClose} aria-label="Закрыть">×</button>
				</div>
				<div className="notes-list">
					{notes.length === 0 && <div className="notes-empty">Заметок пока нет</div>}
					{notes.map(n => (
						<div key={n.id} className="note-item">
							<div className="note-meta">
								<div className="note-book">{n.bookTitle || 'Без названия'}</div>
								{n.author && <div className="note-author">{n.author}</div>}
								<div className="note-date">{new Date(n.createdAt).toLocaleString()}</div>
							</div>
							<div className="note-text">{n.text}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default NotesPanel;