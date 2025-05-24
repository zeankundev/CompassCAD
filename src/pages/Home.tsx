import ReusableHeader from '../components/ReusableHeader'
import styles from '../styles/home.module.css'
import Illustration1 from '../assets/general/architect-dream.svg'
import TryIt from '../assets/general/try.svg'
import InvertedExportButton from '../assets/export.svg'
import CCADDesktopUI from '../assets/general/desktopui.svg'
import CrossPlatformImage from '../assets/general/browserandphone.svg'
import '../styles/theme.css'
import { getDeviceType } from '../components/GetDevice'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
const Home = () => {
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
                        Build your dreams without wasting time to learn complex tools. It's time to simplify your "dream building" design
                        </h1>
                        <p>
                        Imagine if CAD went as simple as the power tools we use today like Notion or even Figma. Except that, we can redefine what "power tools" means for architecture design.
                        </p>
                        <br></br>
                        <div style={{display: 'flex', flexDirection: 'row'}}>
                            <HomeButton important={true}>
                                <img src={InvertedExportButton} width={24} style={{transform: 'rotate(180deg)'}} />
                                &nbsp;
                                Download for platform
                            </HomeButton>
                            <Link to='/editor'>
                                <HomeButton>
                                    <img src={TryIt} width={24}/>
                                    &nbsp;
                                    In-browser editor
                                </HomeButton>
                            </Link>
                        </div>
                    </div>
                    <div className={`${styles['hero-right']} ${crammed ? styles.crammed : ''}`}>
                        <img src={Illustration1} height={crammed ? 360 : 510}/>
                    </div>
                </div>
                <div>
                    <h1>Blazingly fast CAD software. Free of charge, yet simple and minimalistic</h1>
                    <p>Built from the hearts of broke developers who cannot afford a good computer and a CAD software, created for you to enjoy.</p>
                    <br></br>
                    <div style={{display:'flex', justifyContent: 'center'}}>
                        <img src={CCADDesktopUI} style={{border: '1px solid #0080ff', borderRadius: '10px', boxShadow: '0px 0px 13px 3px rgba(0,128,255,0.25)', width: '90vw'}} />
                    </div>
                    <small>*Only available for Windows and Linux.</small>
                    <br></br>
                    <br></br>
                    <h1>No desktop version or it doesn't work? We always have the web version!</h1>
                    <div style={{display:'flex', justifyContent: 'center'}}>
                        <img src={CrossPlatformImage} style={{width: '90vw'}}/>
                    </div>
                    <small>*Images may appear different than the actual software</small>
                </div>
            </div>
        </div>
    )
}
export default Home