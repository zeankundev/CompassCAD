import React from "react";
import { GetLanguage, locales } from "./LanguageHandler";
import styles from '../styles/home.module.css'
const LanguageSwitcher = () => {
     function getFlagEmoji(countryCode: string) {
        if (!countryCode || countryCode.length !== 2) {
            return ''; // Or handle invalid input as you see fit
        }

        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0)); // 127397 is the offset for regional indicator symbols

        return String.fromCodePoint(...codePoints);
        }
    return (
        <React.Fragment>
            <div className={styles['language-switcher-preview']}>
                <img
                    src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${getFlagEmoji(GetLanguage())}`}
                />
                {GetLanguage().toUpperCase()}
            </div>
        </React.Fragment>
    )
}
export default LanguageSwitcher;