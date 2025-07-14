import React from "react";
import { GetLanguage, locales } from "./LanguageHandler";
import styles from '../styles/home.module.css'
const LanguageSwitcher = () => {
    return (
        <React.Fragment>
            <div className={styles['language-switcher-preview']}>
                {GetLanguage().toUpperCase()}
            </div>
        </React.Fragment>
    )
}
export default LanguageSwitcher;