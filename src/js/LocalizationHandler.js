function Localizator() {
    this.currentLanguageJSON = null;
    this.defaultKey = {
        newDesign: "New Design 1",
        createNew: "New Design (ctrl+n)",
        openDesign: "Open Design (ctrl+o)",
        openBackups: "Open Backups",
        backupsTitle: "Recover or open backups",
        hostOrJoinP2P: "Host or join a multi-edit session",
        yourSessionId: "Your Session ID:",
        connectToAnotherP2P: "Connect to an existing session",
        connectedToP2P: "You are now connected. Have fun!",
        totalBackupSize: "Total backup folder size:",
        inspector: "Inspector",
        nothingToInspect: "Nothing to inspect...",
        toggleInspector: "Toggle Inspector",
        saveDesign: "Save Design (ctrl+s)",
        saveDesignAs: "Save Design as (ctrl+alt+s)",
        undo: "Undo (ctrl+z)",
        redo: "Redo (ctrl+y)",
        considerSupporting: "Consider supporting Palestine",
        minimize: "Minimize",
        maximize: "Maximize",
        close: "Close",
        selectToolbar: "Select (q)",
        navigateToolbar: "Navigate (w)",
        moveToolbar: "Move Object (e)",
        deleteToolbar: "Delete Object (t)",
        addPointToolbar: "Add Point (a)",
        addLineToolbar: "Add Line (s)",
        addCircleToolbar: "Add Circle (d)",
        addArcToolbar: "Add Arc (f)",
        addRectangleToolbar: "Add Rectangle (g)",
        addLabelToolbar: "Add Text (h)",
        addBarrelToolbar: "Add Vertical Barrel (j)",
        addTreeToolbar: "Add Tree (k)",
        addMeasureToolbar: "Measure (z)",
        navigate: "Navigate",
        move: "Move (select a node point to move, esc to cancel)",
        delete: "Delete (click a node point to delete, esc to cancel)",
        addPoint: "Add Point (press esc to cancel)",
        addLine: "Add Line (press esc to cancel)",
        addCircle: "Add Circle (press esc to cancel)",
        addArc: "Add Arc (press esc to cancel)",
        addRectangle: "Add Rectangle (press esc to cancel)",
        addLabel: "Add Text (press esc to cancel)",
        addBarrel: "Add Vertical Barrel (press esc to cancel)",
        addTree: "Add Tree (press esc to cancel)",
        addMeasure: "Measure (press esc to cancel)",
        enterText: "Enter text",
        cancel: "Cancel"
    };
}

Localizator.prototype.loadLanguage = async function() {
    const configHandler = new ConfigHandler();
    var lang = await configHandler.getValueKey('lang'); // Wait for the language value
    console.log(lang);
    
    await fetch(`../translations/${lang}.json`)
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Failed to fetch language file');
        }
        return resp.json();
    })
    .then(data => {
        this.currentLanguageJSON = data;
        // Apply translations after loading language file
    })
    .catch(e => {
        console.error('Cannot load language file', e);
        // Apply default translations in case of error
        this.currentLanguageJSON = null;
    });
};

Localizator.prototype.getLocalizedString = async function(key) {
    if (!this.currentLanguageJSON) {
        await this.loadLanguage(); // Ensure language is loaded only once
    }
    if (this.currentLanguageJSON != null) {
        if (this.currentLanguageJSON && Object.keys(this.currentLanguageJSON).includes(key)) {
            return this.currentLanguageJSON[key];
        } else {
            console.warn(`String ${key} not found, falling back to English`);
            return this.defaultKey[key] || key; // Return the key itself if no fallback available
        }
    } else {
        console.error("LANGUAGE NOT AVAILABLE");
        return this.defaultKey[key] || key;
    }
};

module.exports = Localizator;
module.exports = Localizator;
