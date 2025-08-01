// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { getFirestore, doc as firestoreDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
}
export const signInWithEmailPassword = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
}
// Initialize Firestore
const db = getFirestore(app);

export const createUserIfNotExists = async (userData: { uid: string, email: string, displayName: string, photoURL: string }) => {
    try {
        const userRef = firestoreDoc(db, 'users', userData.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                createdAt: serverTimestamp()
            });
            console.log("New user created successfully");
        }
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}
export const getAccessToken = () => {
    const cookies = document.cookie.split('; ');
    const accessTokenCookie = cookies.find(cookie => cookie.startsWith('accessToken='));
    if (accessTokenCookie) {
        return accessTokenCookie.split('=')[1];
    }
    return null;
}
export const getUID = (accessToken: string) => {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    return payload.uid;
}
export const getUser = async (uid: string) => {
    try {
        const userRef = firestoreDoc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            console.log("No such user!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
}
