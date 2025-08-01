import { useState } from 'react';
import { signInWithGoogle, signInWithEmailPassword, createUserIfNotExists } from '../components/FirebaseConfig';
import styles from '../styles/community.module.css';

export const CommunitySignIn = () => {
    return (
        <div className={styles['community-signin']}>
            <h1>Community Sign In</h1>
            
        </div>
    );
};