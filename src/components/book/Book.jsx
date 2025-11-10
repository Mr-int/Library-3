import { useEffect, useRef, useState } from 'react';
import './Book.css';
import { fetchEpubPages } from '../../api/books';
import { addNote } from '../../utils/note';
import bookmarkIcon from "../../assets/header/bookmark.svg";
import lightBookmarkIcon from "../../assets/header/LightBookmark.svg";

const Book = ({ currentPage, totalPages = 10, onTotalPagesChange, onPageChange }) => {
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
	const [internalTotalPages, setInternalTotalPages] = useState(0);

	const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
	const containerRef = useRef(null);
	
	// Состояние для отслеживания свайпа
	const touchStartRef = useRef(null);
	const touchMoveRef = useRef(null);

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
				if (total && total !== internalTotalPages) {
					setInternalTotalPages(total);
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
	}, [bookPath, currentPage, title, onTotalPagesChange, internalTotalPages]);

	const displayTitle = formatBookTitle(meta.title || title);
	const header = displayTitle && meta.author
		? `${displayTitle} — ${meta.author}`
		: (displayTitle || 'Книга');

	const currentPageData = pages[0] || [];

	const getSelectionText = () => {
		const sel = window.getSelection && window.getSelection();
		if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
		
		try {
			// Используем Range API для извлечения чистого текста
			const range = sel.getRangeAt(0).cloneRange();
			const container = containerRef.current;
			
			if (!container) {
				// Fallback на стандартный метод
				return sel.toString().trim();
			}

			// Проверяем, что выделение находится внутри контента книги
			const contentElements = container.querySelectorAll('.content-text');
			let isInContent = false;
			
			// Получаем контейнер, в котором находится выделение
			const commonAncestor = range.commonAncestorContainer;
			const nodeToCheck = commonAncestor.nodeType === Node.TEXT_NODE 
				? commonAncestor.parentNode 
				: commonAncestor;
			
			for (const contentEl of contentElements) {
				// Проверяем, содержится ли узел выделения в элементе контента
				if (contentEl.contains(nodeToCheck) || contentEl === nodeToCheck) {
					// Дополнительно проверяем, что начало и конец диапазона тоже в контенте
					const startContainer = range.startContainer;
					const endContainer = range.endContainer;
					const startNode = startContainer.nodeType === Node.TEXT_NODE 
						? startContainer.parentNode 
						: startContainer;
					const endNode = endContainer.nodeType === Node.TEXT_NODE 
						? endContainer.parentNode 
						: endContainer;
					
					if (contentEl.contains(startNode) && contentEl.contains(endNode)) {
						isInContent = true;
						break;
					}
				}
			}

			if (!isInContent) {
				return '';
			}

			// Извлекаем текстовое содержимое из Range, игнорируя HTML-теги
			const clonedContents = range.cloneContents();
			const tempDiv = document.createElement('div');
			tempDiv.appendChild(clonedContents);
			
			// Получаем только текстовое содержимое, удаляя лишние пробелы
			let text = tempDiv.textContent || tempDiv.innerText || '';
			
			// Очищаем текст от лишних пробелов, но сохраняем структуру
			// Заменяем множественные пробелы на один, но сохраняем переносы строк для абзацев
			text = text
				.replace(/[ \t]+/g, ' ')  // Заменяем множественные пробелы и табы на один пробел
				.replace(/\n\s+/g, '\n')  // Удаляем пробелы в начале строк
				.replace(/\s+\n/g, '\n')  // Удаляем пробелы в конце строк
				.replace(/\n{3,}/g, '\n\n')  // Ограничиваем множественные переносы строк до двух
				.trim();

			return text.length > 1 ? text : ''; // Минимум 2 символа
		} catch (error) {
			// Fallback на стандартный метод в случае ошибки
			return sel.toString().trim();
		}
	};

	const showSelectionTooltip = () => {
		const text = getSelectionText();
		if (!text || text.length === 0) {
			hideTooltip();
			return;
		}
		
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) {
			hideTooltip();
			return;
		}
		
		try {
			const rangeObj = sel.getRangeAt(0);
			const rect = rangeObj.getBoundingClientRect();
			const container = containerRef.current;
			if (!container) {
				hideTooltip();
				return;
			}
			
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
		} catch (error) {
			hideTooltip();
		}
	};

	const hideTooltip = () => {
		setTooltip(prev => ({ ...prev, visible: false }));
	};

	useEffect(() => {
		const handleSelectionChange = () => {
			// Игнорируем выделение, если происходит свайп
			if (touchStartRef.current) {
				return;
			}

			// Используем selectionchange для более надежного отслеживания
			const sel = window.getSelection();
			if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
				hideTooltip();
				return;
			}

			const container = containerRef.current;
			if (!container) {
				hideTooltip();
				return;
			}

			// Проверяем, что выделение находится внутри контента книги
			const contentElements = container.querySelectorAll('.content-text');
			const range = sel.getRangeAt(0);
			let isInContent = false;

			// Получаем контейнер, в котором находится выделение
			const commonAncestor = range.commonAncestorContainer;
			const nodeToCheck = commonAncestor.nodeType === Node.TEXT_NODE 
				? commonAncestor.parentNode 
				: commonAncestor;

			for (const contentEl of contentElements) {
				try {
					// Проверяем, содержится ли узел выделения в элементе контента
					if (contentEl.contains(nodeToCheck) || contentEl === nodeToCheck) {
						// Дополнительно проверяем, что начало и конец диапазона тоже в контенте
						const startContainer = range.startContainer;
						const endContainer = range.endContainer;
						const startNode = startContainer.nodeType === Node.TEXT_NODE 
							? startContainer.parentNode 
							: startContainer;
						const endNode = endContainer.nodeType === Node.TEXT_NODE 
							? endContainer.parentNode 
							: endContainer;
						
						if (contentEl.contains(startNode) && contentEl.contains(endNode)) {
							isInContent = true;
							break;
						}
					}
				} catch (e) {
					// Игнорируем ошибки
				}
			}

			if (isInContent) {
				setTimeout(showSelectionTooltip, 10);
			} else {
				hideTooltip();
			}
		};

		const onMouseUp = (e) => {
			// Небольшая задержка для завершения выделения
			setTimeout(handleSelectionChange, 10);
		};

		const handleClick = (e) => {
			if (!e.target.closest('.selection-tooltip')) {
				hideTooltip();
			}
		};

		const onScroll = () => hideTooltip();
		
		// Обработка touch для мобильных устройств
		// Используем selectionchange, который работает и для touch-устройств
		// Не добавляем отдельный touchend, чтобы не конфликтовать со свайпом

		document.addEventListener('mouseup', onMouseUp);
		document.addEventListener('click', handleClick);
		document.addEventListener('selectionchange', handleSelectionChange);
		containerRef.current?.addEventListener('scroll', onScroll, { passive: true });
		document.addEventListener('scroll', onScroll, true);

		return () => {
			document.removeEventListener('mouseup', onMouseUp);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('selectionchange', handleSelectionChange);
			containerRef.current?.removeEventListener('scroll', onScroll);
			document.removeEventListener('scroll', onScroll, true);
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

	// Обработчики для свайпа
	const handleTouchStart = (e) => {
		// Проверяем, есть ли выделенный текст
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed) {
			return; // Если есть выделение, не обрабатываем свайп
		}

		const touch = e.touches[0];
		if (touch && containerRef.current) {
			touchStartRef.current = {
				x: touch.clientX,
				y: touch.clientY,
				time: Date.now(),
				scrollTop: containerRef.current.scrollTop
			};
			touchMoveRef.current = null;
		}
	};

	const handleTouchMove = (e) => {
		if (!touchStartRef.current) return;

		const touch = e.touches[0];
		if (touch) {
			touchMoveRef.current = {
				x: touch.clientX,
				y: touch.clientY
			};
		}
	};

	const handleTouchEnd = (e) => {
		if (!touchStartRef.current || !touchMoveRef.current) {
			touchStartRef.current = null;
			touchMoveRef.current = null;
			return;
		}

		const start = touchStartRef.current;
		const move = touchMoveRef.current;
		
		const deltaX = move.x - start.x;
		const deltaY = move.y - start.y;
		const deltaTime = Date.now() - start.time;
		const absDeltaX = Math.abs(deltaX);
		const absDeltaY = Math.abs(deltaY);

		// Минимальное расстояние для свайпа (50px)
		const minSwipeDistance = 50;
		// Максимальное время для свайпа (500ms)
		const maxSwipeTime = 500;
		// Горизонтальное движение должно быть значительно больше вертикального
		// (минимум в 1.5 раза) для распознавания как свайп
		const isHorizontalSwipe = absDeltaX > absDeltaY * 1.5;

		// Проверяем, что это горизонтальный свайп и не было прокрутки
		const scrollDelta = containerRef.current 
			? Math.abs(containerRef.current.scrollTop - start.scrollTop)
			: 0;

		if (
			absDeltaX >= minSwipeDistance &&
			isHorizontalSwipe &&
			deltaTime <= maxSwipeTime &&
			scrollDelta < 10 && // Не было вертикальной прокрутки
			onPageChange
		) {
			// Свайп влево = следующая страница
			if (deltaX < 0 && currentPage < totalPages) {
				e.preventDefault(); // Предотвращаем стандартное поведение
				onPageChange(currentPage + 1);
			}
			// Свайп вправо = предыдущая страница
			else if (deltaX > 0 && currentPage > 1) {
				e.preventDefault(); // Предотвращаем стандартное поведение
				onPageChange(currentPage - 1);
			}
		}

		touchStartRef.current = null;
		touchMoveRef.current = null;
	};

	return (
		<div 
			className="book-content" 
			ref={containerRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
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