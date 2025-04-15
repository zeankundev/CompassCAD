import { 
    Component, 
    Point, 
    Measure, 
    Circle, 
    Rectangle, 
    Label, 
    Arc, 
    Shape,
    Line,
    Picture,
    componentTypes,
} from "./ComponentHandler";
import { GLView } from 'expo-gl';
import Expo2DContext from "expo-2d-context";
import { LogicDisplay } from "./LogicDisplay";
import { MouseHandler } from "./InputHandler";

class GraphicsRenderer {
    modes: {
        addPoint: number;
        addLine: number;
        addCircle: number;
        addRectangle: number;
        addArc: number;
        addMeasure: number;
        addLabel: number;
        addShape: number;
        addPicture: number;
        delete: number;
        navigate: number;
        move: number;
    };
    mouseAction: {
        move: number,
        down: number,
        up: number
    }
    readOnly: boolean;
    mode: number;
    previousColor: string | null;
    previousRadius: number | null;
    displayFont: string;
    temporarySelectedComponent: number | null;
    selectedComponent: number | null;
    temporaryComponentType: number | null;
    temporaryShape: Array<Component> | null;
    temporaryPoints: Array<number> | Array<null>;
    selectedColor: string;
    selectedRadius: number;
    logicDisplay: LogicDisplay | null;
    undoStack: string[];
    redoStack: string[];
    temporaryObjectArray: [];
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
    camMoving: boolean;
    xCNaught: number;
    yCNaught: number;
    cOutX: number;
    cOutY: number;
    showGrid: boolean;
    showOrigin: boolean;
    ONLY_IF_MOUSE_AVAILABLE_showRules: boolean;
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
    displayRef: GLView;
    glInstance: number;
    context: Expo2DContext | null;
    mouse: MouseHandler | null;
    constructor(
        displayRef: GLView,
        width: number,
        height: number,
        glInstance: number
    ) {
        this.modes = {
            addPoint: 1,
            addLine: 2,
            addCircle: 3,
            addRectangle: 4,
            addArc: 5,
            addMeasure: 6,
            addLabel: 7,
            addShape: 8,
            addPicture: 9,
            delete: 20,
            navigate: 22,
            move: 23
        }
        this.mouseAction = {
            move: 0,
            down: 1,
            up: 2
        }
        this.readOnly = false;
        this.mode = this.modes.navigate;
        this.previousColor = null;
        this.previousRadius = null;
        this.displayFont = 'monospace';
        this.temporarySelectedComponent = null;
        this.selectedComponent = null;
        this.temporaryComponentType = null;
        this.temporaryShape = null;
        this.temporaryPoints = new Array(
            null, null,
            null, null,
            null, null
        );
        this.selectedColor = '#0080ff';
        this.selectedRadius = 2;
        this.logicDisplay = null;
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
        this.zoomin = 3/2;
        this.zoomout = 2/3;
        this.currentZoom = 1;
        this.targetZoom = 1;
        this.camMoving = false;
        this.xCNaught = 0;
        this.yCNaught = 0;
        this.cOutX = 0;
        this.cOutY = 0;
        this.showGrid = true;
        this.showOrigin = false;
        this.ONLY_IF_MOUSE_AVAILABLE_showRules = true;
        this.gridPointer = false;
        this.gridSpacing = 100;
        this.conversionFactor = 1;
        this.unitName = "px";
        this.unitMeasure = "m";
        this.unitFactor = 1;
        this.unitConversionFactor = 1/100;
        this.snap = true;
        this.snapTolerance = 10;
        this.fontSize = 18;
        this.maximumStack = 50;
        this.displayRef = displayRef;
        this.glInstance = glInstance;
        this.context = null;
        this.mouse = null;
    }
    init() {
        // Should be called during onContextCreate
        this.logicDisplay = new LogicDisplay();
        this.zoom = 1;
        this.temporaryObjectArray = [];
        this.mouse = new MouseHandler();
        this.context = new Expo2DContext(this.glInstance, {
            maxGradStops: 1024,
            renderWithOffscreenBuffer: true,
            fastFillTesselation: true
        });
        this.update();
    }
    update() {
        // Runs at every frame update
        this.zoom = this.targetZoom;
        this.updateCamera();
        this.clearGrid();
        if (this.showGrid)
            this.drawGrid(this.cOutX, this.cOutY);

        if (this.showOrigin)
            this.drawOrigin(this.cOutX, this.cOutY);

        this.drawAllComponents(this.logicDisplay?.components, 0, 0);
        
        if (this.temporaryComponentType != null)
            this.drawTemporaryComponent();

        // Only necessary if the device is hooked up a mouse device
        // e.g. OTG to USB mouse or the iPad keyboard's trackpad
        this.drawRules();
    }
    saveState() {
        this.undoStack.push(JSON.stringify(this.logicDisplay?.components));
        if (this.undoStack.length > this.maximumStack) 
            this.undoStack.shift();

        this.redoStack = [];
    }
    clearGrid() {
        if (this.context) {
            this.context.restore();
            this.context.fillStyle = '#202020';
            this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
            this.context.save();

            this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
            this.context.strokeStyle = '#e9e9e9';
            this.context.lineWidth = 0.15;
        }
    }
    drawAllComponents(components: Component[], moveByX: number, moveByY: number) {
        for (let i = 0; i < components.length; i++) {
            if (!components[i].isActive())
                continue;
            this.drawComponent(components[i], moveByX, moveByY)
        }
    }
    drawComponent(component: Component, moveByX: number, moveByY: number) {
        switch (component.type) {
            case componentTypes.point:
                const point = component as Point;
                this.drawPoint(
                    point.x + moveByX,
                    point.y + moveByY,
                    point.color
                );
                break;
            case componentTypes.line:
                const line = component as Line;
                this.drawLine(
                    line.x1 + moveByX,
                    line.y1 + moveByY, 
                    line.x2 + moveByX,
                    line.y2 + moveByY,
                    line.color,
                    line.radius
                );
                break;
            case componentTypes.circle:
                const circle = component as Circle;
                this.drawCircle(
                    circle.x1 + moveByX,
                    circle.y1 + moveByY,
                    circle.x2 + moveByX,
                    circle.y2 + moveByY,
                    circle.color,
                    circle.radius
                );
                break;
            case componentTypes.rectangle:
                const rectangle = component as Rectangle;
                this.drawRectangle(
                    rectangle.x1 + moveByX,
                    rectangle.y1 + moveByY,
                    rectangle.x2 + moveByX,
                    rectangle.y2 + moveByY,
                    rectangle.color,
                    rectangle.radius
                );
                break;
            case componentTypes.measure:
                const measure = component as Measure;
                this.drawMeasure(
                    measure.x1 + moveByX,
                    measure.y1 + moveByY,
                    measure.x2 + moveByX,
                    measure.y2 + moveByY,
                    measure.color,
                    measure.radius
                );
                break;
            case componentTypes.label:
                const label = component as Label;
                this.drawLabel(
                    label.x + moveByX,
                    label.y + moveByY,
                    label.text,
                    label.color,
                    label.radius,
                    label.fontSize
                );
                break;
            case componentTypes.arc:
                const arc = component as Arc;
                this.drawArc(
                    arc.x1 + moveByX,
                    arc.y1 + moveByY,
                    arc.x2 + moveByX,
                    arc.y2 + moveByY,
                    arc.x3 + moveByX,
                    arc.y3 + moveByY,
                    arc.color,
                    arc.radius
                );
                break;
            case componentTypes.shape:
                const shape = component as Shape;
                this.drawShape(shape);
                break;
            case componentTypes.picture:
                const picture = component as Picture;
                this.drawPicture(
                    picture.x + moveByX,
                    picture.y + moveByY,
                    picture.pictureSource
                );
                break;
        }
    }
    drawPoint(x: number, y: number, color: string) {
        if (this.context) {
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
    }
    drawLine(
        x1: number,
        x2: number,
        y1: number,
        y2: number,
        color: string,
        radius: number
    ) {
        if (this.context) {
            this.context.lineWidth = radius * this.zoom;
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
    }
    drawCircle(
        x1: number,
        x2: number,
        y1: number,
        y2: number,
        color: string,
        radius: number
    ) {
        if (this.context) {
            this.context.lineWidth = radius * this.zoom;
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
    }
    drawRectangle(
        x1: number,
        x2: number,
        y1: number,
        y2: number,
        color: string,
        radius: number
    ) {
        this.drawLine(x1, y1, x2, y1, color, radius);
        this.drawLine(x2, y1, x2, y2, color, radius);
        this.drawLine(x2, y2, x1, y2, color, radius);
        this.drawLine(x1, y2, x1, y1, color, radius);
    }
    drawMeasure(
        x1: number,
        x2: number,
        y1: number,
        y2: number,
        color: string,
        radius: number
    ) {
        if (this.context) {
            let distance: number = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;
            let angle = Math.atan2(y2 - y1, x2 - x1);
            let localZoom = this.zoom;
            let localDiff = 0;
            if (this.zoom <= 0.25) {
                localZoom = 0.5;
                localDiff = 20;
            }
            const distanceText = distance.toFixed(2) + '' + this.unitMeasure;
            this.context.save();
            this.context.font = (this.fontSize * localZoom) + `px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
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
            this.context.fillText(distanceText, 0, localDiff, NaN);
            this.context.restore();
        }
    }
    drawArrowhead(
        x: number,
        y: number,
        angle: number,
        length: number,
        offset: number,
        color: string,
        radius: number
    ) {
        if (this.context) {
            var arrowX = x + length * Math.cos(angle);
            var arrowY = y + length * Math.sin(angle);
            var offsetX = offset * Math.cos(angle + Math.PI / 2);
            var offsetY = offset * Math.sin(angle + Math.PI / 2);
        
            this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius);
            this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius);
            this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius);
        }
    },
    drawLabel(
        x: number,
        y: number,
        text: string,
        color: string,
        radius?: number,
        fontSize: number
    ) {
        if (this.context) {
            this.drawPoint(x, y, '#0ff');
	
            var localZoom = this.zoom;
            var localDiff = 0;
            
            if ( this.zoom <= 0.25 ) {
                localZoom = 0.5;
                localDiff = 20;
                y += localDiff;
            }
            
            this.context.fillStyle = color;
            this.context.font =  (fontSize * localZoom) + `px ${this.displayFont}, monospace`;
            
            var maxLength = 24; // 24 Characters per row
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
    }
}