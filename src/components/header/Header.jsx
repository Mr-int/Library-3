import { useState, useRef, useEffect, useCallback } from 'react';
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
    const searchQueryRef = useRef('');

    const searchInputRef = useRef(null);

    const handleCloseSite = () => {
        if (window.confirm('Вы уверены, что хотите закрыть приложение?')) {
            window.close();
            if (!window.closed) {
                window.location.href = 'about:blank';
            }
        }
    };

    const clearSearchHighlights = useCallback(() => {
        const contentElements = document.querySelectorAll('.content-text');
        contentElements.forEach(element => {
            const originalHtml = element.dataset.originalHtml;
            if (originalHtml) {
                element.innerHTML = originalHtml;
            }
        });
    }, []);

    const performSearch = useCallback((query) => {
        clearSearchHighlights();

        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return;
        }

        const contentElements = document.querySelectorAll('.content-text');

        contentElements.forEach((element) => {
            highlightTextInElement(element, trimmedQuery);
        });
    }, [clearSearchHighlights]);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        searchQueryRef.current = query;
        setSearchQuery(query);
        performSearch(query);
    };

    const highlightTextInElement = (element, query) => {
        const originalHtml = element.dataset.originalHtml ?? element.innerHTML;

        if (!element.dataset.originalHtml) {
            element.dataset.originalHtml = originalHtml;
        }

        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        const highlightedHtml = originalHtml.replace(regex, '<mark class="search-highlight">$1</mark>');

        if (highlightedHtml !== originalHtml) {
            element.innerHTML = highlightedHtml;
        }
    };

    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Escape') {
            setSearchQuery('');
            searchQueryRef.current = '';
            clearSearchHighlights();
        }
    };

    useEffect(() => {
        const handleContentUpdated = () => {
            if (searchQueryRef.current.trim()) {
                performSearch(searchQueryRef.current);
            } else {
                clearSearchHighlights();
            }
        };

        window.addEventListener('book:content-updated', handleContentUpdated);

        return () => {
            window.removeEventListener('book:content-updated', handleContentUpdated);
        };
    }, [performSearch, clearSearchHighlights]);

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