import { CommunityHeader } from '../components/CommunityHeader';
import styles from '../styles/community.module.css';
export const CommunityHome = () => {
    return (
        <div className={styles.community}>
            <CommunityHeader />
            <h1>Community Home</h1>
            <p>Welcome to the community home page! Here you can find various resources and connect with other members.</p>
            <button className={styles.communityButton}>Explore Community</button>
            <button className={styles.communityButton}>Join a Discussion</button>
            <button className={styles.communityButton}>View Resources</button>
        </div>
    )
}