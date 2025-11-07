import './SettingPanel.css';

const SettingPanel = ({ theme = 'dark', onChangeTheme, fontSize = 'medium', onChangeFont, closing = false }) => {
    const setTheme = (value) => {
        if (typeof onChangeTheme === 'function') {
            onChangeTheme(value);
        }
    };
    const setFont = (value) => {
        if (typeof onChangeFont === 'function') {
            onChangeFont(value);
        }
    };

    return (
        <div className={`SettingPanel ${theme === 'light' ? 'light-theme' : ''} ${closing ? 'closing' : ''}`}>
            <div className="settings-container">
                <div className="font-size-setting">
                    <h3 className="setting-title">Размер шрифта</h3>
                    <div className="font-size-buttons">
                        <button className="font-size-btn small" onClick={() => setFont('small')} aria-pressed={fontSize === 'small'}>Aa</button>
                        <button className="font-size-btn medium" onClick={() => setFont('medium')} aria-pressed={fontSize === 'medium'}>Aa</button>
                        <button className="font-size-btn large" onClick={() => setFont('large')} aria-pressed={fontSize === 'large'}>Aa</button>
                    </div>
                </div>

                <div className="theme-setting">
                    <h3 className="setting-title">Тема</h3>
                    <div className="theme-buttons">
                        <button className="theme-btn light" onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>Светлая</button>
                        <button className="theme-btn dark" onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>Темная</button>
                    </div>
                </div>
            </div>
        </div> 
    )
}

export default SettingPanel;