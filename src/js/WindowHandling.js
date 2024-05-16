const remote = require('@electron/remote')

const getWin = () => remote.BrowserWindow.getFocusedWindow()
document.getElementById('minimize').onclick = () => getWin().minimize()
document.getElementById('maximize').onclick = () => getWin().isMaximized() ? getWin().unmaximize() : getWin().maximize()
document.getElementById('close').onclick = () => getWin().close()