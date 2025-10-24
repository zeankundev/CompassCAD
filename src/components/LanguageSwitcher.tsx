import React, { useState } from "react";
import { GetLanguage, locales, SetLanguage, supportedLanguages } from "./LanguageHandler";
import styles from '../styles/home.module.css'
import ReactCountryFlag from "react-country-flag";
const LanguageSwitcher = () => {
    const [languagePicker, showLanguagePicker] = useState<boolean>(false);
    return (
        <div>
            <div 
                className={styles['language-switcher-preview']}
                onClick={() => showLanguagePicker(!languagePicker)}
            >
                <ReactCountryFlag countryCode={
                    GetLanguage() === 'en' ? 'us' : (GetLanguage() === 'sv' ? 'se' : GetLanguage())
                } svg alt={`${GetLanguage} flag`} />
                {locales[GetLanguage()].name}&nbsp;{languagePicker ? '▴': '▾'}
            </div>
            {languagePicker && (
                <div className={styles['language-switcher-dropdown']}>
                    {supportedLanguages.map((language, index) => (
                        <div 
                            className={`${styles['language-dropdown-choice']} ${GetLanguage() == language ? styles['language-active']: ''} ${index == supportedLanguages.length - 1 ? styles.end : ''}`}
                            key={index}
                            onClick={() => {SetLanguage(language);showLanguagePicker(false);window.location.reload()}}
                        >
                            <ReactCountryFlag countryCode={
                                language === 'en' ? 'us' : (language === 'sv' ? 'se' : language)
                            } svg />
                            {locales[language].name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
export default LanguageSwitcher;