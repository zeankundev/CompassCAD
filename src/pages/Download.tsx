import ReusableHeader from '../components/ReusableHeader'
import styles from '../styles/home.module.css'
import Illustration1 from '../assets/general/godsend.svg'
import TryIt from '../assets/general/try.svg'
import InvertedExportButton from '../assets/export.svg'
import CCADDesktopUI from '../assets/general/desktopui.svg'
import CrossPlatformImage from '../assets/general/browserandphone.svg'
import '../styles/theme.css'
import { getDeviceType } from '../components/GetDevice'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReusableFooter from '../components/ReusableFooter'
interface HomeButtonInterface {
    important?: boolean,
    onInteract?: () => void,
    children: React.ReactNode
}
const isCrammed = () => {
    const minWidthForText = 1000; // adjust this value based on your needs
    return window.innerWidth < minWidthForText;
}
const HomeButton = (props: HomeButtonInterface) => {
    return (
        <button onClick={props.onInteract} className={`${styles['startpage-button']} ${props.important ? styles.important: ''}`}>
            {props.children}
        </button>
    )
}
const DownloadPage = () => {
    const [deviceType, setDeviceType] = useState(getDeviceType());
    const [crammed, setCrammed] = useState(isCrammed())
    useEffect(() => {
        const handleResize = () => {
            setDeviceType(getDeviceType());
            setCrammed(isCrammed());
            console.log(crammed)
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div className={styles['home-container']}>
            <ReusableHeader />
            <div className={styles['app-content']}>
                <div className={`${styles['hero-biggiewrapper']} ${crammed ? styles.mobile : ''}`}>
                    <div className={styles['hero-left']}>
                        <h1>
                        Download CompassCAD
                        </h1>
                        <p>
                        Start your CAD adventure today!
                        </p>
                        <br></br>
                    </div>
                    <div className={`${styles['hero-right']} ${crammed ? styles.crammed : ''}`}>
                        <img src={Illustration1} alt='Godsend' height={crammed ? 360 : 510}/>
                    </div>
                </div>
                <div>
                    <p>This page is under construction: please wait</p>
                    <h1>Official</h1>
                </div>
            </div>
            <ReusableFooter />
        </div>
    )
}
export default DownloadPage