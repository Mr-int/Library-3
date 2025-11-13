import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './Book.css';
import { fetchEpubPages } from '../../api/books';
import { addNote } from '../../utils/note';
import bookmarkIcon from "../../assets/header/bookmark.svg";
import lightBookmarkIcon from "../../assets/header/LightBookmark.svg";

const Book = ({ currentPage, totalPages = 10, onTotalPagesChange, onPageChange }) => {
	const [searchParams] = useState(() => {
		if (typeof window === 'undefined') return { path: null, title: null, page: 1 };

		const urlParams = new URLSearchParams(window.location.search);
		const path = urlParams.get('path');
		const title = urlParams.get('title');
		const page = parseInt(urlParams.get('page')) || 1;

		return { path, title, page };
	});

	const bookPath = searchParams.path;
	const title = searchParams.title;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [meta, setMeta] = useState({ author: '', title: '' });
	const [pages, setPages] = useState([]);
	const [internalTotalPages, setInternalTotalPages] = useState(0);

	const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
	const containerRef = useRef(null);
	const tooltipRef = useRef(null);
	const selectionTimeoutRef = useRef(null);
	
	const touchStartRef = useRef(null);
	const touchMoveRef = useRef(null);
	const touchActiveRef = useRef(false);
	const isTouchSelectingRef = useRef(false);
	const suppressSwipeRef = useRef(false);

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
				const targetIndex = Math.max(0, currentPage - 1);
				const from = Math.max(0, targetIndex - 4);
				const to = targetIndex + 4;

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
					const currentPageIndex = targetIndex - from;
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

	const getSelectionText = useCallback(() => {
		const sel = window.getSelection && window.getSelection();
		if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
		
		try {
			const range = sel.getRangeAt(0).cloneRange();
			const container = containerRef.current;
			
			if (!container) {
				return sel.toString().trim();
			}

			const anchorNode = sel.anchorNode;
			const focusNode = sel.focusNode;

			if (!container.contains(anchorNode) || !container.contains(focusNode)) {
				return '';
			}

			const fragment = range.cloneContents();
			const serializer = document.createElement('div');
			serializer.appendChild(fragment);

			let text = serializer.textContent ?? '';
			
			text = text
				.replace(/[ \t]+/g, ' ')  
				.replace(/\n\s+/g, '\n')  
				.replace(/\s+\n/g, '\n')  
				.replace(/\n{3,}/g, '\n\n')  
				.trim();

			return text.length > 1 ? text : ''; 
		} catch (error) {
			return sel.toString().trim();
		}
	}, []);

	const ensureSelectableContent = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const attrToRemove = ['unselectable', 'onselectstart', 'onmousedown', 'draggable', 'ondragstart', 'ondrag'];
		const styleTokens = ['user-select', '-webkit-user-select', '-moz-user-select', '-ms-user-select', '-webkit-touch-callout', '-webkit-user-drag'];
		const classTokens = ['noselect', 'no-select', 'unselectable', 'disable-select', 'text-unselectable'];

		const nodes = container.querySelectorAll('.content-text, .content-text *');
		nodes.forEach((node) => {
			if (!(node instanceof HTMLElement)) {
				return;
			}
			attrToRemove.forEach((attr) => {
				if (node.hasAttribute(attr)) {
					node.removeAttribute(attr);
				}
			});

			if (node.hasAttribute('style')) {
				const styleValue = node.getAttribute('style') || '';
				const filtered = styleValue
					.split(';')
					.map((part) => part.trim())
					.filter((part) => {
						if (!part) return false;
						const lower = part.toLowerCase();
						return !styleTokens.some((token) => lower.startsWith(token));
					})
					.join('; ');
				if (filtered) {
					node.setAttribute('style', filtered);
				} else {
					node.removeAttribute('style');
				}
			}

			if (node.classList.length > 0) {
				classTokens.forEach((token) => {
					if (node.classList.contains(token)) {
						node.classList.remove(token);
					}
				});
			}
		});

		const styleTags = container.querySelectorAll('.content-text style');
		styleTags.forEach((styleTag) => styleTag.remove());
	}, []);

	const hideTooltip = useCallback(() => {
		if (selectionTimeoutRef.current) {
			clearTimeout(selectionTimeoutRef.current);
			selectionTimeoutRef.current = null;
		}
		touchActiveRef.current = false;
		isTouchSelectingRef.current = false;
		suppressSwipeRef.current = false;
		setTooltip(prev => ({ ...prev, visible: false }));
	}, []);

	const showSelectionTooltip = useCallback(() => {
		const sel = window.getSelection();
		if (!sel || sel.rangeCount === 0) {
			hideTooltip();
			return;
		}

		const text = getSelectionText();
		if (!text || text.length === 0) {
			hideTooltip();
			return;
		}
		
		try {
			const rangeObj = sel.getRangeAt(0);
			let rect = rangeObj.getBoundingClientRect();
			if (rect.width === 0 && rect.height === 0) {
				const rects = Array.from(rangeObj.getClientRects());
				const viable = rects.find((r) => r.width > 1 || r.height > 1);
				if (viable) {
					rect = viable;
				}
			}

			const container = containerRef.current;
			if (!container) {
				hideTooltip();
				return;
			}

			const anchorNode = sel.anchorNode;
			const focusNode = sel.focusNode;

			if (!container.contains(anchorNode) || !container.contains(focusNode)) {
				hideTooltip();
				return;
			}
			
			const containerRect = container.getBoundingClientRect();

			const centerX = rect.left + rect.width / 2;
			const x = Math.min(
				Math.max(centerX, containerRect.left + 12),
				containerRect.right - 12
			);

			const preferBelow = isTouchSelectingRef.current;
			let y;
			if (preferBelow) {
				const desired = rect.bottom + 16;
				const maxTop = containerRect.bottom - 56;
				const minTop = containerRect.top + 12;
				y = Math.min(Math.max(desired, minTop), maxTop);
			} else {
				const desired = rect.top - 40;
				const minTop = containerRect.top + 12;
				y = Math.max(desired, minTop);
			}

			setTooltip({
				visible: true,
				x: x - containerRect.left,
				y: y - containerRect.top,
				text
			});
		} catch (error) {
			hideTooltip();
		}
	}, [getSelectionText, hideTooltip]);

	const scheduleShowSelectionTooltip = useCallback((delay = 80) => {
		if (selectionTimeoutRef.current) {
			clearTimeout(selectionTimeoutRef.current);
		}

		selectionTimeoutRef.current = setTimeout(() => {
			showSelectionTooltip();
			selectionTimeoutRef.current = null;
		}, delay);
	}, [showSelectionTooltip]);

	useEffect(() => {
		const onMouseUp = (e) => {
			if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
				return;
			}
			setTimeout(() => {
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
				const anchorNode = sel.anchorNode;
				const focusNode = sel.focusNode;
				if (!container.contains(anchorNode) || !container.contains(focusNode)) {
					hideTooltip();
					return;
				}
				scheduleShowSelectionTooltip(80);
			}, 40);
		};

		const handleClickOutside = (e) => {
			if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
				return;
			}
			
			const sel = window.getSelection();
			if (!sel || sel.isCollapsed) {
				hideTooltip();
			}
		};

		const onScroll = () => {
			const sel = window.getSelection();
			if (!sel || sel.isCollapsed) {
				hideTooltip();
			}
		};

		const handleSelectionChange = () => {
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

			const anchorNode = sel.anchorNode;
			const focusNode = sel.focusNode;
			if (!container.contains(anchorNode) || !container.contains(focusNode)) {
				hideTooltip();
				return;
			}

			if (touchStartRef.current) {
				isTouchSelectingRef.current = true;
			}

			if (isTouchSelectingRef.current) {
				suppressSwipeRef.current = true;
				scheduleShowSelectionTooltip(80);
			} else {
				scheduleShowSelectionTooltip(60);
			}
		};

		document.addEventListener('mouseup', onMouseUp);
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('selectionchange', handleSelectionChange);
		containerRef.current?.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			document.removeEventListener('mouseup', onMouseUp);
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('selectionchange', handleSelectionChange);
			containerRef.current?.removeEventListener('scroll', onScroll);
		};
	}, [hideTooltip, scheduleShowSelectionTooltip]);

	useEffect(() => {
		if (loading) {
			return;
		}
		ensureSelectableContent();
		setTooltip(prev => ({ ...prev, visible: false }));
		window.dispatchEvent(new CustomEvent('book:content-updated'));
	}, [loading, pages, ensureSelectableContent]);

	useLayoutEffect(() => {
		if (loading) {
			return;
		}
		ensureSelectableContent();
		window.dispatchEvent(new CustomEvent('book:content-updated'));
	}, [loading, ensureSelectableContent]);

	useEffect(() => {
		return () => {
			if (selectionTimeoutRef.current) {
				clearTimeout(selectionTimeoutRef.current);
			}
		};
	}, []);

	const handleCopy = async () => {
		const text = tooltip.text;
		if (!text) return;

		try {
			await navigator.clipboard.writeText(text);
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

		} catch (e) {
			console.error('Ошибка добавления заметки:', e);
		}
		hideTooltip();
		window.getSelection()?.removeAllRanges();
	};

	const bookmarkImg = document.documentElement.getAttribute('data-theme') === 'light' ? lightBookmarkIcon : bookmarkIcon;

	const renderPageContent = () => {
		if (!Array.isArray(currentPageData)) return null;

		return currentPageData.map((html, index) => (
			<div
				key={index}
				className="content-text"
				data-original-html={html}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		));
	};

	const handleTouchStart = (e) => {
		touchActiveRef.current = true;
		isTouchSelectingRef.current = false;
		suppressSwipeRef.current = false;
		const selection = window.getSelection();
		if (selection && !selection.isCollapsed) {
			isTouchSelectingRef.current = true;
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

		// keep swipe threshold data; selection updates handled via selectionchange
	};

	const handleTouchEnd = (e) => {
		touchActiveRef.current = false;
		const start = touchStartRef.current;
		const move = touchMoveRef.current;

		const sel = window.getSelection && window.getSelection();
		const container = containerRef.current;
		const selectionActive = !!(sel && !sel.isCollapsed && sel.rangeCount > 0 && container && container.contains(sel.anchorNode) && container.contains(sel.focusNode));

		if (selectionActive) {
			isTouchSelectingRef.current = true;
			suppressSwipeRef.current = true;
			scheduleShowSelectionTooltip(120);
			touchStartRef.current = null;
			touchMoveRef.current = null;
			return;
		}

		if (!start || !move) {
			const touch = e.changedTouches[0];
			if (touch) {
				scheduleShowSelectionTooltip(200);
			}
			
			touchStartRef.current = null;
			touchMoveRef.current = null;
			setTimeout(() => {
				isTouchSelectingRef.current = false;
				suppressSwipeRef.current = false;
			}, 250);
			return;
		}

		const deltaX = move.x - start.x;
		const deltaY = move.y - start.y;
		const deltaTime = Date.now() - start.time;
		const absDeltaX = Math.abs(deltaX);
		const absDeltaY = Math.abs(deltaY);

		const minSwipeDistance = 50;
		const maxSwipeTime = 500;
		const isHorizontalSwipe = absDeltaX > absDeltaY * 1.5;

		const scrollDelta = containerRef.current 
			? Math.abs(containerRef.current.scrollTop - start.scrollTop)
			: 0;

		if (
			!suppressSwipeRef.current &&
			absDeltaX >= minSwipeDistance &&
			isHorizontalSwipe &&
			deltaTime <= maxSwipeTime &&
			scrollDelta < 10 && 
			onPageChange
		) {
			if (deltaX < 0 && currentPage < totalPages) {
				e.preventDefault();
				onPageChange(currentPage + 1);
				touchStartRef.current = null;
				touchMoveRef.current = null;
				suppressSwipeRef.current = false;
				isTouchSelectingRef.current = false;
				return;
			}
			else if (deltaX > 0 && currentPage > 1) {
				e.preventDefault();
				onPageChange(currentPage - 1);
				touchStartRef.current = null;
				touchMoveRef.current = null;
				suppressSwipeRef.current = false;
				isTouchSelectingRef.current = false;
				return;
			}
		}

		touchStartRef.current = null;
		touchMoveRef.current = null;
		isTouchSelectingRef.current = false;
		suppressSwipeRef.current = false;
	};

	const handleTouchCancel = () => {
		touchStartRef.current = null;
		touchMoveRef.current = null;
		touchActiveRef.current = false;
		isTouchSelectingRef.current = false;
		suppressSwipeRef.current = false;
		hideTooltip();
	};

	return (
		<div 
			className="book-content" 
			ref={containerRef}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchCancel}
		>
			<div className="page">
				<div className="book-author">{header}</div>

				{loading && <h1 className="chapter-title">Загрузка…</h1>}
				{error && <h1 className="chapter-title">{error}</h1>}
				{!loading && !error && bookPath && pages.length === 0 && (
					<h1 className="chapter-title">Книга не найдена или пуста</h1>
				)}

				{!loading && !error && currentPageData && currentPageData.length > 0 && (
					<div>
						{renderPageContent()}
					</div>
				)}
			</div>

			{tooltip.visible && (
				<div
					ref={tooltipRef}
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