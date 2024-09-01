const remote = require('@electron/remote')

const getWin = () => remote.BrowserWindow.getFocusedWindow()
var lastWindowState = 'win'
document.getElementById('minimize').onclick = () => getWin().minimize()
document.getElementById('maximize').onclick = () => getWin().isMaximized() ? getWin().unmaximize() : getWin().maximize()
document.getElementById('close').onclick = () => getWin().close()
setInterval(function () {
    if (getWin().isMaximized() & lastWindowState == 'win') {
        lastWindowState = 'max'
        document.getElementById("maximize").innerHTML = `<img src="../../assets/icons/restoredown.svg">`
    } else if (!getWin().isMaximized() & lastWindowState == 'max') {
        lastWindowState = 'win'
        document.getElementById("maximize").innerHTML = `<img src="../../assets/icons/maximize.svg">`
    }
}, 0)