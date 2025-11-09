import './Footer.css';
import arrowLeft from '../../assets/footer/arrowLeft.svg';
import arrowRight from '../../assets/footer/arrowRight.svg';
import lightArrowLeft from '../../assets/footer/LightLeftArrow.svg';
import lightArrowRight from '../../assets/footer/LightRightArrow.svg';

const Footer = ({ theme = 'dark', currentPage = 1, totalPages = 10, onPageChange }) => {
    const left = theme === 'light' ? lightArrowLeft : arrowLeft;
    const right = theme === 'light' ? lightArrowRight : arrowRight;

    const handlePrevPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    return (
        <footer className="footer">
            <button
                className={`footer__nav-button footer__nav-button--prev ${currentPage === 1 ? 'footer__nav-button--disabled' : ''}`}
                aria-label="Предыдущая страница"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
            >
                <img src={left} alt=""/>
            </button>

            <p className="footer__page-info">Страница {currentPage} из {totalPages}</p>

            <button
                className={`footer__nav-button footer__nav-button--next ${currentPage === totalPages ? 'footer__nav-button--disabled' : ''}`}
                aria-label="Следующая страница"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
            >
                <img src={right} alt=""/>
            </button>
        </footer>
    )
}

export default Footer;
