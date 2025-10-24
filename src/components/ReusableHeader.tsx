import { Link } from 'react-router-dom'
import CompassCADLogo from '../assets/general/logo.svg'
import styles from '../styles/home.module.css'
import LanguageSwitcher from './LanguageSwitcher'
import { useState, useEffect } from 'react'
const ReusableHeader = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 5) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className={`${styles.header} ${scrolled ? styles.scrolld : ''}`}>
            {window.location.href.split(':')[1] && (
                <div className={styles['header-beta']}>
                    <span>This version of CompassCAD Web is still in beta, so expect broken bugs</span>
                </div>
            )}
            <div className={styles['header-bottom-side']}>
                <div
                    className={styles['header-leftside-group']}
                    aria-label='leftside-group'
                >
                    <Link to='/'>
                        <img src={CompassCADLogo} alt='CompassCAD Logo' height={24}/>
                    </Link>
                    <div aria-label='leftside-links' className={styles['header-leftside-links']}>
                        <p>Sample link</p>
                    </div>
                </div>
                <div
                    className={styles['header-rightside-group']}
                >
                    <LanguageSwitcher />
                </div>
            </div>
        </div>
    )
}
export default ReusableHeader;