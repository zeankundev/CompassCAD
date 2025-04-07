const path = require('path');
const remApp = require('@electron/remote').app;

function ConfigHandler() {
    this.configuration = null;
    this.defaults = { maximumStack: 50, fontSize: 24, autosaveEvery: 60, enableAutosave: false, gridSpacing: 100, disableLerp: false, useOldGrid: false, lang: "en", preferredFont: 'gsansmono', flags: [], gridSettings: [100, 50, 25, 10] };
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

ConfigHandler.prototype.getFlags = async function() {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('flags')) {
            return this.configuration['flags'];
        } else {
            console.warn(`Key 'flags' not found in configuration, falling back to default value.`);
            return this.defaults['flags'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}
ConfigHandler.prototype.appendFlag = async function(flag) {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('flags')) {
            this.configuration['flags'].push(flag);
            await this.saveConfig();
            console.log(`Key 'flags' updated to '${this.configuration['flags']}' and configuration saved.`);
        } else {
            console.warn(`Key 'flags' not found in configuration, falling back to default value.`);
            return this.defaults['flags'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}
ConfigHandler.prototype.purgeFlag = async function(flag) {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('flags')) {
            const index = this.configuration['flags'].indexOf(flag);
            if (index > -1) {
                this.configuration['flags'].splice(index, 1);
                await this.saveConfig();
                console.log(`Key 'flags' updated to '${this.configuration['flags']}' and configuration saved.`);
            }
        } else {
            console.warn(`Key 'flags' not found in configuration, falling back to default value.`);
            return this.defaults['flags'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}

ConfigHandler.prototype.getGridSettings = async function() {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('gridSettings')) {
            return this.configuration['gridSettings'];
        } else {
            console.warn(`Key 'gridSettings' not found in configuration, falling back to default value.`);
            return this.defaults['gridSettings'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}

ConfigHandler.prototype.appendGridSetting = async function(gridSetting) {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('gridSettings')) {
            this.configuration['gridSettings'].push(gridSetting);
            await this.saveConfig();
            console.log(`Key 'gridSettings' updated to '${this.configuration['gridSettings']}' and configuration saved.`);
        } else {
            console.warn(`Key 'gridSettings' not found in configuration, falling back to default value.`);
            return this.defaults['gridSettings'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}
ConfigHandler.prototype.purgeGridSetting = async function(gridSetting) {
    await this.loadConfig();
    if (this.configuration != null) {
        if (this.configuration && Object.keys(this.configuration).includes('gridSettings')) {
            const index = this.configuration['gridSettings'].indexOf(gridSetting);
            if (index > -1) {
                this.configuration['gridSettings'].splice(index, 1);
                await this.saveConfig();
                console.log(`Key 'gridSettings' updated to '${this.configuration['gridSettings']}' and configuration saved.`);
            }
        } else {
            console.warn(`Key 'gridSettings' not found in configuration, falling back to default value.`);
            return this.defaults['gridSettings'];
        }
    } else {
        console.error("CONFIG IS NULL! ASK CHATGPT NOW! Or, diagnose yourself.");
        console.log(this.configuration);
        return null; // You may want to return a default value or handle this case differently
    }
}

module.exports = ConfigHandler;

