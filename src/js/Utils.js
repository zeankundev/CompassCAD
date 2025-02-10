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
    const setModal = document.getElementById('set-modal');
    const peerConnected = document.getElementById('peer-connected');

    if (setModal.classList.contains('hidden')) {
        peerConnected.style.display = 'none';
        setModal.classList.remove('hidden');
    } else {
        peerConnected.style.display = 'block';
        setModal.classList.add('hidden');
    }
}

function toggleInspector() {
    const inspector = document.getElementById('inspector');

    if (inspector.style.display == 'block') {
        inspector.style.display = 'none';
        resizeWin()
    } else {
        inspector.style.display = 'block';
        resizeWin()
    }
}

function openEvalConsole() {
    const evalModal = document.getElementById('eval-modal');
    const error = document.getElementById('eval-error');

    if (evalModal.classList.contains('hidden')) {
        error.style.display = 'none';
        evalModal.classList.remove('hidden');
    } else {
        error.style.display = 'block';
        evalModal.classList.add('hidden');
    }
}

function openBackupRecovery() {
    const backupsModal = document.getElementById('backups-modal');
    backupsModal.classList.toggle('hidden');

    if (!backupsModal.classList.contains('hidden')) {
        getBackups();
    }
}

function openMultiEditor() {
    const peerConnecting = document.getElementById('peer-connecting');
    const peerConnected = document.getElementById('peer-connected');
    const p2pInitializer = document.getElementById('p2p-initializer');

    if (p2pInitializer.classList.contains('hidden')) {
        peerConnecting.style.display = 'none';
        peerConnected.style.display = 'none';
        p2pInitializer.classList.remove('hidden');
    } else {
        peerConnecting.style.display = 'block';
        peerConnected.style.display = 'block';
        p2pInitializer.classList.add('hidden');
    }
}


function callToast(text) {
    document.getElementById('toast').style.animation = 'toast 1s ease'
    document.getElementById('toast-text').innerHTML = text
    document.getElementById('toast').style.display = 'block'
    setTimeout(() => {
        document.getElementById('toast').style.animation = 'toast-cancel 1s ease'
        setTimeout(() => {
            document.getElementById('toast').style.display = 'none'
            document.getElementById('toast-text').innerHTML = ''
        }, 1000)
    }, 3000)
}

