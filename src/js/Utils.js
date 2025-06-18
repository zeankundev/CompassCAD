const { ipcRenderer } = require('electron');
let storedIndex = -1;
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
    } else if (type === 'placeholder') {
        affected.placeholder = await loc.getLocalizedString(key) + additionalString;
        console.log('Placeholder affected');
    } else {
        throw new Error('Unknown type');
    }
}
const checkForWebGL = () => {
    try {
        var canvas = document.createElement('canvas'); 
        return !!window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch(e) {
        return false;
    }
}
const updateStyles = () => {
    const cssDir = fs.readdirSync(path.join(remApp.getPath('userData'), 'styles'));
    cssDir.forEach(style => {
        console.warn('the folder contains: ' + style);
        let cssOption = document.createElement('option');
        cssOption.value = path.join(remApp.getPath('userData'), 'styles', style);
        console.log(cssOption.value);
        cssOption.innerText = style.slice(0, 15) + (style.length > 15 ? '...' : '');
        document.getElementById('theme-selector').appendChild(cssOption);
    });
}
const changeStyleInto = async () => {
    const config = new ConfigHandler();
    await config.loadConfig();
    const selectedStyle = document.getElementById('theme-selector').value;
    await config.saveKey('styleUri', selectedStyle);
}
const openInspectorTab = (tabName) => {
    // Hide all tab contents
    const tabContents = document.querySelectorAll(".inspector-tabcontent");
    tabContents.forEach((content) => {
        content.style.display = "none";
    });

    // Show the selected tab content
    const selectedTabContent = document.getElementById(tabName);
    if (selectedTabContent) {
        selectedTabContent.style.display = "block";
    }

    // Add disabled class to all buttons and tab contents
    const buttons = document.querySelectorAll(".inspector-tab");
    const tabs = document.querySelectorAll(".inspector-tabcontent");
    buttons.forEach((button) => {
        button.classList.add('disabled');
    });
    tabs.forEach((tab) => {
        tab.classList.add('disabled');
    });

    // Enable the clicked button and tab content - handle both static and dynamic buttons
    const selectedButton = document.querySelector(`.inspector-tab[onclick*="${tabName}"]`) || 
                         document.getElementById(`${tabName.replace('-tabcontent', '')}-tab`);
    if (selectedButton) {
        selectedButton.classList.remove('disabled');
    }
    if (selectedTabContent) {
        selectedTabContent.classList.remove('disabled');
    }
}
openInspectorTab('properties');
const refreshHierarchy = () => {
    const search = document.getElementById('hierarchy-search').value;
    const hierarchy = document.getElementById('hierarchy-list');
    hierarchy.innerHTML = '';
    let found = false;
    renderer.logicDisplay.components.forEach((component, index) => {
        if (component.name.toLowerCase().includes(search.toLowerCase())) {
            found = true;
            const element = document.createElement('div');
            element.className = `hierarchy-element ${renderer.selectedComponent == index ? 'selected' : ''}`;
            element.innerHTML = `<img src="../../assets/icons/components/${component.type}.svg">&nbsp;${component.name}`;
            element.onclick = () => {
                renderer.mode = renderer.MODES.SELECT;
                refreshToolSelection(renderer.MODES.SELECT);
                renderer.temporarySelectedComponent = index;
                renderer.selectComponent(index)
                createFormForSelection();
                refreshHierarchy();
            }
            element.ondblclick = () => {
                openInspectorTab('properties');
                createFormForSelection();
                if (renderer.selectedComponent == index) {
                    const component = renderer.logicDisplay.components[index];
                    let targetX;
                    let targetY;
                    switch (component.type) {
                        case COMPONENT_TYPES.POINT:
                        case COMPONENT_TYPES.PICTURE:
                        case COMPONENT_TYPES.SHAPE:
                        case COMPONENT_TYPES.LABEL:
                            const centerX = component.x;
                            const centerY = component.y; 
                            targetX = -centerX;
                            targetY = -centerY;
                            break;
                        case COMPONENT_TYPES.RECTANGLE:
                        case COMPONENT_TYPES.MEASURE:
                        case COMPONENT_TYPES.LINE:
                            const centerX2Pair = (component.x1 + component.x2) / 2; 
                            const centerY2Pair = (component.y1 + component.y2) / 2;
                            targetX = -centerX2Pair;
                            targetY = -centerY2Pair;
                            break;
                        case COMPONENT_TYPES.CIRCLE:
                        case COMPONENT_TYPES.ARC:
                            targetX = -component.x1;
                            targetY = -component.y1;
                            break;
                        case COMPONENT_TYPES.POLYGON:
                            targetX = -component.vectors[0].x;
                            targetY = -component.vectors[0].y;
                            break;
                        default:
                            break;
                    }
                    const startX = renderer.camX;
                    const startY = renderer.camY;
                    let startTime = null;
                    const duration = 500;

                    function animate(currentTime) {
                        if (!startTime) startTime = currentTime;
                        const elapsed = currentTime - startTime;
                        const progress = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 2);
                        const initialZoom = renderer.targetZoom;

                        renderer.camX = startX + (targetX - startX) * progress;
                        renderer.camY = startY + (targetY - startY) * progress;
                        renderer.targetZoom = initialZoom + (1 - initialZoom) * progress;

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    }

                    requestAnimationFrame(animate);
                }
            }
            hierarchy.appendChild(element);
        }
    });
}
document.getElementById('hierarchy-search').oninput = () => {refreshHierarchy()}
document.onerror = function (msg, url, lineNo, columnNo, error) {
    if (!msg.includes("Could not connect")) {
        console.error(`Error: ${msg}\nURL: ${url}\nLine: ${lineNo}\nColumn: ${columnNo}\nStack: ${error}`);
        alert(`Error: ${msg}\nURL: ${url}\nLine: ${lineNo}\nColumn: ${columnNo}\nStack: ${error}`);
    }
}
async function openSettings() {
    const config = new ConfigHandler();
    await config.loadConfig();
    openSettingsTab('workspace');
    await updateFlagList();
    const setModal = document.getElementById('set-modal');
    const peerConnected = document.getElementById('peer-connected');

    if (setModal.classList.contains('hidden')) {
        peerConnected.style.display = 'none';
        setModal.classList.remove('hidden');
        const gridSettings = document.getElementById('grid-settings')
        gridSettings.innerHTML = ''
        await config.getGridSettings().then(res => {
            console.log('[settings] got grid settings')
            console.log(res)
            res.map((data, index) => {
                console.log(`[settings] grid setting ${index}: ${data}`)
                const gridConfiguration = document.createElement('div');
                gridConfiguration.className = 'grid-settings-display';
                gridConfiguration.innerHTML = `${data}cm (${data / 100}m)`;
                gridConfiguration.onclick = () => {
                    console.log(storedIndex)
                    // if stored index is -1, set the index to that, and make it to selected
                    // if the stored index is not -1, set the index to that, and make the others unselected, while the selected index is selected
                    const previousGrid = document.getElementsByClassName('selected')[0];
                    if (previousGrid) {
                        previousGrid.classList.remove('selected');
                    }
                    storedIndex = index;
                    console.log(storedIndex)
                    gridConfiguration.classList.add('selected');
                }
                gridSettings.appendChild(gridConfiguration);
            })
        }).catch(err => console.error('[settings] error getting grid settings:', err));
        
    } else {
        peerConnected.style.display = 'block';
        setModal.classList.add('hidden');
    }
}

