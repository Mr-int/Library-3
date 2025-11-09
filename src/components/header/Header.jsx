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
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);

    const searchInputRef = useRef(null);
    const searchMarkers = useRef([]);

    const handleCloseSite = () => {
        if (window.confirm('Вы уверены, что хотите закрыть приложение?')) {
            window.close();
            if (!window.closed) {
                window.location.href = 'about:blank';
            }
        }
    };

    const performSearch = (query) => {
        clearSearchHighlights();

        if (!query.trim()) {
            setSearchResults([]);
            setCurrentResultIndex(0);
            return;
        }

        const contentElements = document.querySelectorAll('.content-text');
        const results = [];
        const markers = [];

        contentElements.forEach((element, elementIndex) => {
            const text = element.textContent || element.innerText;
            const regex = new RegExp(query, 'gi');
            let match;

            while ((match = regex.exec(text)) !== null) {
                results.push({
                    element: element,
                    index: match.index,
                    length: match[0].length,
                    elementIndex: elementIndex
                });
            }

            highlightTextInElement(element, query, markers);
        });

        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);

        if (results.length > 0) {
            scrollToResult(results[0]);
        }
    };

    const highlightTextInElement = (element, query, markers) => {
        const text = element.innerHTML;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

        const newHtml = text.replace(regex, '<mark class="search-highlight">$1</mark>');
        element.innerHTML = newHtml;

        markers.push(element);
    };

    const clearSearchHighlights = () => {
        searchMarkers.current.forEach(element => {
            if (element && element.innerHTML) {
                element.innerHTML = element.innerHTML.replace(
                    /<mark class="search-highlight">([^<]*)<\/mark>/gi,
                    '$1'
                );
                element.innerHTML = element.innerHTML.replace(
                    /<mark class="search-current-highlight">([^<]*)<\/mark>/gi,
                    '$1'
                );
            }
        });
        searchMarkers.current = [];
    };

    const scrollToResult = (result) => {
        if (!result) return;

        const range = document.createRange();
        const textNode = findTextNode(result.element, result.index);

        if (textNode) {
            range.setStart(textNode, result.index);
            range.setEnd(textNode, result.index + result.length);

            clearSearchHighlights();
            highlightCurrentResult(result);

            const rect = range.getBoundingClientRect();
            const container = document.querySelector('.book-content');

            if (container) {
                container.scrollTop = rect.top + container.scrollTop - 100;
            }

            range.detach();
        }
    };

    const findTextNode = (element, index) => {
        const walk = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentIndex = 0;
        let node;

        while (node = walk.nextNode()) {
            if (currentIndex + node.textContent.length >= index) {
                return node;
            }
            currentIndex += node.textContent.length;
        }

        return null;
    };

    const highlightCurrentResult = (result) => {
        if (!result.element) return;

        const text = result.element.innerHTML;
        const query = searchQuery;
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let currentIndex = 0;
        const regex = new RegExp(escapedQuery, 'gi');

        const newHtml = text.replace(regex, (match, offset) => {
            currentIndex++;
            if (currentIndex === result.elementIndex + 1) {
                return `<mark class="search-current-highlight">${match}</mark>`;
            } else {
                return `<mark class="search-highlight">${match}</mark>`;
            }
        });

        result.element.innerHTML = newHtml;
        searchMarkers.current.push(result.element);
    };

    const navigateResults = (direction) => {
        if (searchResults.length === 0) return;

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentResultIndex + 1) % searchResults.length;
        } else {
            newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        }

        setCurrentResultIndex(newIndex);
        scrollToResult(searchResults[newIndex]);
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        performSearch(query);
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            navigateResults('next');
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            clearSearchHighlights();
            setSearchResults([]);
        }
    };

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

    useEffect(() => {
        return () => {
            clearSearchHighlights();
        };
    }, []);

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
                    {searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#9c9c9c'
                        }}>
                            {currentResultIndex + 1}/{searchResults.length}
                        </div>
                    )}
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