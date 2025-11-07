import './Footer.css';

import arrowLeft from '../../assets/footer/arrowLeft.svg'
import arrowRight from '../../assets/footer/arrowRight.svg'
import lightArrowLeft from '../../assets/footer/LightLeftArrow.svg'
import lightArrowRight from '../../assets/footer/LightRightArrow.svg'

const Footer = ({ theme = 'dark' }) => {
    const left = theme === 'light' ? lightArrowLeft : arrowLeft;
    const right = theme === 'light' ? lightArrowRight : arrowRight;

    return (
        <footer className="footer">
            <button className="footer__nav-button footer__nav-button--prev" aria-label="Предыдущая страница">
                <img src={left} alt=""/>
            </button>

            <p className="footer__page-info">Страница 1 из 10</p>

            <button className="footer__nav-button footer__nav-button--next" aria-label="Следующая страница">
                <img src={right} alt=""/>
            </button>
        </footer>
    )
}

export default Footer;