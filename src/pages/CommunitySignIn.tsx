import styles from '../styles/community.module.css';
export const CommunitySignIn = () => {
    return (
        <div className={styles.community}>
            <h1>Community Sign In</h1>
            <p>Welcome to the community! Please sign in to continue.</p>
            <button className={styles.signInButton}>Sign In with Google</button>
            <button className={styles.signInButton}>Sign In with Facebook</button>
            <button className={styles.signInButton}>Sign In with Email</button>
        </div>
    )
}