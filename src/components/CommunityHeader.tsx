import styles from '../styles/community.module.css';
import CommunityLogo from '../assets/community/logo.svg'
export const CommunityHeader = () => {
    return (
        <header className={styles['community-header']}>
            <img src={CommunityLogo} alt="Community Logo" className={styles.communityLogo} />
        </header>
    );
}