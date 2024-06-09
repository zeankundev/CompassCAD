const path = require('path');
const remApp = require('@electron/remote').app;

function ConfigHandler() {
    this.configuration = null;
    this.defaults = { undoStackSize: 50, redoStackSize: 50, fontSize: 24, autosaveEvery: 60, enableAutosave: false, gridSpacing: 100, lang: "en" };
}

ConfigHandler.prototype.loadConfig = async function() {
    console.log("loaded")
    await fs.promises.readFile(path.join(remApp.getPath('userData'), '.compasscfg'), 'utf-8')
        .then(resp => JSON.parse(resp))
        .then(data => {
            console.log('incoming data from config');
            console.log(data);
            this.configuration = data;
            console.log(this.configuration);
        })
        .catch(err => {
            console.error("Error loading configuration:", err);
            // If there's an error loading the configuration, fallback to defaults
            this.configuration = { ...this.defaults };
        });
}

ConfigHandler.prototype.getValueKey = async function(key) {
    console.log('key fetch requested')
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes(key)) {
            console.log('INCLUDED!')
            console.log(`does it exist? ${Object.keys(this.configuration).includes(key) ? 'yes' : 'no'}, value: ${this.configuration[key]}`)
            return this.configuration[key];
        } else {
            // If the key is not found, use the default value
            console.warn(`Key '${key}' not found in configuration, falling back to default value.`);
            return this.defaults[key];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
};
