import { useState, useRef, useEffect } from 'react';
import './Header.css';
import SettingPanel from '../SettingPanel/SettingPanel';
import NotesPanel from '../notes/NotesPanel';
import crossIcon from "../../assets/header/cross_icon.svg";
import bookmarkIcon from "../../assets/header/bookmark.svg";
import settingsIcon from "../../assets/header/settings_icon.svg";
import lightCrossIcon from "../../assets/header/LightCross_icon.svg";
import lightBookmarkIcon from "../../assets/header/LightBookmark.svg";
import lightSettingsIcon from "../../assets/header/LightSettings_icon.svg";
import searchIcon from "../../assets/header/search_icon.svg";
import lightSearchIcon from "../../assets/header/LightSearch_icon.svg";

const Header = ({ theme = 'dark', setTheme, fontSize = 'medium', setFontSize }) => {
    const [showPanel, setPanel] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const handleCloseSite = () => {
        if (window.confirm('Вы уверены, что хотите закрыть приложение?')) {
            window.close();
            if (!window.closed) {
                window.location.href = 'about:blank';
            }
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        performSearch(query);
    };

    const performSearch = (query) => {
        clearSearchHighlights();

        if (!query.trim()) {
            return;
        }

        const contentElements = document.querySelectorAll('.content-text');

        contentElements.forEach((element) => {
            highlightTextInElement(element, query);
        });
    };

    const highlightTextInElement = (element, query) => {
        const text = element.textContent || element.innerText;
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');

        if (regex.test(text)) {
            const newHtml = text.replace(regex, '<mark class="search-highlight">$1</mark>');
            element.innerHTML = newHtml;
        }
    };

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const clearSearchHighlights = () => {
        const contentElements = document.querySelectorAll('.content-text');
        contentElements.forEach(element => {
            if (element && element.innerHTML) {
                const originalHtml = element.getAttribute('data-original-html');
                if (originalHtml) {
                    element.innerHTML = originalHtml;
                }
            }
        });
    };

    const saveOriginalHTML = () => {
        const contentElements = document.querySelectorAll('.content-text');
        contentElements.forEach(element => {
            if (!element.getAttribute('data-original-html')) {
                element.setAttribute('data-original-html', element.innerHTML);
            }
        });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Escape') {
            setSearchQuery('');
            clearSearchHighlights();
            const contentElements = document.querySelectorAll('.content-text');
            contentElements.forEach(element => {
                const originalHtml = element.getAttribute('data-original-html');
                if (originalHtml) {
                    element.innerHTML = originalHtml;
                }
            });
        }
    };

    useEffect(() => {
        saveOriginalHTML();

        const timeoutId = setTimeout(() => {
            saveOriginalHTML();
        }, 1000);

        return () => {
            clearTimeout(timeoutId);
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const openPanel = () => {
        setPanel(true);
        setIsClosing(false);
    };

    const closePanel = () => {
        setIsClosing(true);
        setTimeout(() => {
            setPanel(false);
            setIsClosing(false);
        }, 400);
    };

    const togglePanel = () => {
        if (!showPanel) openPanel(); else closePanel();
    };

    const cross = theme === 'light' ? lightCrossIcon : crossIcon;
    const bookmark = theme === 'light' ? lightBookmarkIcon : bookmarkIcon;
    const settings = theme === 'light' ? lightSettingsIcon : settingsIcon;
    const search = theme === 'light' ? lightSearchIcon : searchIcon;

    const handleThemeChange = (nextTheme) => {
        if (typeof setTheme === 'function') {
            setTheme(nextTheme);
        }
    };

    return (
        <header className="header">
            <div className="header__nav">
                <button className="header__nav-btn" onClick={handleCloseSite}>
                    <img src={cross} alt="Закрыть приложение" width='26' height='26' />
                </button>
                <div className="header__search-wrapper">
                    <img src={search} alt="Поиск" className="header__search-icon" width='16' height='16' />
                    <input
                        type="text"
                        className="header__nav-search"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        ref={searchInputRef}
                    />
                </div>
            </div>

            {showPanel && (
                <>
                    <div className={`settings-backdrop ${isClosing ? 'closing' : 'open'}`} onClick={closePanel}></div>
                    <SettingPanel
                        theme={theme}
                        onChangeTheme={handleThemeChange}
                        fontSize={fontSize}
                        onChangeFont={setFontSize}
                        closing={isClosing}
                    />
                </>
            )}

            {showNotes && (
                <NotesPanel onClose={() => setShowNotes(false)} />
            )}

            <div className="header__settings">
                <button className="header__settings-bookmark" onClick={() => setShowNotes(true)}>
                    <img src={bookmark} alt="Заметки" width='26' height='26' />
                </button>
                <button className="header__settings-btn" onClick={togglePanel}>
                    <img src={settings} alt="Настройки" width='26' height='26' />
                </button>
            </div>
        </header>
    )
}

export default Header;