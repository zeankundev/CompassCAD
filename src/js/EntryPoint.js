let renderer;
let isReady = false
$(document).ready(async() => {
    const config = new ConfigHandler()
    renderer = new GraphicDisplay('canvas', 800,600)
    renderer.logicDisplay = renderer.logicDisplay || {};
    renderer.logicDisplay.components = renderer.logicDisplay.components || [];
    document.getElementById('undo-stack').value = await config.getValueKey('maximumStack')
    document.getElementById('font-size').value = await config.getValueKey('fontSize')
    document.getElementById('grid-spacing').value = await config.getValueKey('gridSpacing')
    document.getElementById('disable-lerp').checked = await config.getValueKey('disableLerp')
    document.getElementById('language').value = await config.getValueKey('lang')
    document.getElementById('undo-stack').onchange = () => {
        config.saveKey('maximumStack', document.getElementById('undo-stack').value);
    };

    document.getElementById('font-size').onchange = () => {
        config.saveKey('fontSize', document.getElementById('font-size').value);
    };

    document.getElementById('grid-spacing').onchange = () => {
        config.saveKey('gridSpacing', document.getElementById('grid-spacing').value);
    };
    document.getElementById('disable-lerp').onchange = () => {
        config.saveKey('disableLerp', document.getElementById('disable-lerp').checked);
    };

    document.getElementById('language').onchange = () => {
        config.saveKey('lang', document.getElementById('language').value);
    };

    const resizeWin = () => {
        // Calculate the height of menubar, toolbar, and status bar
        var resultedHeight = document.getElementById('menubar').offsetHeight + 
                             document.getElementById('toolbar').offsetHeight + 10;
        
        // Set the renderer's display dimensions
        renderer.displayHeight = window.innerHeight - resultedHeight;
        renderer.displayWidth = window.innerWidth - document.getElementById('quick-tool').offsetWidth;
        
        // Set the canvas dimensions
        document.getElementById('canvas').width = window.innerWidth - document.getElementById('quick-tool').offsetWidth;
        document.getElementById('canvas').height = window.innerHeight - resultedHeight;
    
        // Resize the bounding rectangle if needed
        const boundingRect = document.getElementById('bounding-rect');
        if (boundingRect) {
            boundingRect.style.width = `${document.getElementById('canvas').width}px`;
            boundingRect.style.height = `${document.getElementById('canvas').height}px`;
        }
    };
    const keyBindings = {
        'q': 'navigate',
        'Escape': 'navigate',
        'e': 'move-obj',
        't': 'del-obj',
        'a': 'add-point',
        's': 'add-line',
        'd': 'add-circle',
        'f': 'add-arc',
        'g': 'add-rect',
        'h': 'add-label',
        'j': 'add-barrel',
        'k': 'add-tree',
        'z': 'ruler'
    };
    resizeWin()
    window.onresize = resizeWin
    renderer.unitMeasure = 'm'
    renderer.unitConversionFactor = 1/100
    renderer.showOrigin = false
    document.getElementById('navigate').onclick = () => {
        console.log('Navigate button clicked');
        renderer.setMode(renderer.MODES.NAVIGATE)
    };

    document.getElementById('move-obj').onclick = () => {
        console.log('Move Object button clicked');
        renderer.setMode(renderer.MODES.MOVE)
    };

    document.getElementById('del-obj').onclick = () => {
        console.log('Delete Object button clicked');
        renderer.setMode(renderer.MODES.DELETE)
    };

    document.getElementById('add-point').onclick = () => {
        console.log('Add Point button clicked');
        renderer.setMode(renderer.MODES.ADDPOINT)
    };

    document.getElementById('add-line').onclick = () => {
        console.log('Add Line button clicked');
        renderer.setMode(renderer.MODES.ADDLINE)
    };

    document.getElementById('add-circle').onclick = () => {
        console.log('Add Circle button clicked');
        renderer.setMode(renderer.MODES.ADDCIRCLE)
    };

    document.getElementById('add-arc').onclick = () => {
        console.log('Add Arc button clicked');
        renderer.setMode(renderer.MODES.ADDARC)
    };

    document.getElementById('add-rect').onclick = () => {
        console.log('Add Rectangle button clicked');
        renderer.setMode(renderer.MODES.ADDRECTANGLE)
    };

    document.getElementById('add-label').onclick = () => {
        console.log('Add Text button clicked');
        renderer.setMode(renderer.MODES.ADDLABEL)
    };

    document.getElementById('add-barrel').onclick = () => {
        console.log('Add Vertical Barrel button clicked');
        renderer.setModeShape(CreateVerticalBarrel)
    };

    document.getElementById('add-tree').onclick = () => {
        console.log('Add Tree button clicked');
        renderer.setModeShape(PlantATree)
    };

    document.getElementById('ruler').onclick = () => {
        console.log('Measure button clicked');
        renderer.setMode(renderer.MODES.ADDMEASURE)
    };
    document.getElementById('new-design').onclick = () => {
        if (confirm('Are you sure? You are going to lose your design!') == true)
            renderer.createNew()
        else
            return
    }
    document.getElementById('undo').onclick = () => {
        renderer.undo()
    }
    document.getElementById('redo').onclick = () => {
        renderer.redo()
    }
    document.getElementById('open-design').onclick = () => {
        renderer.openDesign()
    }
    document.getElementById('save-design').onclick = () => {
        renderer.saveDesign()
    }
    document.getElementById('save-design-as').onclick = () => {
        renderer.saveDesignAs()
    }
    document.getElementById('export-design').onclick = () => {
        renderer.exportDesign()
    }

    document.addEventListener('keydown', (event) => {
        console.log('Key down')
        const elementId = keyBindings[event.key];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`Key "${event.key}" pressed, emulating click on ${elementId}`);
                element.click();
            }
        }
    });

    initCAD(renderer)
    isReady = true
    // Apply translations to header elements
    applyStringOnHTML('newDesign', document.getElementById('titlething'), 'html', ' - CompassCAD');
    // Apply translations to window action buttons
    applyStringOnHTML('fpsWarning', document.getElementById('fps-warner'), 'title', '');
    applyStringOnHTML('fpsWarning', document.getElementById('fps-warner-inner'), 'html', '');
    applyStringOnHTML('considerSupporting', document.querySelector('.window-actions button[onclick^="redirectToSomewhere"]'), 'title', '');
    applyStringOnHTML('minimize', document.getElementById('minimize'), 'title', '');
    applyStringOnHTML('maximize', document.getElementById('maximize'), 'title', '');
    applyStringOnHTML('close', document.getElementById('close'), 'title', '');
    // Apply translations to toolbar buttons
    applyStringOnHTML('createNew', document.getElementById('new-design'), 'title', '');
    applyStringOnHTML('openDesign', document.getElementById('open-design'), 'title', '');
    applyStringOnHTML('openBackups', document.getElementById('open-backups'), 'title', '');
    applyStringOnHTML('saveDesign', document.getElementById('save-design'), 'title', '');
    applyStringOnHTML('saveDesignAs', document.getElementById('save-design-as'), 'title', '');
    applyStringOnHTML('exportDesign', document.getElementById('export-design'), 'title', '');
    applyStringOnHTML('undo', document.getElementById('undo'), 'title', '');
    applyStringOnHTML('redo', document.getElementById('redo'), 'title', '');
    applyStringOnHTML('navigateToolbar', document.getElementById('navigate'), 'title', '');
    applyStringOnHTML('moveToolbar', document.getElementById('move-obj'), 'title', '');
    applyStringOnHTML('deleteToolbar', document.getElementById('del-obj'), 'title', '');
    applyStringOnHTML('addPointToolbar', document.getElementById('add-point'), 'title', '');
    applyStringOnHTML('addLineToolbar', document.getElementById('add-line'), 'title', '');
    applyStringOnHTML('addCircleToolbar', document.getElementById('add-circle'), 'title', '');
    applyStringOnHTML('addArcToolbar', document.getElementById('add-arc'), 'title', '');
    applyStringOnHTML('addRectangleToolbar', document.getElementById('add-rect'), 'title', '');
    applyStringOnHTML('addLabelToolbar', document.getElementById('add-label'), 'title', '');
    applyStringOnHTML('addBarrelToolbar', document.getElementById('add-barrel'), 'title', '');
    applyStringOnHTML('addTreeToolbar', document.getElementById('add-tree'), 'title', '');
    applyStringOnHTML('addMeasureToolbar', document.getElementById('ruler'), 'title', '');
    applyStringOnHTML('undoStackText', document.getElementById('undo-stack-text'), 'html', '');
    applyStringOnHTML('fontSizeText', document.getElementById('font-size-text'), 'html', '');
    applyStringOnHTML('gridSpacingText', document.getElementById('grid-spacing-text'), 'html', '');
    applyStringOnHTML('languageText', document.getElementById('language-text'), 'html', '');
    applyStringOnHTML('settings', document.getElementById('settings-text'), 'html', '');
    applyStringOnHTML('settings', document.getElementById('open-settings'), 'title', '');
    applyStringOnHTML('hostOrJoinP2P', document.getElementById('join-remote'), 'title', '');
    applyStringOnHTML('hostOrJoinP2P', document.getElementById('p2p-head'), 'html', '');
    applyStringOnHTML('yourSessionId', document.getElementById('your-id'), 'html', '');
    applyStringOnHTML('connectToAnotherP2P', document.getElementById('connect-another-client-head'), 'html', '');
    applyStringOnHTML('connectedToP2P', document.getElementById('peer-success-text'), 'html', '');
    applyStringOnHTML('backupsTitle', document.getElementById('backups-headtext'), 'html', '')
    applyStringOnHTML('help', document.getElementById('help'), 'title', '');
    applyStringOnHTML('configSaved', document.getElementById('config-text'), 'html', '');
    window.onbeforeunload = (e) => {
        // Check if components is not null and is not empty
        if (renderer.logicDisplay.components && renderer.logicDisplay.components.length > 0) {
            console.log('Not null nor empty');
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
    
            const backupPath = path.join(remApp.getPath('userData'), `/backups/backup-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.bkp`);
    
            try {
                fs.writeFileSync(backupPath, JSON.stringify(renderer.logicDisplay.components));
                console.log('Backup saved successfully.');
            } catch (err) {
                console.error('Error saving backup:', err);
            }
    
            // After saving, allow the app to quit
            if (process.env.NODE_ENV == 'development') {
                console.log('Devmode')
                window.location.reload()
            } else {
                //remApp.quit()
            }
        } else {
            console.log('No components to save, quitting.');
            if (process.env.NODE_ENV == 'development') {
                console.log('Devmode')
                window.location.reload()
            } else {
                //remApp.quit()
            }
        }
    };
    
})