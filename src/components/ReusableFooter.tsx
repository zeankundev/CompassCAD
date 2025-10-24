import CompassCADLogo from '../assets/general/logo.svg'
import ZeanKunLogo from '../assets/general/zeankun-logomark.svg'
import styles from '../styles/home.module.css'
const ReusableFooter = () => {
    return (
        <div className={styles.footer}>
            <div>
                <img src={CompassCADLogo} alt='CompassCAD Logo' height={24}/>
                <br></br>
                <small style={{marginBottom: '10px'}}>another project by</small>
                <br></br>
                <img src={ZeanKunLogo} alt='zeankun logo' height={24}/>
                <p>&copy; {new Date().getFullYear()} zeankun.dev. all rights reserved</p>
            </div>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <h3>Socials</h3>
                <br></br>
                <a target='_blank' href='https://x.com/CompassCAD'>Twitter (X)</a>
                <a target='_blank' href='https://instagram.com/compass.cad'>Instagram</a>
                <a target='_blank' href='https://discord.gg/Qvw9afNs3e'>Discord</a>
            </div>
            <br></br>
        </div>
    )
}
export default ReusableFooter;