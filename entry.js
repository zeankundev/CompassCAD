const { BrowserWindow, app } = require('electron')
const path = require('path')
const appLogo = path.join(__dirname, '/build/icons/512x512.png')

const init = () => {
    const window = new BrowserWindow({
        width: 1024,
        height: 600,
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
