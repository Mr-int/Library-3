import { useState } from 'react';

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
                <button className="header__nav-btn">
                    <img src={cross} alt="" width='26' height='26' />
                </button>
                <div className="header__search-wrapper">
                    <img src={search} alt="" className="header__search-icon" width='16' height='16' />
                    <input type="text" className="header__nav-search" />
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
                    <img src={bookmark} alt="" width='26' height='26' />
                </button>
                <button className="header__settings-btn" onClick={togglePanel}>
                    <img src={settings} alt="" width='26' height='26' />
                </button>
            </div>
        </header>
    )
}

export default Header;
