import { useCallback, useEffect, useRef, useState } from "react";
import Header from "./components/header/Header.jsx";
import Book from "./components/book/Book.jsx";
import Footer from "./components/footer/Footer.jsx";
import './App.css';

const COOKIE_PREFIX = 'book_page_';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const resolveBookIdentifier = (search) => {
    try {
        const params = new URLSearchParams(search);
        const path = params.get('path') || '';
        const title = params.get('title') || '';
        return path || title || 'default';
    } catch (e) {
        return 'default';
    }
};

const readCookiePage = (bookId) => {
    if (typeof document === 'undefined' || !bookId) {
        return null;
    }
    const name = `${COOKIE_PREFIX}${encodeURIComponent(bookId)}=`;
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const cookie of cookies) {
        if (cookie.startsWith(name)) {
            const value = decodeURIComponent(cookie.slice(name.length));
            const page = parseInt(value, 10);
            return Number.isFinite(page) && page > 0 ? page : null;
        }
    }
    return null;
};

const writeCookiePage = (bookId, page) => {
    if (typeof document === 'undefined' || !bookId || !page) {
        return;
    }
    const normalizedPage = Math.max(1, Math.floor(page));
    const name = `${COOKIE_PREFIX}${encodeURIComponent(bookId)}`;
    document.cookie = `${name}=${encodeURIComponent(normalizedPage)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}`;
};

const snapshotInitialState = () => {
    if (typeof window === 'undefined') {
        return { bookId: 'default', page: 1 };
    }
    const { search } = window.location;
    const params = new URLSearchParams(search);
    const bookId = resolveBookIdentifier(search);
    const cookiePage = readCookiePage(bookId);
    const queryPage = parseInt(params.get('page'), 10);
    const initialPage = cookiePage || (Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1);
    return { bookId, page: initialPage };
};

const App = () => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'light' || saved === 'dark' ? saved : 'dark';
    });
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved === 'small' || saved === 'large' ? saved : 'medium';
    });

    const bookIdRef = useRef('default');
    const [{ page: initialPage, bookId: initialBookId }] = useState(snapshotInitialState);
    bookIdRef.current = initialBookId;

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(10);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const map = {
            small: '16px',
            medium: '18px',
            large: '20px',
        };
        const value = map[fontSize] || '18px';
        document.documentElement.style.setProperty('--content-font-size', value);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const updateAppHeight = () => {
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
        };

        updateAppHeight();
        window.addEventListener('resize', updateAppHeight);
        window.addEventListener('orientationchange', updateAppHeight);
        window.visualViewport?.addEventListener('resize', updateAppHeight);

        return () => {
            window.removeEventListener('resize', updateAppHeight);
            window.removeEventListener('orientationchange', updateAppHeight);
            window.visualViewport?.removeEventListener('resize', updateAppHeight);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const handler = () => {
            const { bookId, page } = snapshotInitialState();
            bookIdRef.current = bookId;
            setCurrentPage(page);
        };
        window.addEventListener('popstate', handler);
        return () => {
            window.removeEventListener('popstate', handler);
        };
    }, []);

    useEffect(() => {
        if (!bookIdRef.current) {
            return;
        }
        writeCookiePage(bookIdRef.current, currentPage);
    }, [currentPage]);

    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.set('page', newPage);
            window.history.pushState({}, '', url);
        }
        if (bookIdRef.current) {
            writeCookiePage(bookIdRef.current, newPage);
        }
    }, []);

    const handleTotalPagesChange = useCallback((total) => {
        setTotalPages(total);
    }, []);

    return (
        <div className="app">
            <Header theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />
            <Book
                currentPage={currentPage}
                totalPages={totalPages}
                onTotalPagesChange={handleTotalPagesChange}
                onPageChange={handlePageChange}
            />
            <Footer
                theme={theme}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    )
}

export default App;