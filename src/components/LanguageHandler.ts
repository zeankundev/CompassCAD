export const GetLanguage = () => {
    const lang = navigator.language.split('-')[0];
    return locales[lang] ? lang : 'en';
}
export const locales : any = {
    en: {
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
        }
    },
    nl: {
        home: {
            header: "Bouw je dromen zonder tijd te verspillen aan het leren van complexe tools. Het is tijd om het ontwerp van je \"droomgebouw\" te vereenvoudigen.",
            descHero: "Stel je voor dat CAD net zo eenvoudig zou zijn als de krachtige tools die we vandaag de dag gebruiken, zoals Notion of zelfs Figma. Maar dan kunnen we opnieuw definiëren wat \"krachtige tools\" betekent voor architectuurontwerp.",
            downloadButton: "Downloaden voor platform",
            inBrowserEditor: "In-browser editor",
            header1Sub: "Razendsnelle CAD-software. Gratis, maar toch eenvoudig en minimalistisch.",
            paragraph1Sub: "Gemaakt door de harten van arme ontwikkelaars die zich geen goede computer en CAD-software kunnen veroorloven. Speciaal voor jouw gemaakt, zodat je ervan kunt genieten.",
            littleNote1: "*Alleen beschikbaar voor Windows en Linux.",
            header2Sub: "Geen desktopversie of het werkt niet? Wij hebben de webversie!",
            littleNote2: "*Afbeeldingen kunnen er anders uitzien dan de daadwekelijke software."
        }
    }
}