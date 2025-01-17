let renderer;
const newDesign = () => {
    renderer.createNew()
    document.getElementById('filename').value = 'New Design 1'
}
const openDesign = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.click();
    fileInput.onchange = (e) => {
        let file = e.target.files[0];
        document.getElementById('filename').value = file.name.replace(/\.[^/.]+$/, "")
        console.log(file.name)
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                renderer.logicDisplay.importJSON(jsonData, renderer.logicDisplay.components)
            } catch (error) {
                console.error('Error parsing JSON:', error);
                document.getElementById('filename').value = 'New Design 1'
                callToast('Failed to load file. Double check your file and<br>make sure that it is not corrupted.', 'failure')
            }
        };
    };
};
const exportToSvg = () => {
    const exporter = new SVGExporter(renderer);
    try {
        let content = exporter.exportSVG();
        const blob = new Blob([content], {type: 'text/plain'})
        const downloader = document.createElement('a')
        downloader.download = `${document.getElementById('filename').value}.svg`
        downloader.href = window.URL.createObjectURL(blob);
        downloader.click();
        callToast('SVG successfully <br>exported. Please check and examine', 'success')
    } catch (e) {
        callToast('An error occured during exporting. <br>Please check the console for more details', 'failure')
        console.error(e)
    }
}
const saveLocally = () => {
    const blob = new Blob([JSON.stringify(renderer.logicDisplay.components)], {type: 'text/plain'})
    const downloader = document.createElement('a')
    downloader.download = `${document.getElementById('filename').value}.ccad`
    downloader.href = window.URL.createObjectURL(blob);
    downloader.click();
}

$(document).ready(async () => {
    renderer = new GraphicDisplay('working-canvas', 800, 600)
    const resizeWin = () => {
        const devicePixelRatio = window.devicePixelRatio || 1
        const displayHeight = window.innerHeight - document.getElementById('menubar').offsetHeight    
        const displayWidth = window.innerWidth - document.getElementById('toolbar').offsetWidth 
        // Set the renderer's display dimensions
        renderer.displayHeight = window.innerHeight;
        renderer.displayWidth = window.innerWidth;
        
        // Set the canvas dimensions
        document.getElementById('working-canvas').width = window.innerWidth * devicePixelRatio;
        document.getElementById('working-canvas').height = window.innerHeight * devicePixelRatio;
        document.getElementById('working-canvas').style.width = window.innerWidth + 'px'
        document.getElementById('working-canvas').style.height = window.innerHeight + 'px'
        const context = document.getElementById('working-canvas').getContext('2d')
        if (context) {
            context.scale(devicePixelRatio, devicePixelRatio)
        }
    };
    resizeWin()
    window.onresize = resizeWin
    document.getElementById('new').onclick = () => {
        newDesign()
    };
    document.getElementById('open').onclick = () => {
        openDesign()
    };
    document.getElementById('save').onclick = () => {
        saveLocally()
    };
    document.getElementById('export').onclick = () => {
        exportToSvg()
    };
    document.getElementById('undo').onclick = () => {
        renderer.undo()
    };
    document.getElementById('redo').onclick = () => {
        renderer.redo()
    };
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
    document.getElementById('add-picture').onclick = () => {
        console.log('Add Picture button clicked');
        renderer.setMode(renderer.MODES.ADDPICTURE)
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
        'l': 'add-picture',
        'z': 'ruler'
    };
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
    setInterval(() => {document.getElementById('tooltip').innerText = renderer.getToolTip()},1)
    const parser = new URLSearchParams(document.location.search)
    const basedDesign = parser.get('data')
    console.log(basedDesign)
    if (basedDesign != null && basedDesign != '' && basedDesign != ' ') {
        try {
            renderer.logicDisplay.importJSON(JSON.parse(LZString.decompressFromEncodedURIComponent(basedDesign)), renderer.logicDisplay.components)
            callToast('Your shared design has been successfully imported', 'success')
        } catch (e) {
            console.error(e)
            callToast('An error occured while loading your shared design.<br>Check your data to ensure the data integrity is correct<br>as it should be.', 'failure')
        }
    }
    // Adding keyboard events 
	
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.GREATERTHAN, function(e){
		renderer.zoomIn();
	});
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.LESSTHAN, function(e){
		renderer.zoomOut();
	});
    renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.EQUALS, function(e) {
        const requiredZoomFactor = 1 / renderer.zoom;
        console.log(requiredZoomFactor)
        renderer.setZoom(requiredZoomFactor);
    })
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.Z, function(e){
		renderer.undo()
	}, {ctrl: true});
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.Y, function(e){
		renderer.redo()
	}, {ctrl: true});
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.O, function(e){
		renderer.openDesign()
	}, {ctrl: true});
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.S, function(e){
		renderer.saveDesign()
	}, {ctrl: true});
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.E, function(e){
		renderer.exportDesign()
		renderer.setMode(renderer.MODES.NAVIGATE)
	}, {ctrl: true});
    document.getElementById('share').onclick = () => {
        document.getElementById('share-modal').style.display = 'block'
        document.getElementById('link-output').value = `${window.location.href}?data=${LZString.compressToEncodedURIComponent(JSON.stringify(renderer.logicDisplay.components))}`
        document.getElementById('link-output').title = document.getElementById('link-output').value
    }
    document.getElementById('donate').onclick = () => {
        document.getElementById('donate-modal').style.display = 'block'
    }
    document.getElementById('copy-link').onclick = () => {
        const link = document.getElementById('link-output')
        link.select()
        link.setSelectionRange(0, 9999999999999999999999999999999999999999999999)
        navigator.clipboard.writeText(link.value)
        callToast('Copied link to clipboard. You may now share<br>your designs to the world.', 'success')
    }
    document.getElementById('close-share-modal').onclick = () => {
        document.getElementById('share-modal').style.display = 'none'
    }
    document.getElementById('close-donate-modal').onclick = () => {
        document.getElementById('donate-modal').style.display = 'none'
    }
})