document.getElementById('prompt-close').onclick = () => {document.getElementById('set-modal').classList.add('hidden')}
document.getElementById('backups-close').onclick = () => {document.getElementById('backups-modal').classList.add('hidden')}
document.getElementById('p2p-close').onclick = () => {document.getElementById('p2p-initializer').classList.add('hidden')}
document.getElementById('eval-exit').onclick = () => {document.getElementById('eval-modal').classList.add('hidden')}
document.getElementById('eval-run').onclick = () => {
    const evalEditor = document.getElementById('eval-editor');
    if (evalEditor.value.length > 0) {
        try {
            const res = eval(evalEditor.value)
            document.getElementById('eval-error').style.display = 'block'
            document.getElementById('eval-error').innerText = res
        } catch  (e) {
            document.getElementById('eval-error').innerText = e
            document.getElementById('eval-error').style.display = 'block'
        }
    }
}
document.getElementById('p2p-connect').onclick = () => {
    const forbiddenRegEx = /^[A-Za-z0-9-]+$/

    const result = forbiddenRegEx.test(document.getElementById('p2p-code-input').value)
    if (result != false || result != '') {
        joinSession(document.getElementById('p2p-code-input').value)
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
                    client.setActivity({
                        details: 'Working on a backed up design',
                        state: 'On New Design 1 (Backed Up)',
                        largeImageKey: 'logo_round',
                        smallImageKey: 'work_backup',
                        startTimestamp: new Date().now
                    })
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
function objparse(obj) {
    renderer.logicDisplay.components = []
    renderer.logicDisplay.importJSON(JSON.parse(obj),renderer.logicDisplay.components)
}
const clearForm = async () => {
    const loc = new Localizator()
    const dynamicForm = document.getElementById("form");
    dynamicForm.innerHTML = await loc.getLocalizedString('nothingToInspect');
    dynamicForm.style.overflowY = 'hidden'
}
const createFormForSelection = () => {
    const dynamicForm = document.getElementById("form");
    dynamicForm.innerHTML = '';
    dynamicForm.style.overflowY = 'scroll'

    // Get the selected component
    const selectedIndex = renderer.selectedComponent;
    if (selectedIndex === null) return;

    const component = renderer.logicDisplay.components[selectedIndex];

    // Iterate through each property of the selected component
    Object.keys(component).forEach((key) => {
        // Skip 'type' field
        if (key === 'type') return;

        let label, input;

        // Handle Position, Size, and Arc Coverage specifically
        if (key === 'x' && 'y' in component) {
            // Position (for single x and y)
            const positionLabel = document.createElement("label");
            positionLabel.textContent = "Position";
            dynamicForm.appendChild(positionLabel);

            // Position inputs
            ['x', 'y'].forEach((posKey) => {
                const posInput = document.createElement("input");
                posInput.type = "number";
                posInput.value = component[posKey];
                posInput.addEventListener("input", (e) => {
                    component[posKey] = parseFloat(e.target.value);
                    updateSizeIfNeeded(component); // Update size when position changes
                    renderer.saveState()
                });
                dynamicForm.appendChild(posInput);
            });
            // Add line break after Position set
            dynamicForm.appendChild(document.createElement("br")); // Line break after the whole Position set
        } else if (key === 'x1' && 'x2' in component && 'y1' in component && 'y2' in component) {
            // Multiple coordinate sets: Position and Size
            const positionLabel = document.createElement("label");
            positionLabel.textContent = "Position";
            dynamicForm.appendChild(positionLabel);

            // Position inputs for x1, y1 only (hide x2, y2)
            ['x1', 'y1'].forEach((posKey) => {
                const posInput = document.createElement("input");
                posInput.type = "number";
                posInput.value = component[posKey];
                posInput.addEventListener("input", (e) => {
                    component[posKey] = parseFloat(e.target.value);
                    updateSizeIfNeeded(component); // Update size when position changes
                    renderer.saveState()
                });
                dynamicForm.appendChild(posInput);
            });

            // Size (width and height based on x1, x2, y1, y2)
            const sizeLabel = document.createElement("label");
            sizeLabel.textContent = "Size";
            dynamicForm.appendChild(sizeLabel);

            // Width (x2 - x1)
            const widthInput = document.createElement("input");
            widthInput.type = "number";
            widthInput.value = component.x2 - component.x1; // Initial width calculation
            widthInput.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                component.x2 = component.x1 + value; // Update x2 based on width
            });
            dynamicForm.appendChild(widthInput);

            // Height (y2 - y1)
            const heightInput = document.createElement("input");
            heightInput.type = "number";
            heightInput.value = component.y2 - component.y1; // Initial height calculation
            heightInput.addEventListener("input", (e) => {
                const value = parseFloat(e.target.value);
                component.y2 = component.y1 + value; // Update y2 based on height
            });
            dynamicForm.appendChild(heightInput);

            // Hide x2 and y2 from the form (as we are using Size now)
            dynamicForm.querySelectorAll("input[type='number']").forEach((inputElement) => {
                if (inputElement.value === component.x2 || inputElement.value === component.y2) {
                    inputElement.style.display = 'none'; // Hide x2 and y2 inputs
                }
            });

            // Add line break after Position and Size set
            dynamicForm.appendChild(document.createElement("br")); // Line break after the whole Position and Size set
        } else if (key === 'x3' && 'y3' in component) {
            // Arc Coverage (with x3 and y3)
            const arcLabel = document.createElement("label");
            arcLabel.textContent = "Arc Coverage";
            dynamicForm.appendChild(arcLabel);

            // Arc inputs for x3 and y3
            ['x3', 'y3'].forEach((arcKey) => {
                const arcInput = document.createElement("input");
                arcInput.type = "number";
                arcInput.value = component[arcKey];
                arcInput.addEventListener("input", (e) => {
                    component[arcKey] = parseFloat(e.target.value);
                    renderer.saveState()
                });
                dynamicForm.appendChild(arcInput);
            });

            // Add line break after Arc Coverage set
            dynamicForm.appendChild(document.createElement("br")); // Line break after the whole Arc Coverage set
        } else {
            // Default input for other fields
            label = document.createElement("label");
            label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            dynamicForm.appendChild(label);

            dynamicForm.appendChild(document.createElement("br")); // Line break after label

            if (typeof component[key] === 'boolean') {
                input = document.createElement("input");
                input.type = "checkbox";
                input.checked = component[key];
                input.addEventListener("change", (e) => {
                    component[key] = e.target.checked;
                    renderer.saveState()
                });
            } else if (typeof component[key] === 'string') {
                input = document.createElement("input");
                if (key === 'color') {
                    input.type = "color";
                    input.value = component[key].color || '#ffffff';
                } else {
                    input.type = "text";
                    input.value = component[key];
                }
                input.addEventListener("input", (e) => {
                    component[key] = e.target.value;
                    if (key === 'color') {
                        renderer.previousColor = e.target.value
                    } else if (key === 'radius') {
                        renderer.previousRadius = e.target.value
                    }
                    renderer.saveState()
                });
            } else if (typeof component[key] === 'number') {
                input = document.createElement("input");
                input.type = "number";
                input.value = component[key];
                input.addEventListener("input", (e) => {
                    component[key] = parseFloat(e.target.value);
                    renderer.saveState()
                });
            }

            if (input) {
                dynamicForm.appendChild(input);
                dynamicForm.appendChild(document.createElement("br")); // Line break after each input
            }
        }
    });
};
const toggleSnap = () => {
    renderer.enableSnap = !renderer.enableSnap;
    document.getElementById('snap-toggle').src = (renderer.enableSnap ? '../../assets/icons/snapped.svg' : '../../assets/icons/snap.svg');
}
// Helper function to update Size dynamically
const updateSizeIfNeeded = (component) => {
    if ('x1' in component && 'x2' in component && 'y1' in component && 'y2' in component) {
        // Dynamically update the size inputs if needed (calculate width and height)
        const sizeX = component.x2 - component.x1;
        const sizeY = component.y2 - component.y1;

        // Update the width and height inputs
        const widthInputs = document.querySelectorAll('input[type="number"]');
        if (widthInputs.length > 0) {
            widthInputs[0].value = sizeX; // Set width input
        }
        if (widthInputs.length > 1) {
            widthInputs[1].value = sizeY; // Set height input
        }
    }
};
let clickCount = 0;
let clickTimeout;

const targetElement = document.getElementById('ccadlogo'); // Replace with your element's ID

// Function to execute after 7 fast clicks
function enableDevMode() {
  callToast('Developer mode enabled. Refresh (Ctrl+R) to disable.')
  document.getElementById('open-eval').style.display = 'block'
  renderer.drawDebugPoint = true
}

// Handle click event
targetElement.addEventListener('click', () => {
  clickCount++;

  if (clickCount === 1) {
    // Start a timeout to reset the count after 1 second of inactivity
    clickTimeout = setTimeout(() => {
      clickCount = 0;
    }, 1000); // Reset after 1000ms (1 second) of inactivity
  }

  if (clickCount >= 7) {
    clearTimeout(clickTimeout); // Clear the timeout if 7 clicks are detected
    enableDevMode();
    clickCount = 0; // Reset click count after function is executed
  }
});
