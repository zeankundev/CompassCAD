import { COMPONENT_TYPES, Point, Line, Circle, Rectangle, Measure, Label, Arc, Shape, Picture } from "./ComponentHandler";
import { KeyboardHandler, MouseHandler } from "./InputHandler";
import { LogicDisplay } from "./LogicDisplay";

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsWarningThreshold = 20;
let warningDisplayed = false;
export class GraphicDisplay {
    MODES = {
        ADDPOINT: 1,
        ADDLINE: 2,
        ADDCIRCLE: 3,
        ADDRECTANGLE: 4,
        ADDARC: 5,
        ADDMEASURE: 6,
        ADDLABEL: 7,
        ADDSHAPE: 8,
        ADDPICTURE: 9,
        DELETE: 20,
        TRIM: 21,
        NAVIGATE: 22,
        MOVE: 23,
        EDIT: 24
    }
    MOUSEACTION = {
        MOVE: 0,
        DOWN: 1,
        UP: 2
    }
    readOnly: boolean;
    mode: number;
    previousColor: string;
    previousRadius: string;
    displayFont: string;
    temporarySelectedComponent: any;
    selectedComponent: any;
    temporaryComponentType: number;
    temporaryShape: any;
    temporaryPoints: number[]
    temporaryText: string;
    selectedColor: string;
    selectedRadius: string;
    logicDisplay: LogicDisplay | null;
    counter: number;
    undoStack: any[];
    redoStack: any[];
    temporaryObjectArray: any[];
    displayWidth: number;
    displayHeight: number;
    offsetX: number;
    offsetY: number;
    camX: number;
    camY: number;
    zoom: number;
    zoomin: number;
    zoomout: number;
    currentZoom: number;
    targetZoom: number;
    zoomSpeed: number;
    camMoving: boolean;
    xCNaught: number;
    yCNaught: number;
    cOutX: number;
    cOutY: number;
    inFocus: boolean;
    initResize: boolean;
    showGrid: boolean;
    showOrigin: boolean;
    showRules: boolean;
    gridPointer: boolean;
    gridSpacing: number;
    conversionFactor: number;
    unitName: string;
    unitMeasure: string;
    unitFactor: number;
    unitConversionFactor: number;
    snap: boolean;
    snapTolerance: number;
    fontSize: number;
    maximumStack: number;
    displayRef: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    tooltipDefault: string;
    tooltip: string;
    filePath: string;
    keyboard: KeyboardHandler | null;
    mouse: MouseHandler | null;
    constructor(displayReference: HTMLCanvasElement, width: number, height: number) {
        this.readOnly = false;
        this.mode = 0;
        this.previousColor = '#fff';
        this.previousRadius = '1';
        this.displayFont = 'Arial';
        this.temporarySelectedComponent = null;
        this.temporaryComponentType = 0;
        this.temporaryShape = null;
        this.temporaryPoints = [0];
        this.temporaryText = '';
        this.temporaryPoints = [0];
        this.selectedColor = '#fff';
        this.selectedRadius = '1';
        this.displayRef = displayReference;
        this.logicDisplay = null;
        this.counter = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.temporaryObjectArray = [];
        this.displayWidth = width;
        this.displayHeight = height;
        this.offsetX = 0;
        this.offsetY = 0;
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;
        this.zoomin = 1.1;
        this.zoomout = 0.9;
        this.currentZoom = 1;
        this.targetZoom = 1;
        this.zoomSpeed = 0.1;
        this.camMoving = false;
        this.xCNaught = 0;
        this.yCNaught = 0;
        this.cOutX = 0;
        this.cOutY = 0;
        this.inFocus = true;
        this.initResize = false;
        this.showGrid = true;
        this.showOrigin = true;
        this.showRules = true;
        this.gridPointer = false;
        this.gridSpacing = 100;
        this.conversionFactor = 1;
        this.unitName = 'px';
        this.unitMeasure = 'm';
        this.unitFactor = 1;
        this.unitConversionFactor = 1 / 100;
        this.snap = false;
        this.snapTolerance = 5;
        this.fontSize = 12;
        this.maximumStack = 50;
        this.displayRef = displayReference;
        const context = this.displayRef!.getContext('2d');
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.context = context;
        this.tooltipDefault = 'Tooltip';
        this.tooltip = this.tooltipDefault;
        this.filePath = '';
        this.keyboard = null;
        this.mouse = null;
    }
    async init() {
        this.logicDisplay = new LogicDisplay();
        this.logicDisplay!.init();
        this.zoom = 1;
        this.temporaryObjectArray = [];
        this.keyboard = new KeyboardHandler();
        this.mouse = new MouseHandler();
        this.displayRef!.style.cursor = 'crosshair';
        const context = this.displayRef!.getContext('2d');
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        this.context = context;
        this.execute();
    }
    lerp(start: number, end: number, time: number) {
        return start + (end - start) * time;
    }
    async execute() {
        let deviceScale = window.devicePixelRatio || 1;
        this.offsetX = this.displayRef!.offsetLeft;
        this.offsetY = this.displayRef!.offsetTop;
        this.currentZoom = this.lerp(this.currentZoom, this.targetZoom, this.zoomSpeed);
        this.zoom = this.currentZoom;
        this.updateCamera();
        this.clearGrid();
        if (this.showGrid)
            this.drawGrid(this.cOutX, this.cOutY);
        if (this.showOrigin)
            this.drawOrigin(this.cOutX, this.cOutY);
        this.drawAllComponents(this.logicDisplay!.components, 0, 0);
        if (this.temporaryComponentType != null)
            this.drawTemporaryComponent();
        this.drawRules();
    }
    saveState() {
        this.undoStack.push(JSON.stringify(this.logicDisplay?.components));
        if (this.undoStack.length > this.maximumStack) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }
    clearGrid() {
        this.context.restore();
        this.context.fillStyle = '#202020';
        this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
        this.context.save();
        this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
        this.context.strokeStyle = '#e9e9e9';
        this.context.lineWidth = 0.15;
    }
    drawAllComponents(components: any[], x: number, y: number) {
        for (var i = 0; i < components.length; i++) {
            if (!components[i].isActive())
                continue;
            this.drawComponent(components[i], x, y);
        }
    }
    drawComponent(component: any, moveByX: number, moveByY: number) {
        switch (component.type) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint(
                        component.x + moveByX,
                        component.y + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.LINE:
                this.drawLine(
                        component.x1 + moveByX,
                        component.y1 + moveByY,
                        component.x2 + moveByX,
                        component.y2 + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle(
                        component.x1 + moveByX,
                        component.y1 + moveByY,
                        component.x2 + moveByX,
                        component.y2 + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle(
                        component.x1 + moveByX,
                        component.y1 + moveByY,
                        component.x2 + moveByX,
                        component.y2 + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure(
                        component.x1 + moveByX,
                        component.y1 + moveByY,
                        component.x2 + moveByX,
                        component.y2 + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel(
                        component.x + moveByX,
                        component.y + moveByY,
                        component.text,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc(
                        component.x1 + moveByX,
                        component.y1 + moveByY,
                        component.x2 + moveByX,
                        component.y2 + moveByY,
                        component.x3 + moveByX,
                        component.y3 + moveByY,
                        component.color,
                        component.radius);
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(component);
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPicture(
                    component.x + moveByX,
                    component.y + moveByY,
                    component.pictureSource
                );
                break;
        } 
    }
    drawTemporaryComponent() {
        switch (this.temporaryComponentType) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.LINE:
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[1],
                        this.selectedColor,
                        this.selectedRadius);
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[0],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryText,
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1],
                        this.temporaryPoints[2],
                        this.temporaryPoints[3],
                        this.temporaryPoints[4],
                        this.temporaryPoints[5],
                        this.selectedColor,
                        this.selectedRadius);
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(this.temporaryShape);
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPoint(
                    this.temporaryPoints[0],
                    this.temporaryPoints[1],
                    this.selectedColor,
                    this.selectedRadius);
                break;
        }
    }
    drawPoint(x: number, y: number, color: string, radius: string) {
        this.context.lineWidth = 3 * this.zoom;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(
                (x + this.cOutX) * this.zoom, 
                (y + this.cOutY) * this.zoom, 
                2 * this.zoom, 0, 3.14159*2, false);
        this.context.closePath();
        this.context.stroke();
    }
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, radius: string) {
        this.context.lineWidth = parseInt(radius) * this.zoom;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.lineCap = "round";
        this.context.beginPath();
        this.context.moveTo(
                (x1 + this.cOutX) * this.zoom,
                (y1 + this.cOutY) * this.zoom);
        this.context.lineTo(
                (x2 + this.cOutX) * this.zoom,
                (y2 + this.cOutY) * this.zoom);
        this.context.stroke();
    }
    drawCircle(x1: number, y1: number, x2: number, y2: number, color: string, radius: string) {
        this.context.lineWidth = parseInt(radius) * this.zoom;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(
                (x1 + this.cOutX) * this.zoom, 
                (y1 + this.cOutY) * this.zoom, 
                this.getDistance(x1, y1, x2, y2) * this.zoom,
                0, 3.14159*2, false);
        this.context.closePath();
        this.context.stroke();
    }
    drawRectangle(x1: number, y1: number, x2: number, y2: number, color: string, radius: string) {
        this.drawLine(x1, y1, x2, y1, color, radius);
        this.drawLine(x2, y1, x2, y2, color, radius);
        this.drawLine(x2, y2, x1, y2, color, radius);
        this.drawLine(x1, y2, x1, y1, color, radius);
    }
    async drawMeasure(x1: number, y1: number, x2: number, y2: number, color: string, radius: string) {
        var distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor;
        var angle = Math.atan2(y2 - y1, x2 - x1);
        var localZoom = this.zoom;
        var localDiff = 0;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
        }
        const distanceText = distance.toFixed(2) + "" + this.unitMeasure;
        this.context.save();
        this.context.font = (this.fontSize * localZoom) + `px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        const textWidth = this.context.measureText(distanceText).width;
        this.context.restore();
        var defaultArrowLength = 25;
        var arrowOffset = 5;
        let arrowLength = defaultArrowLength;
        const minDistanceForFullArrow = defaultArrowLength * 2 / 100; // 0.5 meters
        if (distance < minDistanceForFullArrow) {
            arrowLength = (distance / minDistanceForFullArrow) * defaultArrowLength;
        }
        const isShortDistance = distance < minDistanceForFullArrow * 2;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const textOffsetY = isShortDistance ? (750 / 100) * this.zoom : 0;
        if (!isShortDistance) {
            const basePadding = 20; 
            const adaptivePadding = basePadding * this.zoom; 
            const labelGap = (textWidth + adaptivePadding) / this.zoom;
    
            const halfGapX = (labelGap / 2) * Math.cos(angle);
            const halfGapY = (labelGap / 2) * Math.sin(angle);
    
            this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius); 
            this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius);
        }
        this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, radius);
        this.drawArrowhead(x2, y2, angle, -arrowLength, arrowOffset, color, radius);
        this.context.save();
        this.context.translate((midX * this.zoom) + this.cOutX * this.zoom, ((midY * this.zoom) + (textOffsetY * 2)) + this.cOutY * this.zoom);
        this.context.rotate(angle);
        this.context.textAlign = 'center';
        this.context.textBaseline = isShortDistance ? 'top' : 'middle';
        this.context.fillStyle = color;
        this.context.font = (this.fontSize * localZoom) + `px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        this.context.fillText(distanceText, 0, localDiff);
        this.context.restore();
    }
    drawArrowhead(x: number, y: number, angle: number, length: number, offset: number, color: string, radius: string) {
        var arrowX = x + length * Math.cos(angle);
        var arrowY = y + length * Math.sin(angle);
        var offsetX = offset * Math.cos(angle + Math.PI / 2);
        var offsetY = offset * Math.sin(angle + Math.PI / 2);
    
        this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius);
        this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius);
        this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius);
    }
    drawLabel(x: number, y: number, text: string, color: string, radius: string) {
        this.drawPoint(x, y, '#0ff', "2");
        var localZoom = this.zoom;
        var localDiff = 0;  
        if ( this.zoom <= 0.25 ) {
            localZoom = 0.5;
            localDiff = 20;
            y += localDiff;
        }
        this.context.fillStyle = color;
        this.context.font =  (this.fontSize * localZoom) + `px ${this.displayFont}, monospace`; 
        var maxLength = 24;
        var tmpLength = 0;
        var tmpText = "";
        var arrText = text.split(" ");
        
        for (var i = 0; i < arrText.length; i++) {
            tmpLength += arrText[i].length + 1;
            tmpText += " " + arrText[i];
            
            if ( tmpLength > maxLength ) {
                this.context.fillText(
                        tmpText,
                        (this.cOutX + x - 5) * this.zoom,
                        (this.cOutY + y) * this.zoom);
                y += 25 + localDiff;
                tmpLength = 0;
                tmpText = "";
            }
        }
        
        // Print the remainig text
        this.context.fillText(
                tmpText,
                (this.cOutX + x - 5) * this.zoom,
                (this.cOutY + y) * this.zoom);
    }
    drawArc(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string, radius: string) {
        var firstAngle = this.getAngle(x1, y1, x2, y2);
        var secondAngle = this.getAngle(x1, y1, x3, y3);
        
        this.context.lineWidth = parseInt(radius) * this.zoom;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(
                (x1 + this.cOutX) * this.zoom, 
                (y1 + this.cOutY) * this.zoom, 
                this.getDistance(x1, y1, x2, y2) * this.zoom,
                firstAngle, secondAngle, false);
        this.context.stroke();
    }
    drawShape(shape: Shape) {
        this.drawAllComponents(shape.components, shape.x, shape.y);
        this.drawPoint(shape.x, shape.y, shape.color, shape.radius.toString());
    }
    drawPicture(x: number, y: number, basedURL: string) {
        this.drawPoint(x, y, '#0ff', "2");

        // Fallback image URL
        const fallbackURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAAXNSR0IArs4c6QAABEhJREFUaAXtWWHR6yoQvU5QgAIUoGAVoAAFqwAFKEABClAQBShAAW8mZ2aHSdM23NKv75tbfnSAbJJzlt3D0vxRv7z9+eX41ZfAp1fwuwLfFXjRA98Quu/AWmvfW631vtWrV964Al8ClxbnXSsQQkD89N5bayGES3Dmjd5CIMYo6KWTUpqH9/yO9QS89wL60CGi54gmLdYTyDkL7hhjSkmG71iE9QRKKYIY3pRhKWXSv8/N1xM4uPwwfI5o0mI9ASISlx86vyMHlFKjhgqHNynp+hXQWiulvPeyE7fWmHkyNK6aryfAzDlnY4xSSmstnZzzOxZhPQFxvGiOCOu2bVcde9luMYExg0X1RyFanseLCZxiHVnFGC8795LhYgISP4czQGsNctRaQ5ZfQnfBaCWBsQqS+AGGUVjXRtFKApKsvXeIj3hwjCJJbrn6SmcZAWOM7FmnajPWSAujaBmBMX6897dOZWZhuHBfW0Zg2zbBd4gfkNFai8HCKFpGQHQm53zrfsxIFLXW7tnMzi8jAAGttZ66H7CstTA7TZJZ6LBfRiDn/Bg93meMqbX+H0MohPDA96N3jTELq7plKzBC/Mn+l8BPevvsXf/SCpRSUKJZax/ISK3VOXfmrLfMTawA9lHaW+8dcPTeRmjee5EjqXmkg3PmaD/2R7Nx/kF/jkApBQ4GAWbGBjzKYu+diFJKuFT31ntnZmwCrbVaq9Yat2NrM8bI06YqpTkCzrnWGioC1DbM7Jwb62chUEqx1vbevfcpJZz0xR6XZIhiNoQQY5wqNOYIEJEUlSBARHi3HFOEABIGwxBCKQX/teBwQ0T4uwVHBfCJezschh7Ej1IzH7oBRSmFFVBKpZRqra21sbZ5TKC1hnMzEYEJIs0Yg6dt2/agHLwlM7ECRIQkM8aIv51z3vsx+WBmrUUqY2iMsdYqpZxzkAGtdUrJ7633jifcPu0W8WFmgsDhzteHIYS2t6msPbz3kwQOUP5u+C8RiDFCyw+uwgl43ArE4PRwfGopt8x2JlYAaJg57M05h9TEd6QQAlIQ+Q0b/FprQwje+xCC3K61ds5prb33zOy9l/yeSokJAsyMfQDvY2ZrLRHFGAUcbLTWIQRrrfcet6CDSYg9PJ1zdnvjvUGgROKurMYEASKCFNq9aa1FMbGdQSUhiLAxxog+4q92WEqxhHCSSazJKMpPOUwQePqsvzCYwnr6/J8g8DrKU+iYnCAgOy4Ajb9KKeQDHjpeOmyuBzKovYkI328gDA/g3l6aIAANQdYyc0oJfdEW0R/UmDFG51xKCcqD4gL1ZowRxkIApyXJpVug92bmCDjnoIwQDWaGBEGXhACUMYQgGoXyCeqEJwCQiA8micg5B6m4h/gwP0FAay0qBEmRX6WUCA4zSwjhvCZDMZNAGr8CYlKecwB6bzhB4N4jPjv/JfBZ/0+dyD4N9fz93xA698vPzf4HXIw/vhzonIwAAAAASUVORK5CYII=';
    
        // Check if basedURL is invalid (empty, space, null, or undefined)
        const imageURL = (!basedURL || basedURL.trim() === '') ? fallbackURL : basedURL;
    
        // Create a new image object without caching or onload
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Allow CORS for HTTPS images
        img.src = imageURL;
    
        // Wait for the image to load to get correct dimensions
        const width = img.naturalWidth * this.zoom || 100; // Fallback width if image hasn't loaded
        const height = img.naturalHeight * this.zoom || 100; // Fallback height if image hasn't loaded
    
        img.onerror = () => {
            img.src = fallbackURL
        }
        // Draw the image at the specified coordinates, adjusting for zoom
        this.context.drawImage(img, (x + this.cOutX) * this.zoom, (y + this.cOutY) * this.zoom, width, height);
    }
    drawOrigin(cx: number, cy: number) {
        this.context.lineWidth = 1;
        this.context.strokeStyle = "#fff";
        
        this.context.beginPath();
        this.context.moveTo(cx * this.zoom, -this.displayHeight);
        this.context.lineTo(cx * this.zoom, this.displayHeight);
        this.context.closePath();
        this.context.stroke();
        
        this.context.beginPath();
        this.context.moveTo(-this.displayWidth, cy * this.zoom);
        this.context.lineTo(this.displayWidth, cy * this.zoom);
        this.context.closePath();
        this.context.stroke();
    }
    drawRules() {
        if (!this.showRules)
            return;
        
        if (this.gridPointer) {
            this.context.lineWidth = 0.2;
            this.context.strokeStyle = "#ccc";
            
            this.context.beginPath();
            this.context.moveTo(this.getCursorXInFrame(), -this.displayHeight);
            this.context.lineTo(this.getCursorXInFrame(), this.displayHeight);
            this.context.closePath();
            this.context.stroke();
            
            this.context.beginPath();
            this.context.moveTo(-this.displayWidth, this.getCursorYInFrame());
            this.context.lineTo(this.displayWidth, this.getCursorYInFrame());
            this.context.closePath();
            this.context.stroke();
        }
    }
    drawGrid(camXoff: number, camYoff: number) {
        // Base grid spacing adjusted by zoom
        const gridSpacingAdjusted = this.gridSpacing * this.zoom;
        
        // Dynamically adjust density based on zoom level
        let densityDivisor;
        // For very small grid spacing (<5), be more aggressive with density reduction
        if (this.gridSpacing < 5) {
            if (this.zoom <= 1) {
                densityDivisor = 50; // Very sparse at low zoom
            } else if (this.zoom <= 2) {
                densityDivisor = 25; // Sparse at normal zoom
            } else {
                densityDivisor = 20; // Show full density only at high zoom
            }
        }
        // For small grid spacing (5-10), moderate density reduction
        else if (this.gridSpacing < 10) {
            if (this.zoom < 1) {
                densityDivisor = 6; // Very sparse at low zoom
            } else if (this.zoom <= 2) {
                densityDivisor = 3; // Normal density
            } else {
                densityDivisor = 1; // Dense at high zoom
            }
        }
        // For medium grid spacing (10-15), light density reduction
        else if (this.gridSpacing < 20) {
            if (this.zoom < 1) {
                densityDivisor = 3; // Slightly sparse at low zoom
            } else {
                densityDivisor = 1.5; // Normal density at all other zooms
            }
        }
        else if (this.gridSpacing < 50) {
            if (this.zoom < 1) densityDivisor = 2;
            else densityDivisor = 1;
        }
        // For large grid spacing (>=15), no density reduction needed
        else {
            if (this.zoom < 1) {
                densityDivisor = 1.5
            } else {
                densityDivisor = 0.5;
            }
        }

        // Adjust spacing based on density
        const effectiveSpacing = gridSpacingAdjusted * densityDivisor;
        
        // Calculate visible area boundaries
        const leftBound = -this.displayWidth/2;
        const rightBound = this.displayWidth/2;
        const topBound = -this.displayHeight/2;
        const bottomBound = this.displayHeight/2;

        // Calculate grid start/end positions with camera offset
        const startX = Math.floor((leftBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const startY = Math.floor((topBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const endX = Math.ceil((rightBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const endY = Math.ceil((bottomBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;

        // Adjust point size based on zoom
        const pointSize = Math.min(1, Math.max(0.5, this.zoom * 0.5));
        
        // Set grid style
        this.context.fillStyle = "#cccccc75";

        // Draw optimized grid points
        for (let x = startX; x <= endX; x += effectiveSpacing) {
            for (let y = startY; y <= endY; y += effectiveSpacing) {
                this.context.beginPath();
                const adjustedX = x + camXoff * this.zoom;
                const adjustedY = y + camYoff * this.zoom;
                this.context.arc(adjustedX, adjustedY, 1, 0, Math.PI * 2);
                this.context.fill();
            }
        }
    }
    snapToGrid(x: number, y: number) {
        const gridSize = this.gridSpacing * this.zoom;
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        return { x: snappedX, y: snappedY };
    }
    async performAction(e: any, action: number) {
        switch(this.mode) {
            case this.MODES.ADDPOINT:
                this.displayRef!.style.cursor = 'crosshair';
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    }
                    this.temporaryPoints[0] = this.getCursorXLocal(); // TODO this.getCursorSnapX();
                    this.temporaryPoints[1] = this.getCursorYLocal(); // TODO this.getCursorSnapY();
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    this.logicDisplay!.addComponent(new Point(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1]));
                    this.saveState()
                    this.execute()
                }
                this.tooltip = 'Add point (press esc to cancel)'
                break;
            case this.MODES.ADDLINE:
                if (e.which == 3)
                
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.LINE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.LINE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.LINE) {
                        this.logicDisplay!.addComponent(new Line(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                this.temporaryPoints[2],
                                this.temporaryPoints[3]));
                        
                        this.temporaryPoints[0] = this.temporaryPoints[2];
                        this.temporaryPoints[1] = this.temporaryPoints[3];
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Add line (press esc to cancel)"
                break;
            case this.MODES.ADDCIRCLE:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.CIRCLE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.logicDisplay!.addComponent(new Circle(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                this.temporaryPoints[2],
                                this.temporaryPoints[3]));
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Add circle (press esc to cancel)"
                break;
            case this.MODES.ADDARC:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.ARC) {
                        // TODO: point 4 and 5 must represent a point intersection between
                        //		 the circle and the straight line
                        this.temporaryPoints[4] = this.getCursorXLocal();
                        this.temporaryPoints[5] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.CIRCLE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.temporaryComponentType = COMPONENT_TYPES.ARC;
                        this.temporaryPoints[4] = this.getCursorXLocal();
                        this.temporaryPoints[5] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.ARC) {
                        this.logicDisplay!.addComponent(new Arc(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                this.temporaryPoints[2],
                                this.temporaryPoints[3],
                                this.temporaryPoints[4],
                                this.temporaryPoints[5]));
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Add arc (press esc to cancel)"
                break;
            case this.MODES.ADDRECTANGLE:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.RECTANGLE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.RECTANGLE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.RECTANGLE) {
                        this.logicDisplay!.addComponent(new Rectangle(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                this.temporaryPoints[2],
                                this.temporaryPoints[3]));
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Add rectangle (press esc to cancel)"
                break;
            case this.MODES.ADDMEASURE:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.MEASURE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.MEASURE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.MEASURE) {
                        this.logicDisplay!.addComponent(new Measure(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                this.temporaryPoints[2],
                                this.temporaryPoints[3]));
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Measure (press esc to cancel)"
                break;
            case this.MODES.ADDLABEL:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    let text = prompt('Add text...')
                    if ( text && text.length > 0 ) {
                        this.logicDisplay!.addComponent(new Label(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                text));
                        this.saveState()
                        this.execute()
                        this.setMode(this.MODES.NAVIGATE)
                    }
                }
                this.tooltip = "Add label (press esc to cancel)"
                break;
            case this.MODES.ADDSHAPE:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.SHAPE;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.SHAPE) {
                        this.temporaryShape.x = this.getCursorXLocal();
                        this.temporaryShape.y = this.getCursorYLocal();
                    }
                } else if (action == this.MOUSEACTION.DOWN) {
                    this.logicDisplay!.addComponent(this.temporaryShape);
                    this.resetMode()
                    this.saveState()
                    this.execute()
                }
                this.tooltip = "Add shape (press esc to cancel)"
                break;
            case this.MODES.ADDPICTURE:
                this.displayRef!.style.cursor = 'crosshair';;
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    let text = prompt('Enter a valid Image URL')
                    if ( text && text.length > 0 ) {
                        this.logicDisplay!.addComponent(new Picture(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                text));
                        this.saveState()
                        this.execute()
                        this.setMode(this.MODES.NAVIGATE)
                    }
                }
                this.tooltip = "Add Picture (press esc to cancel)"
                break
            case this.MODES.NAVIGATE:
                console.log(`[cammove]: cam moving? ${this.camMoving}`);
                this.displayRef!.style.cursor = 'default';;
                if (action == this.MOUSEACTION.DOWN) {
                    this.camMoving = true; 
                    this.xCNaught = this.getCursorXRaw();
                    this.yCNaught = this.getCursorYRaw();
                } else if (action == this.MOUSEACTION.UP) {
                    this.camMoving = false;
                    this.camX += this.getCursorXRaw() - this.xCNaught;
                    this.camY += this.getCursorYRaw() - this.yCNaught;
                }
                this.tooltip = "Navigate"
                break;
            case this.MODES.MOVE:
                this.displayRef!.style.cursor = 'default';;
                if (action == this.MOUSEACTION.MOVE) {
                    if ( this.selectedComponent == null ) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                                this.getCursorXLocal(),
                                this.getCursorYLocal());
                    } else {
                        this.moveComponent(
                                this.selectedComponent,
                                this.getCursorXLocal(),
                                this.getCursorYLocal());
                        this.saveState()
                        this.execute()
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if ( this.selectedComponent == null ) {
                        this.selectComponent(this.temporarySelectedComponent);
                    } else {
                        this.unselectComponent();
                        this.saveState()
                        this.execute()
                    }
                }
                this.tooltip = "Move (click a node point to select, esc to cancel)"
                break;
            case this.MODES.EDIT:
                // TODO: In the next release
                this.tooltip = "Edit (press esc to cancel)";
                break;
            case this.MODES.DELETE:
                this.displayRef!.style.cursor = 'default';;
                if (action == this.MOUSEACTION.MOVE) {
                    if ( this.selectedComponent == null ) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                                this.getCursorXLocal(),
                                this.getCursorYLocal());
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if ( this.temporarySelectedComponent != null ) {
                        this.logicDisplay!.components[this.temporarySelectedComponent].setActive(false);
                    }
                    this.saveState()
                    this.execute()
                }
                this.tooltip = "Delete (click a node point to delete, esc to cancel)"
                break;
        }
    }
    undo() {
        if (this.undoStack.length > 0) {
            // Remove the last state from the undoStack and push it to the redoStack
            const state = this.undoStack.pop();
            this.redoStack.push(state);
    
            // Get the new last state from the undoStack (if any) to apply to the logicDisplay
            const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
    
            if (lastState) {
                this.logicDisplay!.components = []
                this.logicDisplay!.importJSON(JSON.parse(lastState), this.logicDisplay!.components);
            } else
                return
    
            this.execute(); // Re-render the canvas
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            // Move the current state to the undoStack
            this.undoStack.push(JSON.stringify(this.logicDisplay!.components));
    
            // Get the last state from the redoStack
            const state = this.redoStack.pop();
            console.log('upcoming state');
            console.log(state); // Log the state (optional)
            console.log('parsed state');
            console.log(JSON.parse(state)); // Log the parsed state (optional)
    
            // Clear the current components
            this.logicDisplay!.components = [];
    
            // Update the display with the next state
            this.logicDisplay!.importJSON(JSON.parse(state), this.logicDisplay!.components);
            this.execute(); // Re-render the canvas
        }
    }
    moveComponent(index: number, x: number, y: number) {
        if (index != null) {
            switch ( this.logicDisplay!.components[index].type ) {
                case COMPONENT_TYPES.POINT:
                case COMPONENT_TYPES.LABEL:
                case COMPONENT_TYPES.PICTURE:
                case COMPONENT_TYPES.SHAPE:
                    var dx = x - this.logicDisplay!.components[index].x;
                    var dy = y - this.logicDisplay!.components[index].y;
                    
                    this.logicDisplay!.components[index].x += dx;
                    this.logicDisplay!.components[index].y += dy;
                    break;
                case COMPONENT_TYPES.LINE:
                case COMPONENT_TYPES.CIRCLE:
                case COMPONENT_TYPES.RECTANGLE:
                case COMPONENT_TYPES.MEASURE:
                    var dx = x - this.logicDisplay!.components[index].x1;
                    var dy = y - this.logicDisplay!.components[index].y1;
                    
                    this.logicDisplay!.components[index].x1 += dx;
                    this.logicDisplay!.components[index].y1 += dy;
                    this.logicDisplay!.components[index].x2 += dx;
                    this.logicDisplay!.components[index].y2 += dy;
                    break;
                case COMPONENT_TYPES.ARC:
                    var dx = x - this.logicDisplay!.components[index].x1;
                    var dy = y - this.logicDisplay!.components[index].y1;
                    
                    this.logicDisplay!.components[index].x1 += dx;
                    this.logicDisplay!.components[index].y1 += dy;
                    this.logicDisplay!.components[index].x2 += dx;
                    this.logicDisplay!.components[index].y2 += dy;
                    this.logicDisplay!.components[index].x3 += dx;
                    this.logicDisplay!.components[index].y3 += dy;
                    break;
            }
        }
    }
    selectComponent(index: number) {
        if (index != null) {
            this.selectedComponent = index;
            this.previousColor = this.logicDisplay!.components[index].color;
            this.previousRadius = this.logicDisplay!.components[index].radius;
            this.logicDisplay!.components[index].color = this.selectedColor;
            this.logicDisplay!.components[index].radius = this.selectedRadius;
        }
    }
    unselectComponent() {
        if ( this.selectedComponent != null ) {
            this.logicDisplay!.components[this.selectedComponent].color = this.previousColor;
            this.logicDisplay!.components[this.selectedComponent].radius = this.previousRadius;
            this.selectedComponent = null;
        }
    }
    updateCamera() {
        console.log(`[camdebug]: camX=${this.camX}, camY=${this.camY}`);
        console.log(`[camdebug]: cOutX=${this.cOutX}, cOutY=${this.cOutY}`);
        this.cOutX = this.camX;
        this.cOutY = this.camY;

        if (this.camMoving) {
            this.cOutX += this.getCursorXRaw() - this.xCNaught;
            this.cOutY += this.getCursorYRaw() - this.yCNaught;
        }
    }
    setModeShape(shape: () => Shape) {
        this.setMode(this.MODES.ADDSHAPE);
        this.temporaryShape = shape()
    }
    setMode(mode: number) {
        this.resetMode();
	
        if (this.readOnly)
            this.mode = this.MODES.NAVIGATE;
        else
            this.mode = mode;
    }
    resetMode() {
        this.temporaryComponentType = NaN;
        this.temporaryShape = null;
        
        for (var i = 0; i < this.temporaryPoints.length; i++)
            delete this.temporaryPoints[i];
        
        this.mode = -1;
        this.tooltip = this.tooltipDefault;
    }
    setZoom(zoomFactor: number) {
        var newZoom = this.zoom * zoomFactor; 
        console.log(newZoom)
        
        // Zoom interval control
        if ( newZoom <= 0.4 || newZoom >= 15 )
            return;
        
        this.targetZoom = newZoom;
    }
    zoomIn() {
        this.setZoom(this.zoomin);
    }
    zoomOut() {
        this.setZoom(this.zoomout);
    }
    getCursorXRaw() {
        return Math.floor(this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
    }
    getCursorYRaw() {
        return Math.floor(this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
    }
    getCursorXLocal() {
        // Base grid spacing that remains constant across zoom levels
        const baseGridSpacing = this.gridSpacing / 2;

        // Calculate raw cursor position in world coordinates
        const rawXLocal = (this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;

        if (!this.snap) {
            return rawXLocal;
        }

        // Snap to base grid spacing regardless of zoom level
        return Math.round(rawXLocal / baseGridSpacing) * baseGridSpacing;
    }
    getCursorYLocal() {
        // Base grid spacing that remains constant across zoom levels
        const baseGridSpacing = this.gridSpacing / 2;

        // Calculate raw cursor position in world coordinates
        const rawYLocal = (this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;

        if (!this.snap) {
            return rawYLocal;
        }

        // Snap to base grid spacing regardless of zoom level
        return Math.round(rawYLocal / baseGridSpacing) * baseGridSpacing;
    }
    getCursorXInFrame() {
        // Get cursor position relative to canvas center (0,0)
        const screenX = this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2;
        
        // Convert to world coordinates with camera offset
        const worldX = (screenX / this.zoom) - this.cOutX;
        
        // Apply grid snapping while maintaining reference to world origin
        const gridSize = this.gridSpacing / 2;
        const snappedX = Math.round(worldX / gridSize) * gridSize;
        
        // Convert back to screen coordinates while preserving origin reference
        return (snappedX + this.cOutX) * this.zoom;
    }
    getCursorYInFrame() {
        // Get cursor position relative to canvas center (0,0)
        const screenY = this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2;
        
        // Convert to world coordinates with camera offset
        const worldY = (screenY / this.zoom) - this.cOutY;
        
        // Apply grid snapping while maintaining reference to world origin
        const gridSize = this.gridSpacing / 2;
        const snappedY = Math.round(worldY / gridSize) * gridSize;
        
        // Convert back to screen coordinates while preserving origin reference
        return (snappedY + this.cOutY) * this.zoom;
    }
    setTooltip(tooltip: string) {
        this.tooltip = tooltip;
    }
    getTooltip() {
        var text = this.tooltip;
	    return text + ` (${fps} FPS, dx=${Math.floor(this.getCursorXLocal())};dy=${Math.floor(this.getCursorYLocal())})`;
    }
    getDistance(x1: number, y1: number, x2: number, y2: number) {
        var distance = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
        return parseFloat(distance.toFixed(2));
    }
    findIntersectionWith(x: number, y: number) {
        for ( var i = this.logicDisplay!.components.length - 1; i >= 0; i-- ) {
            if (!this.logicDisplay!.components[i].isActive())
                continue;
            
            switch (this.logicDisplay!.components[i].type) {
                case COMPONENT_TYPES.POINT:
                case COMPONENT_TYPES.LABEL:	
                case COMPONENT_TYPES.PICTURE:
                case COMPONENT_TYPES.SHAPE:
                    var delta = this.getDistance(x, y, this.logicDisplay!.components[i].x, this.logicDisplay!.components[i].y); 
                    if ( delta >= 0 && delta <= this.snapTolerance / this.zoom )
                        return i;
                    break;
                case COMPONENT_TYPES.LINE:
                case COMPONENT_TYPES.CIRCLE:
                case COMPONENT_TYPES.ARC:
                case COMPONENT_TYPES.RECTANGLE:
                case COMPONENT_TYPES.MEASURE:
                    var delta = this.getDistance(x ,y, this.logicDisplay!.components[i].x1, this.logicDisplay!.components[i].y1);
                    if ( delta >= 0 && delta <= this.snapTolerance / this.zoom )
                        return i;
                    break;
            }
        }
        
        return null;
    }
    saveComponent() {
        console.warn(this.logicDisplay!.exportJSON());
    }
    getAngle(x1: number, y1: number, x2: number, y2: number) {
        var PI = Math.PI;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var theta = Math.atan2(dy, dx); // atan2 returns the angle in radians between -PI and PI

        // Scale the angle to the desired range (-6 to 6)
        var scaledAngle = theta * (3.15 / PI);

        return scaledAngle;
    }
    createNew() {
        this.logicDisplay!.components = []
        this.undoStack = []
        this.redoStack = []
        this.temporaryObjectArray = []
        this.execute()
    }
}
export const IntializeInstance = (gd: GraphicDisplay) => {
    console.log("initialized");
    gd.init();
    gd.setMode(gd.MODES.NAVIGATE)
    document.onkeyup = (e) => {
        gd.keyboard?.onKeyUp(e);
    }
    document.onkeydown = (e) => {
        gd.keyboard?.onKeyDown(e);
    }
    console.log(gd.displayRef)
    gd.displayRef!.onmousemove = (e) => {
        gd.mouse!.onMouseMove(e);
        if (!gd.gridPointer)
            gd.gridPointer = true;
        gd.performAction(e, gd.MOUSEACTION.MOVE);
    }
    gd.displayRef!.onmouseout = (e) => {
        gd.gridPointer = false;
    }
    gd.displayRef!.onmousedown = (e) => {
        gd.mouse!.onMouseDown(e)
        gd.performAction(e, gd.MOUSEACTION.DOWN);
    }
    gd.displayRef!.onmouseup = (e) => {
        gd.mouse!.onMouseUp(e)
        gd.performAction(e, gd.MOUSEACTION.UP);
    }
    gd.displayRef!.onwheel = (e) => {
        if (e.deltaY > 0) {
            gd.zoomOut();
        } else {
            gd.zoomIn();
        }
    }
    const tick = (e: any) => {
        const currentTime = performance.now();
        frameCount++;
        if (currentTime - lastTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
        }
        gd.execute();
    }
    setInterval(tick, 0);
}