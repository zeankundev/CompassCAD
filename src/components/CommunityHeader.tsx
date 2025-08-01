import styles from '../styles/community.module.css';
import CommunityLogo from '../assets/community/logo.svg';
import { useState, useEffect } from 'react';

export const CommunityHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 5);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
    return (
        <header className={`${styles['community-header']} ${scrolled ? styles.scrolled : ''}`}>
            <div>
                <img src={CommunityLogo} alt="Community Logo" className={styles.communityLogo} />
            </div>
            <div>
                
            </div>
        </header>
    );
}