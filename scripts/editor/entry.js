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
            }
        };
    };
};
setInterval(() => {document.getElementById('tooltip').innerText = renderer.getToolTip()},1)
const exportToSvg = () => {
    const exporter = new SVGExporter();
    let content = exporter.exportSVG();
    const blob = new Blob([content], {type: 'text/plain'})
    const downloader = document.createElement('a')
    downloader.download = `${document.getElementById('filename').value}.svg`
    downloader.href = window.URL.createObjectURL(blob);
    downloader.click();
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
        // Set the renderer's display dimensions
        renderer.displayHeight = window.innerHeight - document.getElementById('menubar').offsetHeight;
        renderer.displayWidth = window.innerWidth - document.getElementById('toolbar').offsetWidth;
        
        // Set the canvas dimensions
        document.getElementById('working-canvas').width = window.innerWidth - document.getElementById('toolbar').offsetWidth;
        document.getElementById('working-canvas').height = window.innerHeight - document.getElementById('menubar').offsetHeight;
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
    // Adding keyboard events 
	
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.GREATERTHAN, function(e){
		renderer.zoomIn();
	});
	
	renderer.keyboard.addKeyEvent(true, renderer.keyboard.KEYS.LESSTHAN, function(e){
		renderer.zoomOut();
	});
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
})