document.getElementById('remove-grid').onclick = async () => {
    const config = new ConfigHandler();
    await config.loadConfig();
    const grids = await config.getGridSettings()
    if (grids.length > 0 && storedIndex != -1) {
        console.log(storedIndex)
        if (confirm(`Delete grid ${grids[storedIndex]}cm? (${grids[storedIndex] / 100}m)`)) {
            config.purgeGridSetting(grids[storedIndex])
            storedIndex = -1;
        }
    }
}

document.getElementById('add-grid').onclick = async () => {
    const config = new ConfigHandler();
    await config.loadConfig();
    const whatGridToAdd = await callPrompt('Enter the grid size (in cm)')
    if (whatGridToAdd != null) {
        console.log(whatGridToAdd)
        config.appendGridSetting(parseFloat(whatGridToAdd))
        storedIndex = -1;
    }
}

document.getElementById('inspector-collapse').onclick = () => {
    const inspector = document.getElementById('inspector');
    if (inspector) {
        inspector.classList.add('collapsed');
        document.getElementById('inspector-expand').style.display = 'block';
    }
}

document.getElementById('inspector-expand').onclick = () => {
    const inspector = document.getElementById('inspector');
    if (inspector) {
        inspector.classList.remove('collapsed');
        document.getElementById('inspector-expand').style.display = 'none';
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
    // Create a new toast element
    const toast = document.createElement('div');
    toast.className = 'toast hide';
    
    // Create the text span
    const toastText = document.createElement('span');
    toastText.textContent = text;
    
    // Add text to toast
    toast.appendChild(toastText);
    
    // Add toast to document body
    document.getElementById('toast-container').appendChild(toast);

    // Show and animate the toast
    setTimeout(() => {
        toast.classList.remove('hide');
        toast.style.animation = 'toast 0.3s ease';
    }, 100);

    // Remove the toast after delay
    setTimeout(() => {
        toast.style.animation = 'toast-cancel 0.3s ease';
        setTimeout(() => {
            document.getElementById('toast-container').removeChild(toast);
        }, 250);
    }, 3000);
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
    dynamicForm.innerHTML = `
    <div class="inspector-nothingtoinspect">
        <img src="../../assets/icons/unselected-state.svg" width="64">
        <p>${await loc.getLocalizedString('nothingToInspect')}</p>
    </div>
    `;
    dynamicForm.style.overflowY = 'hidden'
}
const openSettingsTab = (tabName) => {
    // Hide all tab contents
    const tabContents = document.querySelectorAll(".tabcontent");
    tabContents.forEach((content) => {
        content.style.display = "none";
    });

    // Show the selected tab content
    const selectedTabContent = document.getElementById(tabName);
    if (selectedTabContent) {
        selectedTabContent.style.display = "block";
    }

    // Remove the disabled class of that button
    const buttons = document.querySelectorAll(".settings-button");
    buttons.forEach((button) => {
        button.classList.add('disabled');
    });
    const selectedButton = document.getElementById(tabName + '-settings');
    if (selectedButton) {
        selectedButton.classList.remove('disabled')
    }
}
const createFormForSelection = () => {
    const dynamicForm = document.getElementById("form");
    dynamicForm.innerHTML = '';

    // Get the selected component
    const selectedIndex = renderer.selectedComponent;
    if (selectedIndex === null) return;

    const component = renderer.logicDisplay.components[selectedIndex];

    // Iterate through each property of the selected component
    Object.keys(component).forEach((key) => {
        // Skip 'type' field
        if (key === 'type' || key === 'y1' || key === 'y2' || key === 'x2' || key === 'y3') return;

        let label, input;

        // Handle Position, Size, and Arc Coverage specifically
        if (key === 'x' && 'y' in component) {
            // Position (for single x and y)
            const positionDiv = document.createElement("div");
            positionDiv.className = "input-container";
            
            const positionLabel = document.createElement("label");
            positionLabel.textContent = "Position";
            positionDiv.appendChild(positionLabel);

            // Position inputs
            ['x', 'y'].forEach((posKey) => {
            const posInput = document.createElement("input");
            posInput.type = "number";
            posInput.value = component[posKey];
            posInput.addEventListener("input", (e) => {
                component[posKey] = parseFloat(e.target.value);
                updateSizeIfNeeded(component);
                renderer.saveState()
            });
            positionDiv.appendChild(posInput);
            });
            dynamicForm.appendChild(positionDiv);
        } else if (key === 'x1' && 'x2' in component && 'y1' in component && 'y2' in component) {
            // Position div
            const positionDiv = document.createElement("div");
            positionDiv.className = "input-container";
            
            const positionLabel = document.createElement("label");
            positionLabel.textContent = "Position";
            positionDiv.appendChild(positionLabel);

            // Position inputs for x1, y1
            ['x1', 'y1'].forEach((posKey) => {
            const posInput = document.createElement("input");
            posInput.type = "number";
            posInput.value = component[posKey];
            posInput.addEventListener("input", (e) => {
                component[posKey] = parseFloat(e.target.value);
                updateSizeIfNeeded(component);
                renderer.saveState()
            });
            positionDiv.appendChild(posInput);
            });
            dynamicForm.appendChild(positionDiv);

            // Size div
            const sizeDiv = document.createElement("div");
            sizeDiv.className = "input-container";
            
            const sizeLabel = document.createElement("label");
            sizeLabel.textContent = "Size";
            sizeDiv.appendChild(sizeLabel);

            // Width and height inputs
            const widthInput = document.createElement("input");
            widthInput.type = "number";
            widthInput.value = component.x2 - component.x1;
            widthInput.addEventListener("input", (e) => {
            const value = parseFloat(e.target.value);
            component.x2 = component.x1 + value;
            });
            sizeDiv.appendChild(widthInput);

            const heightInput = document.createElement("input");
            heightInput.type = "number";
            heightInput.value = component.y2 - component.y1;
            heightInput.addEventListener("input", (e) => {
            const value = parseFloat(e.target.value);
            component.y2 = component.y1 + value;
            });
            sizeDiv.appendChild(heightInput);
            dynamicForm.appendChild(sizeDiv);

        } else if (key === 'x3' && 'y3' in component) {
            // Arc Coverage div
            const arcDiv = document.createElement("div");
            arcDiv.className = "input-container";
            
            const arcLabel = document.createElement("label");
            arcLabel.textContent = "Coverage";
            arcDiv.appendChild(arcLabel);

            ['x3', 'y3'].forEach((arcKey) => {
            const arcInput = document.createElement("input");
            arcInput.type = "number";
            arcInput.value = component[arcKey];
            arcInput.addEventListener("input", (e) => {
                component[arcKey] = parseFloat(e.target.value);
                renderer.saveState()
            });
            arcDiv.appendChild(arcInput);
            });
            dynamicForm.appendChild(arcDiv);
        } else {
            // Default input for other fields
            label = document.createElement("label");
            label.textContent = key.charAt(0).toUpperCase() + key.slice(1);
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
                if (key === 'color' || key === 'strokeColor') {
                    input.type = "color";
                    console.log(`[form] ${key}: ${component[key]}`)
                    input.value = component[key] || '#ffffff';
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
                const containerDiv = document.createElement("div");
                containerDiv.className = "input-container";
                containerDiv.appendChild(label);
                containerDiv.appendChild(input);
                dynamicForm.appendChild(containerDiv);
                // dynamicForm.appendChild(document.createElement("br")); // Line break after each input
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

function num2hex(num) {
    const clampedNum = Math.max(0, Math.min(100, num));
    const scaledValue = Math.round(clampedNum * 2.55);
    let hexString = scaledValue.toString(16);
    hexString = hexString.padStart(2, '0');
    return hexString.toUpperCase();
}

// Define tools mapping with their properties
const tools = {
    'select': { mode: 25, key: 'q' },
    'navigate': { mode: 22, key: 'w' },
    'move-obj': { mode: 23, key: 'e' },
    'del-obj': { mode: 20, key: 't' },
    'add-point': { mode: 1, key: 'a' },
    'add-line': { mode: 2, key: 's' },
    'add-circle': { mode: 3, key: 'd' },
    'add-arc': { mode: 5, key: 'f' },
    'add-rect': { mode: 4, key: 'g' },
    'add-label': { mode: 7, key: 'h' },
    'add-picture': { mode: 9, key: 'l' },
    'add-polygon': {mode: 10, key: 'j'},
    'ruler': { mode: 6, key: 'z' }
};

// Create a function to refresh tool selection
const refreshToolSelection = (mode) => {
    Object.entries(tools).forEach(([id, tool]) => {
        const element = document.getElementById(id);
        if (element) {
            console.log(tool.mode)
            if (tool.mode === mode) {
                element.classList.add('active-tool');
            } else {
                element.classList.remove('active-tool');
            }
        }
    });
};

const updateBattery = () => {
    navigator.getBattery().then((battery) => {
        // ../../assets/icons/battery/100-charging.svg
        /** @type {BatteryManager} **/const isCharging = battery.charging;
        const iconState = battery.charging ? 'charging': 'default';
        const batteryPercentage = Math.floor(battery.level * 100);
        const batteryDisplay = document.getElementById('battery-display');
        const batteryLevel = document.getElementById('battery-level');
        if (batteryPercentage > 90) {
            batteryDisplay.src = `../../assets/icons/battery/100-${iconState}.svg`;
        } else if (batteryPercentage > 75) {
            batteryDisplay.src = `../../assets/icons/battery/100-${iconState}.svg`;
        } else if (batteryPercentage > 60) {
            batteryDisplay.src = `../../assets/icons/battery/75-${iconState}.svg`;
        } else if (batteryPercentage > 25) {
            batteryDisplay.src = `../../assets/icons/battery/50-${iconState}.svg`;
        } else if (batteryPercentage > 15) {
            batteryDisplay.src = `../../assets/icons/battery/25-${iconState}.svg`;
        } else if (batteryPercentage <= 15) {
            batteryDisplay.src = `../../assets/icons/battery/10-${iconState}.svg`;
        }
        batteryLevel.innerText = `${batteryPercentage}%`;
        document.getElementById('battery-status').title = `${batteryPercentage}%, ${battery.charging ? 'Charging' : 'Discharging'}`;
    })
}
