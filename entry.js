const { BrowserWindow, app, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const appLogo = path.join(__dirname, '/build/icons/512x512.png')

const init = () => {
    const window = new BrowserWindow({
        width: 1200,
        height: 675,
        icon: appLogo,
        frame: false,
        autoHideMenuBar: true,
        title: 'CompassCAD',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    require('@electron/remote/main').initialize()
    require('@electron/remote/main').enable(window.webContents)
    window.loadFile('src/html/index.html')
    window.setMenuBarVisibility(false)
    if (!fs.existsSync(app.getPath('userData') + '/.compasscfg')) {
        fs.writeFileSync(app.getPath('userData') + '/.compasscfg', '{"maximumStack":50,"fontSize":24,"autosaveEvery":60,"enableAutosave":false,"gridSpacing":100,"disableLerp": false,"lang":"en"}', { encoding: 'utf-8' });
    }
    if (!fs.existsSync(app.getPath('userData') + '/backups')) {
        fs.mkdirSync(app.getPath('userData') + '/backups');
    }
    ipcMain.on('ragequit', (e) => {
        app.quit()
    })
}
app.on('ready', () => {
    console.log('App Ready')
    init()
})
app.on('quit', () => {
    app.quit()
})
app.on('window-all-closed', () => {
    app.quit()
})
try {
    require('electron-reloader')(module)
} catch (e) {
    console.log(e)
}
