import { useEffect, useState } from "react";
import Header from "./components/header/Header.jsx";
import Book from "./components/book/Book.jsx";
import Footer from "./components/footer/Footer.jsx";
import './App.css';

const App = () => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'light' || saved === 'dark' ? saved : 'dark';
    });
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved === 'small' || saved === 'large' ? saved : 'medium';
    });

    // Получаем начальную страницу из URL параметров
    const getInitialPage = () => {
        if (typeof window === 'undefined') return 1;
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('page')) || 1;
    };

    const [currentPage, setCurrentPage] = useState(getInitialPage);
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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        // Можно также обновить URL без перезагрузки страницы
        const url = new URL(window.location);
        url.searchParams.set('page', newPage);
        window.history.pushState({}, '', url);
    };

    const handleTotalPagesChange = (total) => {
        setTotalPages(total);
    };

    return (
        <div className="app">
            <Header theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />
            <Book
                currentPage={currentPage}
                onTotalPagesChange={handleTotalPagesChange}
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