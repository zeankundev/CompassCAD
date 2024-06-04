const path = require('path');
const remApp = require('@electron/remote').app;

function ConfigHandler() {
    this.configuration = null;
    this.defaults = {undoStackSize: 50, redoStackSize: 50, fontSize: 24, autosaveEvery: 60, enableAutosave: false, gridSpacing: 100, lang: 'en'};
}

ConfigHandler.prototype.loadConfig = function() {
    const configPath = path.join(remApp.getPath('userData'), '.compasscfg');
    return fs.promises.readFile(configPath, 'utf-8')
        .then(resp => JSON.parse(resp))
        .then(data => {
            this.configuration = data;
            return data;
        })
        .catch(err => {
            console.error("Error reading configuration file:", err);
            this.configuration = { ...this.defaults };
            return this.configuration;
        });
};

ConfigHandler.prototype.getValueKey = function(key) {
    if (!this.configuration) {
        console.warn("Configuration not loaded yet, falling back to default value.");
        return this.defaults[key];
    }

    if (key in this.configuration) {
        return this.configuration[key];
    } else {
        console.warn(`Key '${key}' not found in configuration, falling back to default value.`);
        return this.defaults[key];
    }
};

module.exports = ConfigHandler;
