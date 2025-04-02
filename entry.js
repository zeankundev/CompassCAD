const { BrowserWindow, app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const appLogo = path.join(__dirname, '/build/icons/512x512.png');

// Utility function to check if the path is a valid file
function isValidFilePath(p) {
  try {
    return fs.existsSync(p) && fs.lstatSync(p).isFile(); // Check if the path exists and is a file
  } catch (error) {
    return false;
  }
}

// Function to detect a valid file path from argv[1] or argv[2]
function detectFilePath() {
  const possiblePaths = [process.argv[1], process.argv[2]];
  for (const p of possiblePaths) {
    if (isValidFilePath(p)) {
      console.log(`Detected valid file path: ${p}`);
      return p;
    }
  }
  console.log('No valid file path detected.');
  return null;
}

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
      contextIsolation: false,
    },
  });

  require('@electron/remote/main').initialize();
  require('@electron/remote/main').enable(window.webContents);
  window.loadFile('src/html/index.html');
  window.setMenuBarVisibility(false);

  // Send the detected file path to the renderer once the window is ready
  if (mostValidFilePath) {
    window.webContents.on('did-finish-load', async() => {
      setTimeout(() => {
        console.log(`Sending valid file path to renderer: ${mostValidFilePath}`);
        window.webContents.send('file-path', mostValidFilePath);
      }, 500)
    });
  }

  // Initialize user configuration files if they don't exist
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(`${userDataPath}/.compasscfg`)) {
    fs.writeFileSync(
      `${userDataPath}/.compasscfg`,
      '{"maximumStack":50,"fontSize":24,"autosaveEvery":60,"enableAutosave":false,"gridSpacing":100,"disableLerp": false,"useOldGrid": false,"lang":"en","preferredFont":"gsansmono", "flags":[], "gridSettings": [100, 50, 25, 10]}',
      { encoding: 'utf-8' }
    );
  }
  if (!fs.existsSync(`${userDataPath}/backups`)) {
    fs.mkdirSync(`${userDataPath}/backups`);
  }
  if (!fs.existsSync(`${userDataPath}/plugins`)) {
    fs.mkdirSync(`${userDataPath}/plugins`);
  }

  ipcMain.on('ragequit', () => {
    app.quit();
  });
};

const mostValidFilePath = detectFilePath(); // Detect the valid file path on startup

app.on('ready', () => {
  console.log('App Ready');
  init();
  console.log(`Detected File Path: ${mostValidFilePath}`);
});

app.on('quit', () => {
  app.quit();
});

app.on('open-file', (e, filePath) => {
  e.preventDefault();
  console.log('Open file requested:', filePath);
});

app.on('window-all-closed', () => {
  app.quit();
});

try {
  require('electron-reloader')(module);
} catch (e) {
  console.log(e);
}
