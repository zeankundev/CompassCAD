import { Link } from 'react-router-dom'
import CompassCADLogo from '../assets/general/logo.svg'
import styles from '../styles/home.module.css'
const ReusableHeader = () => {
    return (
        <div className={styles.header}>
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
            <div>
                <p>b</p>
            </div>
        </div>
    )
}
export default ReusableHeader;