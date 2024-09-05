const { ipcRenderer } = require('electron')
function callPrompt(message) {
    return new Promise((resolve, reject) => {
        const promptContainer = document.getElementById('prompt-container');
        const promptMessage = document.getElementById('prompt-message');
        const promptInput = document.getElementById('prompt-input');
        const promptOk = document.getElementById('prompt-ok');
        const promptCancel = document.getElementById('prompt-cancel');

        // Set the message
        promptMessage.textContent = message;

        // Show the prompt
        promptContainer.classList.remove('hidden');
        promptInput.focus();  // Focus on the input field

        function disableKeypress(e) {
            if (promptContainer.classList.contains('hidden') || document.activeElement === promptInput) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        window.addEventListener('keydown', disableKeypress);
        document.getElementById('canvas').addEventListener('keydown', disableKeypress);

        // Handler for OK button
        function onOk() {
            const userInput = promptInput.value;
            cleanup();
            resolve(userInput);
        }

        // Handler for Cancel button
        function onCancel() {
            cleanup();
            reject(console.log('User cancelled the prompt'));
        }

        // Handler for Enter key
        function onEnterKey(e) {
            if (e.key === 'Enter') {
                onOk();
            }
        }

        // Cleanup function to remove event listeners and hide the prompt
        function cleanup() {
            promptOk.removeEventListener('click', onOk);
            promptCancel.removeEventListener('click', onCancel);
            window.removeEventListener('keydown', onEnterKey);
            promptContainer.classList.add('hidden');
            promptInput.value = ''; // Clear the input field
        }

        // Add event listeners
        promptOk.addEventListener('click', onOk);
        promptCancel.addEventListener('click', onCancel);
        window.addEventListener('keydown', onEnterKey);  // Listen for Enter key
    });
}
async function applyStringOnHTML(key, affected, type, additionalString) {
    const loc = new Localizator();
    if (type === 'html') {
        affected.innerHTML = await loc.getLocalizedString(key) + additionalString;
        console.log('HTML affected');
    } else if (type === 'title') {
        affected.title = await loc.getLocalizedString(key) + additionalString;
        console.log('Title affected');
    } else {
        throw new Error('Unknown type');
    }
}
function openSettings() {
    document.getElementById('set-modal').classList.remove('hidden')
}

function openBackupRecovery() {
    document.getElementById('backups-modal').classList.remove('hidden')
    getBackups()
}
function openMultiEditor() {
    document.getElementById('peer-connected').style.display = 'none'
    document.getElementById('p2p-initializer').classList.remove('hidden')
}

document.getElementById('prompt-close').onclick = () => {document.getElementById('set-modal').classList.add('hidden')}
document.getElementById('backups-close').onclick = () => {document.getElementById('backups-modal').classList.add('hidden')}
document.getElementById('p2p-close').onclick = () => {document.getElementById('p2p-initializer').classList.add('hidden')}
document.getElementById('p2p-connect').onclick = () => {
    const forbiddenRegEx = /^[A-Za-z0-9-]+$/

    const result = forbiddenRegEx.test(document.getElementById('p2p-code-input').value)
    if (result != false) {
        joinSession(document.getElementById('p2p-code-input').value)
        document.getElementById('peer-connected').style.display = 'block'
        setTimeout(() => {
            document.getElementById('peer-connected').style.display = 'none'
        }, 2000)
    } else {
        alert('Invalid code detected. Try again.')
    }
    
}
function parseBackupString(input) {
    const regex = /backup-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/;
    const match = input.match(regex);
  
    if (!match) {
      throw new Error("Input string format is incorrect");
    }
  
    const [_, year, month, day, hour, minute, second] = match;
  
    const result = {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:${second}`,
    };
  
    return result;
  }
  async function clearBackups() {
    try {
      // Read all files in the directory
      const files = await fs.promises.readdir(path.join(remApp.getPath('userData'), 'backups'));
  
      // Loop through each file and delete it
      for (const file of files) {
        const filePath = path.join(path.join(remApp.getPath('userData'), 'backups'), file);
        const stats = await fs.promises.lstat(filePath);
  
        // Ensure it is a file before deletion
        if (stats.isFile()) {
          await fs.promises.unlink(filePath);
          console.log(`Deleted: ${filePath}`);
        }
      }
  
      console.log('All files deleted successfully.');
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  }
const backupSelector = document.getElementById('backup-lister')
const getBackups = async () => {
    const loc = new Localizator()
    const backups = fs.readdirSync(path.join(remApp.getPath('userData'), 'backups')).reverse()
    let backupSizeInBytes = 0
    backupSelector.innerHTML = ''
    if (backups.length > 0) {
        backups.forEach(data => {
            backupSizeInBytes = backupSizeInBytes + fs.statSync(path.join(remApp.getPath('userData'), 'backups', data)).size
            const backupElement = document.createElement('div')
            const parsed = parseBackupString(data)
            backupElement.className = 'backup-list'
            backupElement.innerHTML = `
            <div class="lister-leftcomp">
                <img src="../../assets/icons/openbackup.svg" width="32">
            </div>
            <div class="lister-rightcomp">
                <h4>Backup at ${parsed.date}</h4>
                <span>${parsed.time}</span>
            </div>
            `
            backupElement.ondblclick = () => {
                fs.promises.readFile(path.join(remApp.getPath('userData'), 'backups', data), 'utf-8')
                .then(resp => JSON.parse(resp))
                .then(data => {
                    console.log(data)
                    renderer.logicDisplay.components = []
                    renderer.logicDisplay.importJSON(data, renderer.logicDisplay.components)
                    applyStringOnHTML('newDesign', document.getElementById('titlething'), 'html', ' (Backed Up) - CompassCAD');
                })
                document.getElementById('backups-close').click()
            }
            backupSelector.appendChild(backupElement)
        })
        document.getElementById('backup-size').innerText = `${await loc.getLocalizedString('totalBackupSize')} ${(backupSizeInBytes / 1024).toFixed(1)} KB`
    } else {
        backupSelector.innerHTML = 'No backups detected.'
        backupSizeInBytes = 0
    }
}
document.getElementById('backups-clear').onclick = async () => {
    const sureToErase = confirm('Are you sure you want to erase your backups?\nTHIS ACT IS IRREVERSIBLE! SAVE ANY BACKED UP WORK BEFORE DOING THIS')
    if (sureToErase == true) {
        clearBackups()
        backupSelector.innerHTML = 'No backups detected.'
    }
}
ipcRenderer.on('file-path', (event, filePath) => {
    if (isReady == true) {
        console.log(`Received file path in renderer: ${filePath}`);
        document.title = `${filePath.replace(/\\\\|\\|\/\//g, '/')} - CompassCAD`
        $('#titlething')[0].innerText = `${filePath.replace(/\\\\|\\|\/\//g, '/')} - CompassCAD`
        fs.promises.readFile(filePath, 'utf-8')
        .then(resp => JSON.parse(resp))
        .then(data => {
            console.log(data)
            renderer.logicDisplay.components = [];
            renderer.logicDisplay.importJSON(data, renderer.logicDisplay.components)
            renderer.filePath = filePath
            renderer.temporaryObjectArray = data
        })
        .catch(error => {
            console.error('Error reading or parsing the file:', error);
            diag.showErrorBox('Failed to open CompassCAD file. Please recheck!', 'Invalid CompassCAD design (possibly unnested arrays) \nTry adding [] onto the file and reopen.\nIf this is another issue, you might need to recheck the design data\nIf neither works out, this means your file is maybe corrupt or have some abnormal strings in it. Please recheck.')
            renderer.filePath = ''
            document.title = `New Design 1 - CompassCAD`
            $('#titlething')[0].innerText = `New Design 1 - CompassCAD`
        });
    } else {
        return;
    }
});