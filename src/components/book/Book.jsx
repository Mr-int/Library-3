import { useEffect, useRef, useState } from 'react';
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
	const initialText = searchParams.text;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [meta, setMeta] = useState({ author: '', title: '' });
	const [pages, setPages] = useState([]);
	const [totalPages, setTotalPages] = useState(0);

	const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
	const containerRef = useRef(null);

	const formatBookTitle = (title) => {
		if (!title) return '';
		return title.replace(/%20/g, ' ').replace(/_/g, ' ');
	};

	useEffect(() => {
		let cancelled = false;

		async function loadPages() {
			if (!bookPath) {
				setError('Не указан путь к книге');
				setLoading(false);
				return;
			}

			setLoading(true);
			setError('');

			try {
				const from = Math.max(1, currentPage - 4);
				const to = currentPage + 4;

				const data = await fetchEpubPages({
					path: bookPath,
					from: from,
					to: to
				});

				if (cancelled) return;

				const respTitle = data?.title || title || '';
				const respAuthor = data?.author || '';
				const respPages = Array.isArray(data?.pages) ? data.pages : [];

				setMeta({ title: respTitle, author: respAuthor });

				if (respPages.length > 0) {
					const currentPageIndex = currentPage - from;
					if (currentPageIndex >= 0 && currentPageIndex < respPages.length) {
						setPages([respPages[currentPageIndex]]);
					} else {
						setError('Текущая страница не найдена в ответе');
					}
				} else {
					setError('Страницы не найдены');
				}

				const total = data?.total;
				if (total && total !== totalPages) {
					setTotalPages(total);
					onTotalPagesChange(total);
				}
			} catch (e) {
				if (cancelled) return;
				setError(e?.message || 'Ошибка загрузки книги');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		loadPages();
	}, [bookPath, currentPage, title, onTotalPagesChange, totalPages]);

	const displayTitle = formatBookTitle(meta.title || title);
	const header = displayTitle && meta.author
		? `${displayTitle} — ${meta.author}`
		: (displayTitle || 'Книга');

	const currentPageData = pages[0] || [];

	const getSelectionText = () => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			return '';
		}

		const text = selection.toString().trim();
		return text.length > 1 ? text : ''; // Минимум 2 символа
	};

	const showSelectionTooltip = () => {
		const text = getSelectionText();
		if (!text) {
			hideTooltip();
			return;
		}

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		const container = containerRef.current;

		if (!container) return;

		const containerRect = container.getBoundingClientRect();

		const x = rect.left + (rect.width / 2) - containerRect.left;
		const y = rect.top - containerRect.top - 45;

		setTooltip({
			visible: true,
			x: Math.max(60, Math.min(x, containerRect.width - 60)),
			y: Math.max(10, y),
			text
		});
	};

	const hideTooltip = () => {
		setTooltip(prev => ({ ...prev, visible: false }));
	};

	useEffect(() => {
		const handleSelectionChange = () => {
			const text = getSelectionText();
			if (text) {
				showSelectionTooltip();
			} else {
				hideTooltip();
			}
		};

		const handleMouseUp = () => {
			setTimeout(handleSelectionChange, 10);
		};

		const handleClick = (e) => {
			if (!e.target.closest('.selection-tooltip')) {
				hideTooltip();
			}
		};

		const handleScroll = () => {
			hideTooltip();
		};

		document.addEventListener('mouseup', handleMouseUp);
		document.addEventListener('click', handleClick);
		document.addEventListener('scroll', handleScroll, true);

		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('scroll', handleScroll, true);
		};
	}, []);

	const handleCopy = async () => {
		const text = tooltip.text;
		if (!text) return;

		try {
			await navigator.clipboard.writeText(text);
			// Без alert
		} catch (e) {
			try {
				const textArea = document.createElement('textarea');
				textArea.value = text;
				textArea.style.position = 'fixed';
				textArea.style.opacity = '0';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
			} catch (err) {
				// Без alert
			}
		}
		hideTooltip();
		window.getSelection()?.removeAllRanges();
	};

	const handleBookmark = () => {
		const text = tooltip.text;
		if (!text) return;

		try {
			const success = addNote({
				bookTitle: displayTitle || 'Книга',
				author: meta.author || '',
				text: text
			});

			// Без alert - просто добавляем
		} catch (e) {
			console.error('Ошибка добавления заметки:', e);
		}
		hideTooltip();
		window.getSelection()?.removeAllRanges();
	};

	const bookmarkImg = document.documentElement.getAttribute('data-theme') === 'light' ? lightBookmarkIcon : bookmarkIcon;

	const showInitialText = initialText && currentPage === parseInt(searchParams.page);

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
					style={{
						left: `${tooltip.x}px`,
						top: `${tooltip.y}px`
					}}
					onMouseDown={(e) => e.preventDefault()}
				>
					<button className="selection-btn" onClick={handleCopy}>Скопировать</button>
					<div className="selection-sep"></div>
					<button className="selection-btn" onClick={handleBookmark}>
						<img
							src={bookmarkImg}
							alt="В заметки"
							width="18"
							height="18"
						/>
					</button>
				</div>
			)}
		</div>
	)
}

export default Book;