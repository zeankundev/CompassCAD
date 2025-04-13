let renderer;
$(document).ready(function() {
    renderer = new GraphicDisplay('canvas', window.innerWidth, window.innerHeight);
    document.getElementById('canvas').style.width = window.innerWidth + 'px';
    document.getElementById('canvas').style.height = window.innerHeight + 'px';
    renderer.displayWidth = window.innerWidth;
    renderer.displayHeight = window.innerHeight;
    initCAD(renderer);
    document.getElementById('sizing-debug-info').innerHTML = `
    Sizing information:<br>
    window.innerWidth: ${window.innerWidth}<br>
    window.innerHeight: ${window.innerHeight}<br>
    reported from GraphicDisplay:<br>
    displayWidth: ${renderer.displayWidth}<br>
    displayHeight: ${renderer.displayHeight}
    `
    renderer.logicDisplay.importJSON(JSON.parse(`[{"active":true,"type":2,"color":"#fff","radius":2,"x1":-300,"y1":-300,"x2":-200,"y2":-200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-299,"y":-323,"text":"Color test","fontSize":24},{"active":true,"type":7,"color":"#eee","radius":5,"x":-297,"y":-168,"text":"This should be white","fontSize":13},{"active":true,"type":2,"color":"#ff0000","radius":2,"x1":-300,"y1":-100,"x2":-200,"y2":0},{"active":true,"type":7,"color":"#ffffff","radius":2,"x":-300.5555555555556,"y":28.85185185185187,"text":"This should be red","fontSize":13},{"active":true,"type":2,"color":"#00ff00","radius":2,"x1":-300,"y1":100,"x2":-200,"y2":200},{"active":true,"type":7,"color":"#eee","radius":5,"x":-300.5555555555556,"y":228.51851851851853,"text":"This should be green","fontSize":13}]`), renderer.logicDisplay.components)
});