$(document).ready(function() {
    const renderer = new GraphicDisplay('canvas', window.innerWidth, window.innerHeight);
    initCAD(renderer);
    document.getElementById('sizing-debug-info').innerHTML = `
    Sizing information:<br>
    window.innerWidth: ${window.innerWidth}<br>
    window.innerHeight: ${window.innerHeight}<br>
    reported from GraphicDisplay:<br>
    displayWidth: ${renderer.displayWidth}<br>
    displayHeight: ${renderer.displayHeight}
    `
});