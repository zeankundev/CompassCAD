import React, { JSX } from 'react';

export const supportedLanguages = ['en', 'nl', 'id'];
export const SetLanguage = (lang: string) => {
    const selectedLang = supportedLanguages.includes(lang) ? lang : 'en';
    localStorage.setItem('language', selectedLang);
}
export const GetLanguage = () => {
    const lang = localStorage.getItem('language') || navigator.language.split('-')[0];
    return locales[lang] ? lang : 'en';
}
export function getLocaleKey(path: string): string {
    const lang = GetLanguage();
    const keys = path.split('.');
    let value = locales[lang];
    for (const key of keys) {
        if (value && key in value) {
            value = value[key];
        } else {
            value = undefined;
            break;
        }
    }
    if (typeof value === 'string') {
        return value;
    }
    // fallback to English
    value = locales['en'];
    for (const key of keys) {
        if (value && key in value) {
            value = value[key];
        } else {
            return '';
        }
    }
    return typeof value === 'string' ? value : '';
}
export const locales : any = {
    en: {
        name: "English",
        general: {
            yes: "Yes",
            no: "No"
        },
        home: {
            header: "Build your dreams without wasting time to learn complex tools. It's time to simplify your \"dream building\" design",
            descHero: "Imagine if CAD went as simple as the power tools we use today like Notion or even Figma. Except that, we can redefine what \"power tools\" means for architecture design",
            downloadButton: "Download for platform",
            inBrowserEditor: "In-browser editor",
            header1Sub: "Blazingly fast CAD software. Free of charge, yet simple and minimalistic",
            paragraph1Sub: "Built from the hearts of broke developers who cannot afford a good computer and a CAD software, created for you to enjoy.",
            littleNote1: "*Only available for Windows and Linux.",
            header2Sub: "No desktop version or it doesn't work? We always have the web version!",
            littleNote2: "*Images may appear different than the actual software"
        },
        editor: {
            home: {
                quickActions: "Quick Actions",
                createNew: "Create New",
                importExisting: "Import existing",
                clearEntireHistory: "Clear entire history",
                askBlueprint: "Ask Blueprint",
                recents: "Recents",
                blueprintPlaceholder: "Ask or create with Blueprint AI",
                blueprintWarning: "AI-generated content may be false or inaccurate. Powered by Google AI's Gemini",
                clearHistoryModal: "Clear History",
                text1Sure: "Are you sure you want to clear the entire history? ",
                boldTextWarning: "This action cannot be undone.",
                viewInEditor: "View/Edit this design in editor",
                randomMesg: {
                    morning: {
                        one: "Hey there? Had some coffee? ☕",
                        two: "Good morning! Ready to start your day? 🌄",
                        three: "Morning! Let's see what you'll brainstorm! 🤩"
                    },
                    noon: {
                        one: "Starting anything at this time? 🧐",
                        two: "Lunch time! Crave something and work here! 😋",
                        three: "I hope you're not sleeping! 😴"
                    },
                    afternoon: {
                        one: "You still up? Let's design! 🗺️",
                        two: "Keep the creativity flowing! ✏️",
                        three: "Perfect time for CAD work! 📐"
                    },
                    evening: {
                        one: "You still working on evenings? 🧐",
                        two: "Got anything last minute? ⌚",
                        three: "Yet you're still strong. Keep it up 💪"
                    },
                    night: {
                        one: "Aren't you supposed to sleep? 🛌",
                        two: "Accidentally brainstormed now? 😵‍💫",
                        three: "Yet, your caffeine never drains. ☕"
                    },
                    dawn: {
                        one: "I'm going to sleep, wait nevermind. 😴",
                        two: "This late and you got any ideas? 😮‍💨",
                        three: "Hope you're not procrastinating! 🥲"
                    },
                }
            }
        }
    },
    nl: {
        name: "Nederlands",
        general: {
            yes: "Ja",
            no: "Nee"
        },
        home: {
            header: "Bouw je dromen zonder tijd te verspillen aan het leren van complexe tools. Het is tijd om het ontwerp van je \"droomgebouw\" te vereenvoudigen.",
            descHero: "Stel je voor dat CAD net zo eenvoudig zou zijn als de krachtige tools die we vandaag de dag gebruiken, zoals Notion of zelfs Figma. Maar dan kunnen we opnieuw definiëren wat \"krachtige tools\" betekent voor architectuurontwerp.",
            downloadButton: "Downloaden voor platform",
            inBrowserEditor: "In-browser editor",
            header1Sub: "Razendsnelle CAD-software. Gratis, maar toch eenvoudig en minimalistisch.",
            paragraph1Sub: "Gemaakt door de harten van arme ontwikkelaars die zich geen goede computer en CAD-software kunnen veroorloven. Speciaal voor jou gemaakt, zodat je ervan kunt genieten.",
            littleNote1: "*Alleen beschikbaar voor Windows en Linux.",
            header2Sub: "Geen desktopversie of werkt het niet? Wij hebben altijd de webversie!",
            littleNote2: "*Afbeeldingen kunnen er anders uitzien dan de daadwerkelijke software."
        },
        editor: {
            home: {
                quickActions: "Snelle acties",
                createNew: "Nieuw maken",
                importExisting: "Bestaand importeren",
                clearEntireHistory: "Hele geschiedenis wissen",
                askBlueprint: "Blueprint vragen",
                recents: "Recenten",
                blueprintPlaceholder: "Vraag of maak met Blueprint AI",
                blueprintWarning: "AI-gegenereerde inhoud kan onjuist of onnauwkeurig zijn. Aangedreven door Google AI's Gemini",
                clearHistoryModal: "Geschiedenis wissen",
                text1Sure: "Weet je zeker dat je de hele geschiedenis wilt wissen?",
                boldTextWarning: "Deze actie kan niet ongedaan worden gemaakt.",
                viewInEditor: "Bekijk/bewerk dit ontwerp in de editor",
                randomMesg: {
                    morning: {
                        one: "Hé daar? Al koffie gehad? Die eerste slok is pure magie! ☕",
                        two: "Goedemorgen! Klaar om je dag te beginnen? Laat die creativiteit knallen! 🌄",
                        three: "Morgen! Laten we kijken wat je gaat brainstormen! Tijd om te schitteren! 🤩"
                    },
                    noon: {
                        one: "Begin je nu iets op dit moment? Perfecte timing! 🧐",
                        two: "Lunchtijd! Heb trek in iets en werk hier! Fuel die hersenen! 😋",
                        three: "Ik hoop dat je niet slaapt! Middagdipje overslaan! 😴"
                    },
                    afternoon: {
                        one: "Ben je nog wakker? Laten we ontwerpen! Tijd voor actie! 🗺️",
                        two: "Houd die creativiteit stromen! Laat je inspiratie los! ✏️",
                        three: "Perfecte tijd voor CAD-werk! Precisie is koning! 📐"
                    },
                    evening: {
                        one: "Werk je nog steeds 's avonds? Echte doorzetter! 🧐",
                        two: "Heb je nog iets last-minute? Spannend! ⌚",
                        three: "Toch ben je nog steeds sterk. Ga zo door, held! 💪"
                    },
                    night: {
                        one: "Zou je niet moeten slapen? Nachtbraker! 🛌",
                        two: "Per ongeluk nu gebrainstormd? Geniale timing! 😵‍💫",
                        three: "Toch raakt je cafeïne nooit op. Onvermoeibaar! ☕"
                    },
                    dawn: {
                        one: "Ik ga slapen, wacht even niet. Samen doorhalen! 😴",
                        two: "Zo laat en je hebt nog ideeën? Indrukwekkend! 😮‍💨",
                        three: "Hoop dat je niet aan het uitstellen bent! Pak die kans! 🥲"
                    },
                }
            }
        }
    },
    id: {
        name: "Bahasa Indonesia",
        general: {
            yes: "Iya",
            no: "Tidak"
        },
        home: {
            header: "Buatlah mimpimu tanpa membuang waktu untuk belajar alat yang susah. Saatnya menyederhanakan desain \"bangunan impian\"",
            descHero: "Bayangkan kalau CAD menjadi semudah alat canggih kita pakai seperti Notion atau Figma. Kecuali itu, kita bisa mengartikan ulang apa itu \"alat canggih\" untuk desain arsitektur sipil.",
            downloadButton: "Unduh untuk",
            inBrowserEditor: "Editor dalam browser",
            header1Sub: "Software CAD yang betul-betulnya cepat. Gratis, tetapi mudah dan minimalis",
            paragraph1Sub: "Dibuat dari hati seorang programmer biasa yang tidak bisa membeli komputer bagus dan software CAD, dibuat untukmu untuk dinikmati.",
            littleNote1: "*Hanya ada di Windows dan Linux",
            header2Sub: "Tidak ada versi desktop atau tidak bisa? Kita selalu punya versi web!",
            littleNote2: "*Gambar tentu berbeda dari software sebenarnya"
        },
        editor: {
            home: {
                quickActions: "Aksi cepat",
                createNew: "Buat baru",
                importExisting: "Buka yang tersedia",
                clearEntireHistory: "Hapus riwayat",
                askBlueprint: "Tanya Blueprint",
                recents: "Terbaru",
                blueprintPlaceholder: "Tanya atau buat dengan Blueprint AI",
                blueprintWarning: "Konten dibuat AI mungkin salah atau tidak akurat.",
                clearHistoryModal: "Hapus riwayat",
                text1Sure: "Yakin untuk menghapuskan seluruh riwayatmu? ",
                boldTextWarning: "Aksi ini tidak bisa diundurkan!",
                viewInEditor: "Lihat/sunting desain ini di editor",
                randomMesg: {
                    morning: {
                        one: "Hey! Lo udah ngopi belom? ☕",
                        two: "Pagi! Udah siap mulai hari? 🌄",
                        three: "Pagi! Ayo liat lo brainstorm apa ini! 🤩"
                    },
                    noon: {
                        one: "Lo lagi gabut ya? 🧐",
                        two: "Maem siang dulu, baru balik kesini! 😋",
                        three: "Semoga ga tidur! 😴"
                    },
                    afternoon: {
                        one: "Masih bangun? Ayo desain! 🗺️",
                        two: "Kreativitasnya dong, terusin! ✏️",
                        three: "Waktunya perfect buat CAD! 📐"
                    },
                    evening: {
                        one: "Malem malem masih kerja? 🧐",
                        two: "Ada sesuatu sebelom deadline ga? ⌚",
                        three: "Lo masih kuat aja. Terusin. 💪"
                    },
                    night: {
                        one: "Bukannya lo harus tidur? 🛌",
                        two: "Ga sengaja brainstorm? 😵‍💫",
                        three: "Beuh, kafein lo ga pernah turun sama sekali ☕"
                    },
                    dawn: {
                        one: "Gue mau tidur, eh gajadi 😴",
                        two: "Dini hari/subuh dan lo aja masih ada ide? 😮‍💨",
                        three: "Semoga ga ditekan deadline 🥲"
                    },
                }
            }
        }
    }
}