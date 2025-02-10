const path = require('path');
const remApp = require('@electron/remote').app;

function ConfigHandler() {
    this.configuration = null;
    this.defaults = { maximumStack: 50, fontSize: 24, autosaveEvery: 60, enableAutosave: false, gridSpacing: 100, disableLerp: false, useOldGrid: false, lang: "en", preferredFont: 'gsansmono' };
}

ConfigHandler.prototype.loadConfig = async function() {
    const configPath = path.join(remApp.getPath('userData'), '.compasscfg');
    try {
        const resp = await fs.promises.readFile(configPath, 'utf-8');
        this.configuration = JSON.parse(resp);
    } catch (err) {
        if (err instanceof SyntaxError) {
            console.error("JSON parsing error:", err.message);
        } else {
            console.error("Error loading configuration:", err);
            alert('Your CompassCAD config file is missing or unreadable.\nReopen CompassCAD without restarting the instance.\nStack trace: ' + err);
        }
        // Fallback to defaults on error
        this.configuration = { ...this.defaults };
    }
};


ConfigHandler.prototype.saveConfig = async function() {
    const configPath = path.join(remApp.getPath('userData'), '.compasscfg');
    await fs.promises.writeFile(configPath, JSON.stringify(this.configuration, null, 2), 'utf-8')
        .then(() => {
            setTimeout(() => {
                document.getElementById('config-saved').style.display = 'none'
            }, 2000)
            document.getElementById('config-saved').style.display = 'flex'
        })
        .catch(err => console.error("Error saving configuration:", err));
}

ConfigHandler.prototype.getValueKey = async function(key) {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes(key)) {
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

ConfigHandler.prototype.saveKey = async function(key, value) {
    console.log('key save requested')
    await this.loadConfig();
    if (this.configuration != null) {
        this.configuration[key] = value;
        await this.saveConfig();
        console.log(`Key '${key}' updated to '${value}' and configuration saved.`);
    } else {
        console.error("CONFIG IS NULL! Cannot save key.");
        console.log(this.configuration);
    }
};

module.exports = ConfigHandler;

