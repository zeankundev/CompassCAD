import styles from '../styles/community.module.css';
import CommunityLogo from '../assets/community/logo.svg'
import { useState, useEffect } from 'react';
import { User } from './FirebaseConfig';
import { getAccessToken, getUID, getUser } from './FirebaseConfig';
export const CommunityHeader = () => {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    
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
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const accessToken = await getAccessToken();
                if (accessToken) {
                    console.log('Access Token isn\'t null!');
                    const uid = await getUID(accessToken);
                    console.log('UID:', uid);
                    if (uid) {
                        const userData = await getUser(uid);
                        if (userData) {
                            console.log(userData)
                            setUser(userData);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);
    return (
        <header className={`${styles['community-header']} ${scrolled ? styles.scrolled : ''}`}>
            <div>
                <img src={CommunityLogo} alt="Community Logo" className={styles.communityLogo} />
            </div>
            <div>
                {user?.photoURL && <img src={user.photoURL} />}
                <span>Login</span>
            </div>
        </header>
    );
}