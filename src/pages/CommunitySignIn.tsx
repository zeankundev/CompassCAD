import { useState } from 'react';
import { signInWithGoogle, signInWithEmailPassword, createUserIfNotExists } from '../components/FirebaseConfig';
import styles from '../styles/community.module.css';
import md5 from 'md5';

export const CommunitySignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleSignIn = async () => {
        try {
            const signin = await signInWithGoogle();
            alert('Signed in with Google successfully!');
            console.log(signin);
            const token = await signin.user.getIdToken();
            document.cookie = `accessToken=${token}; path=/; max-age=3600`;
            // Create user data with Gravatar URL
            const user = signin.user;
            const gravatarUrl = `https://www.gravatar.com/avatar/${md5(user.email?.toLowerCase() || '')}?d=identicon`;
            try {
                await createUserIfNotExists({
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: gravatarUrl
                });
            } catch (createError) {
                console.error('Error creating user:', createError);
            }
            // Redirect or handle successful sign-in
        } catch (err) {
            setError('Failed to sign in with Google');
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailPassword(email, password);
            // Redirect or handle successful sign-in
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className={styles['community-signin']}>
            <h1>Community Sign In</h1>
            {error && <p className={styles.error}>{error}</p>}
            
            <form onSubmit={handleEmailSignIn}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className={styles.signInButton}>
                    Sign In with Email
                </button>
            </form>

            <button 
                className={styles.signInButton}
                onClick={handleGoogleSignIn}
            >
                Sign In with Google
            </button>
        </div>
    );
};