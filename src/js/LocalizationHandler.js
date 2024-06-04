function Localizator() {
    this.currentLanguageJSON = null;
    this.defaultKey = {
        newDesign: "New Design 1",
        createNew: "New Design (ctrl+n)",
        openDesign: "Open Design (ctrl+o)",
        saveDesign: "Save Design (ctrl+s)",
        saveDesignAs: "Save Design as (ctrl+alt+s)",
        undo: "Undo (ctrl+z)",
        redo: "Redo (ctrl+y)",
        considerSupporting: "Consider supporting Palestine",
        minimize: "Minimize",
        maximize: "Maximize",
        close: "Close",
        navigateToolbar: "Navigate (q)",
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

    this.loadLanguage();
}

Localizator.prototype.loadLanguage = function() {
    const configHandler = new ConfigHandler();
    
    configHandler.loadConfig().then(() => {
        const lang = configHandler.getValueKey('lang');
        return fetch(`../translations/${lang}.json`);
    })
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

Localizator.prototype.getLocalizedString = function(key) {
    if (this.currentLanguageJSON && key in this.currentLanguageJSON) {
        return this.currentLanguageJSON[key];
    } else {
        console.warn(`String ${key} not found, falling back to English`);
        return this.defaultKey[key] || key; // Return the key itself if no fallback available
    }
};

module.exports = Localizator;
