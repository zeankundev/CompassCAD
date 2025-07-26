import { posix } from 'path';
import React, { JSX } from 'react';
import { text } from 'stream/consumers';

export const supportedLanguages = ['en', 'nl', 'id', 'sv'].sort();
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
                nothingInHistory: "Well, you got nothing on your history list today. Make some drawings and your history will appear here.",
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
            },
            main: {
                newDesign: "New Design",
                loading: {
                    heading: "Loading CompassCAD...",
                    subHeading: "Just wait, you'll be ready in a sec.",
                },
                betaWarning: "Hey there! Just a heads up that this editor is still in beta, so expect broken buttons and non-functioning UI",
                header: {
                    goBackHome: "Go back home",
                    undo: "Undo",
                    redo: "Redo",
                    share: "Share/Export",
                    shareModal: {
                        heading: "Share/Export Design",
                        copyLink: "Copy Link",
                    }
                },
                essential: {
                    select: "Select",
                    navigate: "Navigate",
                    move: "Move",
                    delete: "Delete",
                    addPoint: "Add Point",
                    addLine: "Add Line",
                    addRectangle: "Add Rectangle",
                    addCircle: "Add Circle",
                    addArc: "Add Arc",
                    addMeasure: "Add Measure",
                    addLabel: "Add Label",
                    addImage: "Add Image",
                    addPolygon: "Add Polygon",
                },
                inspector: {
                    header: "Inspector",
                    collapseToRight: "Collapse to right",
                    expand: "Expand",
                    nothing: "Select a component then your component details should appear here.",
                    general: {
                        active: "Active",
                        radius: "Radius",
                        color: "Color",
                        opacity: "Opacity",
                        position: "Position",
                        size: "Size",
                        coverage: "Arc Coverage",
                    },
                    text: {
                        heading: "Text Properties",
                        text: "Text",
                        fontSize: "Font Size",
                    },
                    picture: {
                        heading: "Picture Properties",
                        src: "Source",
                    },
                    polygon: {
                        heading: "Polygon Properties",
                        fillColor: "Fill Color",
                        strokeColor: "Stroke Color",
                        enableStroke: "Enable Stroke",
                    }
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
                nothingInHistory: "Je hebt niets in je geschiedenis list. Maken veel ontwerp en jouw geschiedenis hier verschijnen.",
                randomMesg: {
                    morning: {
                        one: "Yo! Heb je al koffie gehad ofzo? ☕",
                        two: "Morgen! Klaar om te beginnen? 🌄", 
                        three: "Morgen! Laat zien wat je gaat brainstormen! 🤩"
                    },
                    noon: {
                        one: "Zit je nu te chillen ofzo? 🧐",
                        two: "Eerst lunchen, dan terug hier! 😋",
                        three: "Hopelijk lig je niet te slapen! 😴"
                    },
                    afternoon: {
                        one: "Ben je nog wakker? Kom op, designen! 🗺️",
                        two: "Houd die creativiteit gaande man! ✏️",
                        three: "Perfect moment voor CAD! 📐"
                    },
                    evening: {
                        one: "'s Avonds nog aan het werk? 🧐",
                        two: "Heb je nog iets voor de deadline? ⌚",
                        three: "Jij bent nog steeds bezig. Ga door. 💪"
                    },
                    night: {
                        one: "Moet je niet slapen ofzo? 🛌",
                        two: "Per ongeluk aan het brainstormen? 😵‍💫",
                        three: "Damn, jouw cafeïne level zakt nooit he ☕"
                    },
                    dawn: {
                        one: "Ik ga slapen, oh wacht toch niet 😴",
                        two: "Ochtendgloren en jij hebt nog steeds ideeën? 😮‍💨",
                        three: "Hopelijk zit je niet in de stress 🥲"
                    },
                }
            },
            main: {
                newDesign: "Nieuw ontwerp",
                loading: {
                    heading: "CompassCAD laden...",
                    subHeading: "Even wachten, je bent zo klaar.",
                },
                betaWarning: "Hé! Even ter info: deze editor is nog in beta, dus verwacht kapotte knoppen en niet-werkende interface",
                header: {
                    goBackHome: "Terug naar home",
                    undo: "Ongedaan maken",
                    redo: "Opnieuw doen",
                    share: "Delen/Exporteren",
                    shareModal: {
                        heading: "Ontwerp delen/exporteren",
                        copyLink: "Link kopiëren",
                    }
                },
                essential: {
                    select: "Selecteren",
                    navigate: "Navigeren",
                    move: "Verplaatsen",
                    delete: "Verwijderen",
                    addPoint: "Punt toevoegen",
                    addLine: "Lijn toevoegen",
                    addRectangle: "Rechthoek toevoegen",
                    addCircle: "Cirkel toevoegen",
                    addArc: "Boog toevoegen",
                    addMeasure: "Meten",
                    addLabel: "Label toevoegen",
                    addImage: "Afbeelding toevoegen",
                    addPolygon: "Veelhoek toevoegen",
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
                nothingInHistory: "Kamu tidak mempunyai apa-apa di daftar riwayatmu. Buatlah desain dan riwayatmu akan muncul disini",
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
            },
            main: {
                newDesign: "Desain Baru",
                loading: {
                    heading: "Memuat CompassCAD...",
                    subHeading: "Bentar lagi, nanti disiapin kok.",
                },
                betaWarning: "Hei! Cuma mau kasih tau kalau editor ini masih beta, jadi harap maklum kalau ada tombol yang rusak atau UI yang ga berfungsi",
                header: {
                    goBackHome: "Kembali",
                    undo: "Urungkan",
                    redo: "Ulangi",
                    share: "Bagi/Ekspor",
                    shareModal: {
                        heading: "Bagi/Ekspor Desain",
                        copyLink: "Salin link",
                    }
                },
                essential: {
                    select: "Pilih",
                    navigate: "Navigasi",
                    move: "Pindah",
                    delete: "Hapus",
                    addPoint: "Tambahkan Poin",
                    addLine: "Tambahkan Garis",
                    addRectangle: "Tambahkan Persegi",
                    addCircle: "Tambahkan Lingkaran",
                    addArc: "Tambahkan Busur",
                    addMeasure: "Ukur",
                    addLabel: "Tambahkan Label",
                    addImage: "Tambahkan Gambar",
                    addPolygon: "Tambahkan Poligon",
                },
                inspector: {
                    header: "Inspektor",
                    collapseToRight: "Tutup ke kanan",
                    expand: "Buka",
                    nothing: "Pilih komponen, lalu detail komponen kamu akan ditampil disini.",
                    general: {
                        active: "Aktif",
                        radius: "Radius",
                        color: "Warna",
                        opacity: "Opasitas",
                        position: "Posisi",
                        size: "Ukuran",
                        coverage: "Koverasi Busur",
                    },
                    text: {
                        heading: "Properti Teks",
                        text: "Teks",
                        fontSize: "Ukuran Font",
                    },
                    picture: {
                        heading: "Properti Gambar",
                        src: "Sumber",
                    },
                    polygon: {
                        heading: "Properti Poligon",
                        fillColor: "Warna Isi",
                        strokeColor: "Warna Garis",
                        enableStroke: "Aktifkan Garis",
                    }
                }
            }
        }
    },
    sv: {
        name: "Svenska",
        general: {
            yes: "Ja",
            no: "Nej"
        },
        home: {
            header: "Bygg dina drömmar utan att slösa tid på att lära dig komplexa verktyg. Det är dags att förenkla din \"drömbyggande\" design",
            descHero: "Tänk om CAD var lika enkelt som de verktyg vi använder idag, som Notion eller till och med Figma. Förutom att vi kan omdefiniera vad \"kraftfulla verktyg\" betyder för arkitekturdesign",
            downloadButton: "Ladda ner för plattform",
            inBrowserEditor: "Redigerare i webbläsaren",
            header1Sub: "Blixtsnabbt CAD-program. Gratis, men ändå enkelt och minimalistiskt",
            paragraph1Sub: "Byggd från hjärtat av fattiga utvecklare som inte har råd med en bra dator och ett CAD-program, skapat för att du ska kunna njuta av det.",
            littleNote1: "*Endast tillgängligt för Windows och Linux.",
            header2Sub: "Ingen skrivbordsversion eller fungerar det inte? Vi har alltid webbversionen!",
            littleNote2: "*Bilder kan se annorlunda ut än den faktiska programvaran"
        },
        editor: {
            home: {
                quickActions: "Snabba åtgärder",
                createNew: "Skapa ny",
                importExisting: "Importera befintlig",
                clearEntireHistory: "Rensa hela historiken",
                askBlueprint: "Fråga Blueprint",
                recents: "Senaste",
                blueprintPlaceholder: "Fråga eller skapa med Blueprint AI",
                blueprintWarning: "AI-genererat innehåll kan vara felaktigt eller oprecist. Drivs av Google AI:s Gemini",
                clearHistoryModal: "Rensa historik",
                text1Sure: "Är du säker på att du vill rensa hela historiken? ",
                boldTextWarning: "Denna åtgärd kan inte ångras.",
                viewInEditor: "Visa/redigera denna design i redigeraren",
                nothingInHistory: "Du har inget i din historiklista idag. Gör några ritningar så visas din historik här.",
                randomMesg: {
                    morning: {
                        one: "Hallå där? Har du tagit en kopp kaffe? ☕",
                        two: "God morgon! Redo att börja dagen? 🌄",
                        three: "Morgon! Låt oss se vad du hittar på! 🤩"
                    },
                    noon: {
                        one: "Börjar du något vid den här tiden? 🧐",
                        two: "Lunchdags! Sugen på något och jobba här! 😋",
                        three: "Jag hoppas du inte sover! 😴"
                    },
                    afternoon: {
                        one: "Är du fortfarande uppe? Låt oss designa! 🗺️",
                        two: "Låt kreativiteten flöda! ✏️",
                        three: "Perfekt tid för CAD-arbete! 📐"
                    },
                    evening: {
                        one: "Jobbar du fortfarande på kvällarna? 🧐",
                        two: "Har du något i sista minuten? ⌚",
                        three: "Ändå är du fortfarande stark. Fortsätt så 💪"
                    },
                    night: {
                        one: "Ska du inte sova? 🛌",
                        two: "Brainstormade du av misstag nu? 😵‍💫",
                        three: "Ändå tar ditt koffein aldrig slut. ☕"
                    },
                    dawn: {
                        one: "Jag ska sova, vänta, strunt samma. 😴",
                        two: "Så sent och har du några idéer? 😮‍💨",
                        three: "Hoppas du inte skjuter upp saker! 🥲"
                    }
                }
            },
            main: {
                loading: {
                    heading: "Laddar CompassCAD...",
                    subHeading: "Vänta bara, du är klar om en sekund."
                },
                betaWarning: "Hej! Bara ett tips om att den här redigeraren fortfarande är i beta, så förvänta dig trasiga knappar och ett icke-fungerande användargränssnitt.",
                newDesign: "Ny Design",
                header: {
                    goBackHome: "Gå tillbaka hem",
                    undo: "Ångra",
                    redo: "Upprepa",
                    share: "Dela/Exportera",
                    shareModal: {
                        heading: "Dela/Exportera Design",
                        copyLink: "Kopiera Link",
                    }
                },
                essential: {
                    select: "Välja",
                    navigate: "Navigera",
                    move: "Flytta",
                    delete: "Raderra",
                    addPoint: "Lägg till Punkt",
                    addLine: "Lägg till Linje",
                    addRectangle: "Lägg till Rektangel",
                    addCircle: "Lägg till Cirkel",
                    addArc: "Lägg till Båge",
                    addMeasure: "Mät",
                    addLabel: "Lägg till Text",
                    addImage: "Lägg till Bild",
                    addPolygon: "Lägg till Polygon",
                },
                inspector: {
                    header: "Inspektör",
                    collapseToRight: "Kollapsa åt höger",
                    expand: "Expandera",
                    nothing: "Välj en komponent så ska dina komponentdetaljer visas här.",
                    general: {
                        active: "Aktiv",
                        radius: "Radius",
                        color: "Färg",
                        opacity: "Opacitet",
                        position: "Position",
                        size: "Storlek",
                        coverage: "Båge Täckning",
                    },
                    text: {
                        heading: "Text Egenskaper",
                        text: "Text",
                        fontSize: "Fontstorlek",
                    },
                    picture: {
                        heading: "Bild Egenskaper",
                        src: "Källa",
                    },
                    polygon: {
                        heading: "Polygon Egenskaper",
                        fillColor: "Fyllningsfärg",
                        strokeColor: "Streckfärg",
                        enableStroke: "Aktivera Streck",
                    }
                }
            }
        }
    }
}