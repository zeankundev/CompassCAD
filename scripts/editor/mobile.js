let renderer;
$(document).ready(function() {
    document.getElementById('canvas').width = window.innerWidth;
    document.getElementById('canvas').height = window.innerHeight;
    renderer = new GraphicDisplay('canvas', window.innerWidth, window.innerHeight);
    renderer.displayWidth = window.innerWidth;
    renderer.displayHeight = window.innerHeight;
    initCAD(renderer);
    renderer.logicDisplay.importJSON(JSON.parse(`[{"active":true,"type":2,"color":"#fff","radius":2,"x1":-300,"y1":-300,"x2":-200,"y2":-200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-299,"y":-323,"text":"Color test","fontSize":24},{"active":true,"type":7,"color":"#eee","radius":5,"x":-297,"y":-168,"text":"This should be white","fontSize":13},{"active":true,"type":2,"color":"#ff0000","radius":2,"x1":-300,"y1":-100,"x2":-200,"y2":0},{"active":true,"type":7,"color":"#ffffff","radius":2,"x":-300.5555555555556,"y":28.85185185185187,"text":"This should be red","fontSize":13},{"active":true,"type":2,"color":"#00ff00","radius":2,"x1":-300,"y1":100,"x2":-200,"y2":200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-300.5555555555556,"y":228.51851851851853,"text":"This should be green","fontSize":13}]`), renderer.logicDisplay.components)
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

    document.getElementById('ruler').onclick = () => {
        console.log('Measure button clicked');
        renderer.setMode(renderer.MODES.ADDMEASURE)
    };
});