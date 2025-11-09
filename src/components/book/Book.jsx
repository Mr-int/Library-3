import { useEffect, useMemo, useRef, useState } from 'react';
import './Book.css';
import { fetchEpubPages } from '../../api/books';
import { addNote } from '../../utils/note';
import bookmarkIcon from "../../assets/header/bookmark.svg";
import lightBookmarkIcon from "../../assets/header/LightBookmark.svg";

const Book = ({ currentPage, onTotalPagesChange }) => {
	const [searchParams] = useState(() => {
		if (typeof window === 'undefined') return { path: null, title: null, page: 1, text: null };

		const urlParams = new URLSearchParams(window.location.search);
		const path = urlParams.get('path');
		const title = urlParams.get('title');
		const page = parseInt(urlParams.get('page')) || 1;
		const text = urlParams.get('text');

		return { path, title, page, text };
	});

	const bookPath = searchParams.path;
	const title = searchParams.title;
	const initialPage = searchParams.page;
	const initialText = searchParams.text;

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [meta, setMeta] = useState({ author: '', title: '' });
	const [pages, setPages] = useState([]);
	const [totalPages, setTotalPages] = useState(0);

	const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
	const containerRef = useRef(null);

	useEffect(() => {
		if (initialPage && initialPage !== currentPage) {
			onTotalPagesChange(initialPage);
		}
	}, [initialPage, currentPage, onTotalPagesChange]);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			if (!bookPath) {
				setError('Не указан путь к книге');
				return;
			}

			setLoading(true);
			setError('');
			try {
				const from = currentPage;
				const to = currentPage;

				const data = await fetchEpubPages({ path: bookPath, from, to });
				if (cancelled) return;

				const respTitle = data?.title || title || '';
				const respAuthor = data?.author || '';
				const respPages = Array.isArray(data?.pages) ? data.pages : [];

				setMeta({ title: respTitle, author: respAuthor });
				setPages(respPages);

				const total = data?.total || 100;
				setTotalPages(total);
				onTotalPagesChange(total);
			} catch (e) {
				if (cancelled) return;
				setError(e?.message || 'Ошибка загрузки книги');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => { cancelled = true; };
	}, [bookPath, currentPage, title, onTotalPagesChange]);

	const header = meta.title && meta.author
		? `${meta.title} — ${meta.author}`
		: (meta.title || title || 'Книга');

	const currentPageData = pages[currentPage - 1] || [];

	const getSelectionText = () => {
		const sel = window.getSelection && window.getSelection();
		if (!sel || sel.isCollapsed) return '';
		return sel.toString().trim();
	};

	const showSelectionTooltip = () => {
		const text = getSelectionText();
		if (!text) {
			hideTooltip();
			return;
		}
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) return;
		const rangeObj = sel.getRangeAt(0);
		const rect = rangeObj.getBoundingClientRect();
		const container = containerRef.current;
		if (!container) return;
		const containerRect = container.getBoundingClientRect();

		const x = Math.min(
			Math.max(rect.left + rect.width / 2, containerRect.left + 12),
			containerRect.right - 12
		);
		const y = Math.max(rect.top, containerRect.top + 12);

		setTooltip({
			visible: true,
			x: x - containerRect.left,
			y: y - containerRect.top,
			text
		});
	};

	const hideTooltip = () => {
		setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
	};

	useEffect(() => {
		const onMouseUp = (e) => {
			const content = containerRef.current?.querySelector('.content-text');
			if (!content) return;
			if (content.contains(e.target)) {
				setTimeout(showSelectionTooltip, 0);
			} else {
				hideTooltip();
			}
		};
		const onScroll = () => hideTooltip();
		document.addEventListener('mouseup', onMouseUp);
		containerRef.current?.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			document.removeEventListener('mouseup', onMouseUp);
			containerRef.current?.removeEventListener('scroll', onScroll);
		};
	}, []);

	const handleCopy = async () => {
		const text = tooltip.text;
		if (!text) {
			alert('Нет выделенного текста');
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			alert('Скопировано');
		} catch (e) {
			try {
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.opacity = '0';
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
				alert('Скопировано (fallback)');
			} catch (err) {
				alert('Не удалось скопировать');
			}
		}
		hideTooltip();
		window.getSelection()?.removeAllRanges();
	};

	const handleBookmark = () => {
		const text = tooltip.text;
		if (!text) {
			alert('Нет выделенного текста');
			return;
		}
		try {
			addNote({
				bookTitle: meta.title || title || 'Книга',
				author: meta.author || '',
				text
			});
			alert('Добавлено в заметки');
		} catch (e) {
			alert('Не удалось добавить в заметки');
		}
		hideTooltip();
		window.getSelection()?.removeAllRanges();
	};

	const bookmarkImg = document.documentElement.getAttribute('data-theme') === 'light' ? lightBookmarkIcon : bookmarkIcon;

	const showInitialText = initialText && currentPage === initialPage;

	const renderPageContent = () => {
		if (!Array.isArray(currentPageData)) return null;

		return currentPageData.map((html, index) => (
			<div
				key={index}
				className="content-text"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		));
	};

	return (
		<div className="book-content" ref={containerRef}>
			<div className="page">
				<div className="book-author">{header}</div>

				{loading && <h1 className="chapter-title">Загрузка…</h1>}
				{error && <h1 className="chapter-title">{error}</h1>}
				{!loading && !error && !bookPath && (
					<div>
						<h1 className="chapter-title">Не указан путь к книге</h1>
						<p>Откройте страницу с параметрами:</p>
						<code>
							http://localhost:5173/?path=1358935243_1161/403b2114-29e2-4ab4-9a96-07a85271c97f/book.epub&title=ТестоваяКнига&page=5
						</code>
					</div>
				)}
				{!loading && !error && bookPath && pages.length === 0 && (
					<h1 className="chapter-title">Книга не найдена или пуста</h1>
				)}

				{showInitialText && (
					<div className="content-text">
						<p>{decodeURIComponent(initialText)}</p>
					</div>
				)}

				{!loading && !error && currentPageData && currentPageData.length > 0 && (
					<div>
						<h1 className="chapter-title">
							Страница {currentPage}
						</h1>
						{renderPageContent()}
					</div>
				)}
			</div>

			{tooltip.visible && (
				<div
					className="selection-tooltip"
					style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
					onMouseDown={(e) => e.preventDefault()}
				>
					<button className="selection-btn" onClick={handleCopy}>Скопировать</button>
					<div className="selection-sep"></div>
					<img
						className="selection-icon"
						src={bookmarkImg}
						alt="В заметки"
						width="18"
						height="18"
						onClick={handleBookmark}
					/>
				</div>
			)}
		</div>
	)
}

export default Book;
