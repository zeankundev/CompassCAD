import { Link } from 'react-router-dom'
import CompassCADLogo from '../assets/general/logo.svg'
import styles from '../styles/home.module.css'
import LanguageSwitcher from './LanguageSwitcher'
const ReusableHeader = () => {
    return (
        <div className={styles.header}>
            {!window.location.href.includes('localhost') && (
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
                        <img src={CompassCADLogo} height={24}/>
                    </Link>
                    <div aria-label='leftside-links' className={styles['header-leftside-links']}>
                        <p>Sample link</p>
                    </div>
                </div>
                <div
                    className={styles['header-rightside-group']}
                >
                    <LanguageSwitcher />
                    <p>b</p>
                </div>
            </div>
        </div>
    )
}
export default ReusableHeader;