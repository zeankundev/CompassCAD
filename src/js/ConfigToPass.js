const path = require('path');
const remApp = require('@electron/remote').app;

function ConfigHandler() {
    this.configuration = null;
    this.defaults = {undoStackSize: 50, redoStackSize: 50, fontSize: 24, autosaveEvery: 60, enableAutosave: false, gridSpacing: 100};

    // Load configuration from file
    fs.promises.readFile(path.join(remApp.getPath('userData'), '.compasscfg'), 'utf-8')
    .then(resp => JSON.parse(resp))
    .then(data => {
        console.log('incoming data from config')
        console.log(data);
        this.configuration = data;
        console.log(this.configuration)
    })
    .catch(err => {
        console.error("Error loading configuration:", err);
        // If there's an error loading the configuration, fallback to defaults
        this.configuration = { ...this.defaults };
    });
}

ConfigHandler.prototype.getValueKey = function(key) {
    console.log(this.configuration)
    if (this.configuration && Object.keys(this.configuration).indexOf(key)) {
        return this.configuration[key];
    } else {
        // If the key is not found, use the default value
        console.warn(`Key '${key}' not found in configuration, falling back to default value.`);
        return this.defaults[key];
    }
};

