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
        this.selectedComponent = null;
        this.temporaryComponentType = 0;
        this.temporaryShape = null;
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
        this.gridSpacing = 10;
        this.conversionFactor = 1;
        this.unitName = 'px';
        this.unitMeasure = 'm';
        this.unitFactor = 1;
        this.unitConversionFactor = 1 / 100;
        this.snap = false;
        this.snapTolerance = 5;
        this.fontSize = 12;
        this.maximumStack = 50;
        this.displayRef = document.createElement('canvas');
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
    init() {
        console.log("[bootstraper] init called");
        console.log(this.context)
        this.logicDisplay = new LogicDisplay();
        this.logicDisplay.init();
        this.zoom = 1;
        this.temporaryObjectArray = [];
        this.keyboard = new KeyboardHandler();
        this.mouse = new MouseHandler();
        this.execute();
    }
    lerp(start: number, end: number, t: number) {
        return start + t * (end - start);
    }
    execute() {
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

        if (this.temporaryComponentType !== null)
            this.drawTemporaryComponent()

        this.drawRules()
    }
    saveState() {
        this.undoStack.push(JSON.stringify(this.logicDisplay?.components));
        console.log(this.undoStack);
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
    drawAllComponents(components: any[], moveByX: number, moveByY: number) {
        for (var i = 0; i < components.length; i++) {
            if (!components[i].isActive())
                continue;

            this.drawComponent(components[i], moveByX, moveByY);
        }
    }
    drawComponent(component: any, moveByX: number, moveByY: number) {
        switch (component.type) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint(component.x + moveByX, component.y + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.LINE:
                this.drawLine(component.x1 + moveByX, component.y1 + moveByY, component.x2 + moveByX, component.y2 + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle(component.x1 + moveByX, component.y1 + moveByY, component.x2 + moveByX, component.y2 + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle(component.x1 + moveByX, component.y1 + moveByY, component.x2 + moveByX, component.y2 + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure(component.x1 + moveByX, component.y1 + moveByY, component.x2 + moveByX, component.y2 + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel(component.x + moveByX, component.y + moveByY, component.text, component.color, component.radius);
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc(component.x1 + moveByX, component.y1 + moveByY, component.x2 + moveByX, component.y2 + moveByY, component.x3 + moveByX, component.y3 + moveByY, component.color, component.radius);
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(component)
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPicture(component.x + moveByX, component.y + moveByY, component.pictureSource);
                break;
        }
    }
    drawTemporaryComponent() {
        switch (this.temporaryComponentType) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint(this.temporaryPoints[0], this.temporaryPoints[1], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.LINE:
                this.drawLine(this.temporaryPoints[0], this.temporaryPoints[1], this.temporaryPoints[2], this.temporaryPoints[3], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle(this.temporaryPoints[0], this.temporaryPoints[1], this.temporaryPoints[2], this.temporaryPoints[3], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle(this.temporaryPoints[0], this.temporaryPoints[1], this.temporaryPoints[2], this.temporaryPoints[3], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure(this.temporaryPoints[0], this.temporaryPoints[1], this.temporaryPoints[2], this.temporaryPoints[3], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel(this.temporaryPoints[0], this.temporaryPoints[1], '', this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc(this.temporaryPoints[0], this.temporaryPoints[1], this.temporaryPoints[2], this.temporaryPoints[3], this.temporaryPoints[4], this.temporaryPoints[5], this.selectedColor, parseInt(this.selectedRadius));
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(this.temporaryShape);
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPicture(this.temporaryPoints[0], this.temporaryPoints[1], this.filePath);
                break;
        }
    }
    drawPoint(x: number, y: number, color: string, radius: number) {
        this.context.lineWidth = 3;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc((x + this.cOutX) * this.zoom, (y + this.cOutY) * this.zoom, radius, 0, 2 * Math.PI, false);
        this.context.closePath();
        this.context.stroke();
    }
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, radius: number) {
        this.context.lineWidth = radius;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo((x1 + this.cOutX) * this.zoom, (y1 + this.cOutY) * this.zoom);
        this.context.lineTo((x2 + this.cOutX) * this.zoom, (y2 + this.cOutY) * this.zoom);
        this.context.stroke();
    }
    drawCircle(x1: number, y1: number, x2: number, y2: number, color: string, radius: number) {
        this.context.lineWidth = radius;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc((x1 + this.cOutX) * this.zoom, (y1 + this.cOutY) * this.zoom, this.getDistance(x1, y1, x2, y2) * this.zoom, 0, 2 * Math.PI, false);
    }
    drawRectangle(x1: number, y1: number, x2: number, y2: number, color: string, radius: number) {
        this.drawLine(x1, y1, x2, y1, color, radius);
        this.drawLine(x2, y1, x2, y2, color, radius);
        this.drawLine(x2, y2, x1, y2, color, radius);
        this.drawLine(x1, y2, x1, y1, color, radius);
    }
    drawMeasure(x1: number, y1: number, x2: number, y2: number, color: string, radius: number) {
        var distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;
        var angle = Math.atan2(y2 - y1, x2 - x1);
        var localZoom = this.zoom;
        var localDiff = 0;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
        }
        const distanceText = distance.toFixed(2) + '' + this.unitMeasure;
        this.context.save();
        this.context.font = `${this.fontSize * localZoom}px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        const textWidth = this.context.measureText(distanceText).width;
        this.context.restore();
        var defaultArrowLength = 25;
        var arrowOffset = 5;
        let arrowLength = defaultArrowLength;
        const minDistanceForFullArrow = defaultArrowLength * 2 / 100;
        if (distance < minDistanceForFullArrow) {
            arrowLength = (distance / minDistanceForFullArrow) * defaultArrowLength;
        }
        const isShortDistance = distance < minDistanceForFullArrow * 2;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const textOffsetY = isShortDistance ? (750 / 100) * this.zoom : 0;
        if (!isShortDistance) {
            const basePadding = 20;
            const adaptivePadding = basePadding * this.zoom
            const labelGap = (textWidth + adaptivePadding) / this.zoom;
            const halfGapX = (labelGap / 2) * Math.cos(angle);
            const halfGapY = (labelGap / 2) * Math.sin(angle);
            this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius);
            this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius);
        }
        this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, radius);
        this.drawArrowhead(x2, y2, angle + Math.PI, arrowLength, arrowOffset, color, radius);
        this.context.save();
        this.context.translate((midX * this.zoom) + this.cOutX * this.zoom, ((midY * this.zoom) + (textOffsetY * 2)) + this.cOutY * this.zoom);
        this.context.rotate(angle);
        this.context.textAlign = 'center';
        this.context.textBaseline = isShortDistance ? 'top' : 'middle';
        this.context.fillStyle = color;
        this.context.font = `${this.fontSize * localZoom}px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        this.context.fillText(distanceText, 0, localDiff);
        this.context.restore();
    }
    drawArrowhead(x: number, y: number, angle: number, length: number, offset: number, color: string, radius: number) {
        var arrowX = x + length * Math.cos(angle);
        var arrowY = y + length * Math.sin(angle);
        var offsetX = offset * Math.cos(angle + Math.PI / 2);
        var offsetY = offset * Math.sin(angle + Math.PI / 2);
        this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius);
        this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius);
        this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius);
    }
    drawLabel(x: number, y: number, text: string, color: string, radius: number) {
        this.drawPoint(x, y, '#0ff', 2);
        var localZoom = this.zoom;
        var localDiff = 0;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
            y += localDiff;
        }
        this.context.fillStyle = color;
        this.context.font = `${this.fontSize * localZoom}px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        var maxLength = 24;
        var tmpLength = 0;
        var tmpText = '';
        var arrText = this.logicDisplay?.createCustomSyntax(text).split(' ');
        for (var i = 0; i < arrText!.length; i++) {
            tmpLength += arrText![i].length + 1;
            tmpText += ' ' + arrText![i];
            if (tmpLength > maxLength) {
                this.context.fillText(tmpText, (this.cOutX + x - 5) * this.zoom, (this.cOutY + y + localDiff) * this.zoom);
                y += 25 + localDiff;
                tmpLength = 0;
                tmpText = '';
            }
        }
        this.context.fillText(tmpText, (this.cOutX + x - 5) * this.zoom, (this.cOutY + y + localDiff) * this.zoom);
    }
    drawArc(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string, radius: number) {
        var firstAngle = this.getAngle(x1, y1, x2, y2);
        var secondAngle = this.getAngle(x2, y2, x3, y3);
        this.context.lineWidth = radius;
        this.context.fillStyle = color;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc((x1 + this.cOutX) * this.zoom, (y1 + this.cOutY) * this.zoom, this.getDistance(x1, y1, x2, y2) * this.zoom, firstAngle, secondAngle, false);
        this.context.stroke();
    }
    drawShape(shape: any) {
        this.drawAllComponents(shape.components, shape.x, shape.y);
        this.drawPoint(shape.x, shape.y, shape.color, shape.radius);
    }
    drawPicture(x: number, y: number, basedURL: string) {
        this.drawPoint(x, y, '#0ff', 2);
        const fallbackURL = 'put url here';
        const imageURL = (!basedURL || basedURL.trim() === '') ? fallbackURL : basedURL;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageURL;
        const width = img.naturalWidth * this.zoom || 100;
        const height = img.naturalHeight * this.zoom || 100;
        img.onerror = () => {
            img.src = fallbackURL;
        }
        this.context.drawImage(img, (x + this.cOutX) * this.zoom, (y + this.cOutY) * this.zoom, width, height);
    }
    drawTooltip() {
        this.context.shadowColor = '#000';
        this.context.shadowOffsetX = 2;
        this.context.shadowOffsetY = 2;
        this.context.fillStyle = '#fff';
        this.context.font = '12px system-ui';
        this.context.fillText(this.getTooltip(), -this.displayWidth / 2 + 10, this.displayHeight / 2 - 10);
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
            this.context.globalCompositeOperation = 'source-atop';
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
        // previously contributed by Aera23
        var mildZoom = this.zoom / 2;
        var xStart = (this.gridSpacing * mildZoom)
        var yStart = (this.gridSpacing * mildZoom)
        var numCirclesX = Math.ceil(this.displayWidth / this.gridSpacing / mildZoom) + 20;
        var numCirclesY = Math.ceil(this.displayHeight / this.gridSpacing / mildZoom) + 20;
        for (var i = 0; i < numCirclesX; i++) {
            for (var j = 0; j < numCirclesY; j++) {
                var x = xStart + (i - Math.floor(numCirclesX / 2)) * this.gridSpacing * mildZoom;
                var y = yStart + (j - Math.floor(numCirclesY / 2)) * this.gridSpacing * mildZoom;
                this.context.fillStyle = '#cccccc40'
                this.context.beginPath();
                this.context.arc(x, y, 2, 0, 2 * Math.PI);
                this.context.closePath();
                this.context.fill();
                this.context.stroke();
            }
        }
    }
    snapToGrid(x: number, y: number) {
        const gridSize = this.gridSpacing * this.zoom;
        const snappedX = Math.round(x / gridSize) * gridSize;
        const snappedY = Math.round(y / gridSize) * gridSize;
        return { x: snappedX, y: snappedY };
    }
    // now the pain in the ass
    performAction(e: any, action: number) {
        switch (this.mode) {
            case this.MODES.ADDPOINT:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add point';
                if (action = this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    }
                    this.temporaryPoints[0] = this.getCursorXLocal();
                    this.temporaryPoints[1] = this.getCursorYLocal();
                } else if (action == this.MOUSEACTION.DOWN) {
                    this.logicDisplay?.addComponent(new Point(
                        this.temporaryPoints[0],
                        this.temporaryPoints[1]
                    ));
                    this.saveState();
                    this.execute();
                }
                break;
            case this.MODES.ADDLINE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add line';
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
                } else if (action == this.MOUSEACTION.DOWN) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.LINE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.LINE) {
                        this.logicDisplay?.addComponent(new Line(
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
                break;
            case this.MODES.ADDCIRCLE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add circle';
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
                } else if (action == this.MOUSEACTION.DOWN) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.CIRCLE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.logicDisplay?.addComponent(new Circle(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1],
                            this.temporaryPoints[2],
                            this.temporaryPoints[3]
                        ));
                        this.saveState();
                        this.execute();
                    }
                }
                break;
            case this.MODES.ADDARC:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add arc';
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.ARC) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[4] = this.getCursorXLocal();
                        this.temporaryPoints[5] = this.getCursorYLocal();
                    }
                } else if (action == this.MOUSEACTION.DOWN) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.ARC;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.ARC) {
                        this.logicDisplay?.addComponent(new Arc(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1],
                            this.temporaryPoints[2],
                            this.temporaryPoints[3],
                            this.temporaryPoints[4],
                            this.temporaryPoints[5]
                        ));
                        this.saveState();
                        this.execute();
                    }
                }
                break;
            case this.MODES.ADDRECTANGLE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add rectangle';
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
                } else if (action == this.MOUSEACTION.DOWN) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.RECTANGLE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.RECTANGLE) {
                        this.logicDisplay?.addComponent(new Rectangle(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1],
                            this.temporaryPoints[2],
                            this.temporaryPoints[3]
                        ));
                        this.saveState();
                        this.execute();
                    }
                }
                break;
            case this.MODES.ADDMEASURE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add measure';
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
                } else if (action == this.MOUSEACTION.DOWN) {
                    if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryComponentType = COMPONENT_TYPES.MEASURE;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.MEASURE) {
                        this.logicDisplay?.addComponent(new Measure(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1],
                            this.temporaryPoints[2],
                            this.temporaryPoints[3]
                        ));
                        this.saveState();
                        this.execute();
                    }
                }
                break;
            case this.MODES.ADDLABEL:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add text';
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    let text = prompt('Add text...')
                    if ( text!.length > 0 ) {
                        this.logicDisplay?.addComponent(new Label(
                                this.temporaryPoints[0],
                                this.temporaryPoints[1],
                                text!));
                        this.saveState()
                        this.execute()
                        this.setMode(this.MODES.NAVIGATE)
                    }
                }
                break;
            case this.MODES.ADDSHAPE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add shape';
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.SHAPE;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.SHAPE) {
                        this.temporaryShape.x = this.getCursorXLocal();
                        this.temporaryShape.y = this.getCursorYLocal();
                    }
                } else if (action == this.MOUSEACTION.DOWN) {
                    this.logicDisplay?.addComponent(this.temporaryShape);
                    this.resetMode()
                    this.saveState()
                    this.execute()
                }
                break;
            case this.MODES.ADDPICTURE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Add picture';
                if (action == this.MOUSEACTION.MOVE) {
                    if (this.temporaryComponentType == null) {
                        this.temporaryComponentType = COMPONENT_TYPES.POINT;
                    } else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if (action == this.MOUSEACTION.DOWN) {
                    let url = prompt('Add image URL...')
                    if ( url!.length > 0 ) {
                        this.logicDisplay?.addComponent(new Picture(
                            this.temporaryPoints[0],
                            this.temporaryPoints[1],
                            url!));
                        this.saveState()
                        this.execute()
                        this.setMode(this.MODES.NAVIGATE)
                    }
                }
                break;
            case this.MODES.NAVIGATE:
                this.displayRef!.style.cursor = 'grab';
                this.tooltip = 'Navigate';
                if (action == this.MOUSEACTION.DOWN) {
                    this.camMoving = true;
                    this.xCNaught = this.getCursorXInFrame();
                    this.yCNaught = this.getCursorYInFrame();
                } else if (action == this.MOUSEACTION.UP) {
                    this.camMoving = false;
                    this.camX += this.getCursorXLocal() - this.xCNaught;
				    this.camY += this.getCursorYLocal() - this.yCNaught;
                }
                break;
            case this.MODES.MOVE:
                this.displayRef!.style.cursor = 'move';
                this.tooltip = 'Move';
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
                break;
            case this.MODES.DELETE:
                this.displayRef!.style.cursor = 'crosshair';
                this.tooltip = 'Delete';
                if (action == this.MOUSEACTION.MOVE) {
                    if ( this.selectedComponent == null ) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                                this.getCursorXLocal(),
                                this.getCursorYLocal());
                    }
                } else if ( action == this.MOUSEACTION.DOWN ) {
                    if ( this.temporarySelectedComponent != null ) {
                        this.logicDisplay?.components[this.temporarySelectedComponent].setActive(false);
                    }
                    this.saveState()
                    this.execute()
                }
                break;
        }
    }
    undo() {
        if (this.undoStack.length > 0) {
            const state = this.undoStack.pop();
            this.redoStack.push(state);
            const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
            if (lastState) {
                if (this.logicDisplay) {
                    this.logicDisplay.components = [];
                }
                this.logicDisplay?.importJSON(JSON.parse(lastState), this.logicDisplay?.components);
            } else {
                return;
            }
            this.execute();
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            const state = this.redoStack.pop();
            this.undoStack.push(state);
            const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
            if (lastState) {
                this.logicDisplay!.components = [];
                this.logicDisplay?.importJSON(JSON.parse(lastState), this.logicDisplay?.components);
            } else {
                return;
            }
            this.execute();
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
        this.cOutX = this.camX;
        this.cOutY = this.camY;
        if (this.camMoving) {
            this.cOutX += this.getCursorXLocal() - this.xCNaught;
            this.cOutY += this.getCursorYLocal() - this.yCNaught;
        }
    }
    setModeShape(shape: () => any) {
        this.setMode(this.MODES.ADDSHAPE);
        this.temporaryShape = shape();
    }
    setMode(mode: number) {
        this.resetMode();
        if (this.readOnly)
            this.mode = this.MODES.NAVIGATE;
        else
            this.mode = mode;
    }
    resetMode() {
        this.temporaryComponentType = 0;
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
    getCursorXLocal() {
        const adjustedGridSpacing = Math.max(this.gridSpacing / 2, this.gridSpacing / 2 * this.zoom / 6);
        const rawXLocal = (this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
        return Math.round(rawXLocal / adjustedGridSpacing) * adjustedGridSpacing;
    }
    getCursorYLocal() {
        const adjustedGridSpacing = Math.max(this.gridSpacing / 2, this.gridSpacing / 2 * this.zoom / 6);
        const rawYLocal = (this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
        return Math.round(rawYLocal / adjustedGridSpacing) * adjustedGridSpacing;
    }
    // lmao these functions are a duplicate
    getCursorXInFrame() {
        const adjustedGridSpacing = (this.gridSpacing / 2) * this.zoom;
	    const rawXInFrame = this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2;
	    return Math.round(rawXInFrame / adjustedGridSpacing) * adjustedGridSpacing;
    }
    getCursorYInFrame() {
        const adjustedGridSpacing = (this.gridSpacing / 2) * this.zoom;
        const rawYInFrame = this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2;
        return Math.round(rawYInFrame / adjustedGridSpacing) * adjustedGridSpacing;
    }
    setTooltip(tooltip: string) {
        this.tooltip = tooltip;
    }
    getTooltip() {
        var text = this.tooltip;
        return text + ` (${fps} FPS, dx=${Math.floor(this.getCursorXLocal())};dy=${Math.floor(this.getCursorYLocal())})`;
    }
    getDistance(x1: number, y1: number, x2: number, y2: number) {
        var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
        console.warn(this.logicDisplay!.exportJSON())
    }
    getAngle(x1: number, y1: number, x2: number, y2: number): number {
        var pi = Math.PI;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var theta = Math.atan2(dy, dx);
        var scaledAngle = theta * (3.15 / pi);
        return scaledAngle;
    }
}
export const IntializeInstance = (gd: GraphicDisplay) => {
    console.log("initialized");
    gd.init();
    document.onkeyup = (e) => {
        gd.keyboard?.onKeyUp(e);
    }
    document.onkeydown = (e) => {
        gd.keyboard?.onKeyDown(e);
    }
    console.log(gd.displayRef)
    gd.displayRef!.onmousemove = (e) => {
        gd.mouse?.onMouseMove(e);
        if (!gd.gridPointer)
            gd.gridPointer = true;
        gd.performAction(e, gd.MOUSEACTION.MOVE);
    }
    gd.displayRef!.onmouseout = (e) => {
        gd.gridPointer = false;
    }
    gd.displayRef!.onmousedown = (e) => {
        gd.mouse?.onMouseDown(e)
        gd.performAction(e, gd.MOUSEACTION.DOWN);
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