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

    return (
        <div className="app">
            <Header theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />
            <Book
                bookPath={"1358935243_1161/403b2114-29e2-4ab4-9a96-07a85271c97f/book.epub"}
                title={"Книга"}
                initialFrom={1}
                initialTo={10}
            />
            <Footer theme={theme} />
        </div>
    )
}

export default App;