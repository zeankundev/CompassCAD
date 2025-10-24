import { read } from "fs";
import { Circle, Component, componentTypes, Line, Measure, Point, Rectangle, Shape, Label, Arc, Picture, Polygon, BoundBox } from "./ComponentHandler";
import { KeyboardHandler, MouseHandler } from "./InputHandler";
import { LogicDisplay } from "./LogicDisplay";
import DefaultCursor from '../assets/cursors/normal.svg'
import CrosshairCursor from '../assets/cursors/crosshair.svg'
import MoveCursor from '../assets/cursors/move.svg'
import NavigateDragCursor from '../assets/cursors/navigate-drag.svg'
import NavigateIdleCursor from '../assets/cursors/navigate-idle.svg'
import Nwse1 from '../assets/cursors/nwse-1.svg'
import Nwse2 from '../assets/cursors/nwse-2.svg'

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

export interface GenericDefiner {
    [key: string]: number;
}

export interface HandleProperties {
    x: number;
    y: number;
    id: string,
    cursor: string
}
export interface VectorType {
    x: number;
    y: number;
}

export const _num2hex = (value: number) => {
    const clampedNum = Math.max(0, Math.min(100, value));
    const scaledValue = Math.round(clampedNum * 2.55);
    let hexString = scaledValue.toString(16);
    hexString = hexString.padStart(2, '0');
    return hexString.toUpperCase();
}

export class GraphicsRenderer {
    modes: GenericDefiner;
    mouseAction: GenericDefiner;
    readonly: boolean;
    mode: number;
    previousColor: string | null;
    previousRadius: number | null;
    displayFont: string;
    temporarySelectedComponent: number | null;
    selectedComponent: number | null;
    temporaryComponentType: number | null;
    temporaryShape: Shape | null;
    temporaryPoints: number[] | null[];
    selectedColor: string;
    selectedRadius: number;
    logicDisplay: LogicDisplay | null;
    undoStack: string[];
    redoStack: string[];
    temporaryObjectArray: any[];
    temporaryVectors: VectorType[];
    temporaryVectorIndex: number;
    imageCache: { [key: string]: any };
    displayWidth: number;
    displayHeight: number;
    offsetX: number;
    offsetY: number;
    camX: number;
    camY: number;
    zoom: number;
    zoomIn: number;
    zoomOut: number;
    currentZoom: number;
    targetZoom: number;
    zoomSpeed: number;
    camMoving: boolean;
    xCNaught: number;
    yCNaught: number;
    cOutX: number;
    cOutY: number;
    recordingMode: boolean;
    showGrid: boolean;
    showOrigin: boolean;
    showRules: boolean;
    gridPointer: boolean;
    gridSpacing: number;
    conversionFactor: number;
    unitFactor: number;
    unitConversionFactor: number;
    unitName: string;
    unitMeasure: string;
    snap: boolean;
    snapTolerance: number;
    fontSize: number;
    maximumStack: number;
    displayRef: HTMLCanvasElement | null;
    context: CanvasRenderingContext2D | null;
    defaultTooltip: string;
    tooltip: string;
    keyboard: KeyboardHandler | null;
    mouse: MouseHandler | null;
    handles: HandleProperties[];
    dragHandle: string | null;
    lastSelectedComponent: number| null;

    constructor(
        displayRef: HTMLCanvasElement | null,
        width: number,
        height: number
    ) {
        this.modes = {
            AddPoint: 1,
            AddLine: 2,
            AddCircle: 3,
            AddRectangle: 4,
            AddArc: 5,
            AddMeasure: 6,
            AddLabel: 7,
            AddShape: 8,
            AddPicture: 9,
            AddPolygon: 10,
            AddBoundbox: 11,
            Delete: 20,
            Navigate: 22,
            Move: 23,
            Select: 25
        }
        this.mouseAction = {
            Move: 0,
            Down: 1,
            Up: 2
        }
        this.readonly = false;
        this.mode = this.modes.Select;
        this.previousColor = null;
        this.previousRadius = null;
        this.displayFont = 'Geist Mono';
        this.temporarySelectedComponent = null;
        this.selectedComponent = null;
        this.temporaryComponentType = null;
        this.temporaryShape = null;
        this.temporaryPoints = [
            null, null,
            null, null,
            null, null
        ]
        this.selectedColor = '#0080ff';
        this.selectedRadius = 2;
        this.undoStack = [];
        this.redoStack = [];
        this.temporaryObjectArray = [];
        this.temporaryVectorIndex = 0;
        this.temporaryVectors = [];
        this.imageCache = {};
        this.displayWidth = width;
        this.displayHeight = height;
        this.offsetX = 0;
        this.offsetY = 0;
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;
        this.zoomIn = 3 / 2;
        this.zoomOut = 2 / 3;
        this.currentZoom = 1;
        this.targetZoom = 1;
        this.zoomSpeed = 0.05;
        this.camMoving = false;
        this.xCNaught = 0;
        this.yCNaught = 0;
        this.cOutX = 0;
        this.cOutY = 0;
        this.showGrid = true;
        this.showOrigin = false;
        this.showRules = true;
        this.gridPointer = false;
        this.gridSpacing = 100;
        this.conversionFactor = 1;
        this.unitName = "px";
        this.unitMeasure = "m";
        this.unitFactor = 1;
        this.unitConversionFactor = 1 / 100;
        this.snap = true;
        this.recordingMode = false;
        this.snapTolerance = 10;
        this.fontSize = 18;
        this.maximumStack = 50;
        this.displayRef = displayRef != null ? displayRef : null;
        this.defaultTooltip = 'CompassCAD';
        this.tooltip = this.defaultTooltip;
        this.keyboard = null;
        this.mouse = null;
        this.context = null;
        this.logicDisplay = null;
        this.handles = [];
        this.dragHandle = '';
        this.lastSelectedComponent = null;
    }

    start() {
        this.logicDisplay = new LogicDisplay();
        this.zoom = 1;
        this.temporaryObjectArray = [];
        this.keyboard = new KeyboardHandler();
        this.mouse = new MouseHandler();
        this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
        const context = this.displayRef?.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context');
        }
        this.context = context;
    }
    refreshSelectionTools() {
        if (this.selectedComponent !== null && this.logicDisplay?.components[this.selectedComponent]) {
            this.drawComponentSize(this.logicDisplay?.components[this.selectedComponent]);
            const selectedComponent: Component = this.logicDisplay?.components[this.selectedComponent];
            const handles = this.getComponentHandles(selectedComponent);
            for (const handle of handles) {
                this.drawPoint(handle.x, handle.y, '#fff', 2, 100);
            }
        }
    }
    drawComponentSize(component: Component) {
        if (!component || !component.type) return;
        let displayText = '';
        switch (component.type) {
            case componentTypes.rectangle:
            case componentTypes.boundBox:
            case componentTypes.line:
                const line = component as Line;
                displayText = `${Number(Math.abs(line.x2 - line.x1).toFixed(2))}×${Number(Math.abs(line.y2 - line.y1).toFixed(2))}`;
                break;
            case componentTypes.measure:
                const measure = component as Measure;
                displayText = `L: ${Number(Math.abs(measure.x2 - measure.x1).toFixed(2))} (${Number(this.getDistance(measure.x1, measure.y1, measure.x2, measure.y2) / 100).toFixed(2)}m)`;
                break;
            case componentTypes.circle:
                const circle = component as Circle;
                displayText = `RAD: ${Number(Math.abs(this.getDistance(circle.x1, circle.y1, circle.x2, circle.y2)).toFixed(2))}`;
                break;
            case componentTypes.arc:
                const arc = component as Arc;
                displayText = `RAD: ${Number(Math.abs(this.getDistance(arc.x1, arc.y1, arc.x2, arc.y2)).toFixed(2))}, COV: ${Math.round((Number(Math.abs(this.getAngle(arc.x1, arc.y1, arc.x3, arc.y3)).toFixed(2)) / Math.PI) * 180)}°`;
                break;
            default:
                return;
        }
        if (this.context) {
            this.context.font = `18px 'Radio Canada Big', sans-serif`;
            const textWidth = this.context.measureText(displayText).width;
            const boxWidth = textWidth + 20;
            const dummyLine = component as Line;
            const boxX = (((dummyLine.x2 - dummyLine.x1) / 2 + dummyLine.x1) + this.cOutX) * this.zoom - (boxWidth/2);
	        const boxY = ((dummyLine.y2 + this.cOutY) * this.zoom) + 7.5;
            this.context.fillStyle = this.selectedColor;
            this.context.beginPath();
            this.context.roundRect(boxX, boxY, boxWidth, 25, 5);
            this.context.fill();
            this.context.closePath();
            this.context.fillStyle = '#fff';
            this.context.textBaseline = 'middle';
            this.context.textAlign = 'center';
            const secondDummyLine = component as Line;
            this.context.fillText(
                displayText,
                (((secondDummyLine.x2 - secondDummyLine.x1) / 2 + secondDummyLine.x1) + this.cOutX) * this.zoom,
                boxY + 15
            );
        }
    }
    getComponentHandles(component: Component) {
        if (this.selectedComponent != null) {
            switch (component.type) {
                case componentTypes.rectangle:
                case componentTypes.boundBox:
                    this.handles = []
                    const rect = component as Rectangle;
                    this.handles.push({
                        x: rect.x1,
                        y: rect.y1,
                        id: 'start',
                        cursor: Nwse1
                    })
                    this.handles.push({
                        x: rect.x2,
                        y: rect.y1,
                        id: 'top-right',
                        cursor: Nwse2
                    })
                    this.handles.push({
                        x: rect.x2,
                        y: rect.y2,
                        id: 'bottom-right',
                        cursor: Nwse1
                    })
                    this.handles.push({
                        x: rect.x1,
                        y: rect.y2,
                        id: 'bottom-left',
                        cursor: Nwse2
                    })
                    break;
                case componentTypes.line:
                case componentTypes.measure:
                case componentTypes.circle:
                    this.handles = []
                    const lineComponent = component as Line;
                    this.handles.push({
                        x: lineComponent.x1,
                        y: lineComponent.y1,
                        id: 'start',
                        cursor: MoveCursor
                    });
                    this.handles.push({
                        x: lineComponent.x2,
                        y: lineComponent.y2,
                        id: 'end',
                        cursor: MoveCursor
                    });
                    break;
                case componentTypes.arc:
                    this.handles = []
                    const arcComponent = component as Arc;
                    this.handles.push({
                        x: arcComponent.x1,
                        y: arcComponent.y1,
                        id: 'start',
                        cursor: Nwse1
                    });
                    this.handles.push({
                        x: arcComponent.x2,
                        y: arcComponent.y2,
                        id: 'mid',
                        cursor: Nwse2
                    });
                    this.handles.push({
                        x: arcComponent.x3,
                        y: arcComponent.y3,
                        id: 'end',
                        cursor: MoveCursor
                    });
                    break;
                case componentTypes.point:
                case componentTypes.label:
                case componentTypes.picture:
                case componentTypes.shape:
                    this.handles = []
                    const singlePointComponent = component as Point;
                    this.handles.push({
                        x: singlePointComponent.x,
                        y: singlePointComponent.y,
                        id: 'miscellaneous',
                        cursor: MoveCursor
                    });
                    break;
                case componentTypes.polygon:
                    this.handles = [];
                    this.handles.length = 0;
                    const polygonComponent = component as Polygon;
                    polygonComponent.vectors.forEach((polygonHandle, index) => {
                        this.handles.push({
                            x: polygonHandle.x,
                            y: polygonHandle.y,
                            id: `handle-${index}`,
                            cursor: MoveCursor
                        });
                    });
                    break;
            }
        }
        return this.handles;
    }
    getCursorXRaw() {
        return Math.floor(this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
    }
    getCursorYRaw() {
        return Math.floor(this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
    }
    getCursorXLocal(): number {
        const baseGridSpacing = this.gridSpacing;
        const rawXLocal = (this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;

        if (!this.snap) {
            return rawXLocal;
        }

        return Math.round(rawXLocal / baseGridSpacing) * baseGridSpacing;
    }

    getCursorYLocal(): number {
        const baseGridSpacing = this.gridSpacing;
        const rawYLocal = (this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;

        if (!this.snap) {
            return rawYLocal;
        }

        return Math.round(rawYLocal / baseGridSpacing) * baseGridSpacing;
    }

    getCursorXInFrame(): number {
        const screenX = this.mouse!.cursorXGlobal - this.offsetX - this.displayWidth / 2;
        const worldX = (screenX / this.zoom) - this.cOutX;

        if (!this.snap) {
            // If snapping is off, return the raw value converted to frame coordinates.
            return (worldX + this.cOutX) * this.zoom;
        }

        // If snapping is on, perform the snapping calculation as before.
        const gridSize = this.gridSpacing;
        const snappedX = Math.round(worldX / gridSize) * gridSize;
        return (snappedX + this.cOutX) * this.zoom;
    }

    getCursorYInFrame(): number {
        const screenY = this.mouse!.cursorYGlobal - this.offsetY - this.displayHeight / 2;
        const worldY = (screenY / this.zoom) - this.cOutY;

        if (!this.snap) {
            // If snapping is off, return the raw value converted to frame coordinates.
            return (worldY + this.cOutY) * this.zoom;
        }

        // If snapping is on, perform the snapping calculation as before.
        const gridSize = this.gridSpacing;
        const snappedY = Math.round(worldY / gridSize) * gridSize;
        return (snappedY + this.cOutY) * this.zoom;
    }
    updateCamera() {
        this.cOutX = this.camX;
        this.cOutY = this.camY;
        if (this.camMoving) {
            this.cOutX += this.getCursorXRaw() - this.xCNaught;
            this.cOutY += this.getCursorYRaw() - this.yCNaught;
        }
    }
    saveState() {
        console.log('[renderer] saving state')
        this.undoStack.push(JSON.stringify(this.logicDisplay?.components));
        console.log(this.undoStack)
        if (this.undoStack.length > this.maximumStack) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        if (this.onComponentArrayChanged) {
            console.log('[renderer] array changed defined, firing')
            this.onComponentArrayChanged();
        }
    }
    getDistance(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    getAngle(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ) {
        var PI = Math.PI;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var theta = Math.atan2(dy, dx);
        var scaledAngle = theta * (3.15 / PI);
        return scaledAngle;
    }
    drawAllComponents(
        components: Component[],
        moveByX: number,
        moveByY: number
    ) {
        for (let i = 0; i < components.length; i++) {
            if (components[i].active == false)
                continue;

            this.drawComponent(components[i], moveByX, moveByY)
        }
    }
    drawComponent(
        component: Component,
        moveByX: number,
        moveByY: number
    ) {
        switch (component.type) {
            case componentTypes.point:
                const p = component as Point;
                this.drawPoint(
                    p.x + moveByX,
                    p.y + moveByY,
                    p.color,
                    p.radius,
                    p.opacity
                )
                break;
            case componentTypes.line:
                const l = component as Line;
                this.drawLine(
                    l.x1 + moveByX,
                    l.y1 + moveByY,
                    l.x2 + moveByX,
                    l.y2 + moveByY,
                    l.color,
                    l.radius,
                    l.opacity
                )
                break;
            case componentTypes.circle:
                const c = component as Circle;
                this.drawCircle(
                    c.x1 + moveByX,
                    c.y1 + moveByY,
                    c.x2 + moveByX,
                    c.y2 + moveByY,
                    c.color,
                    c.radius,
                    c.opacity);
                break;
            case componentTypes.rectangle:
                const r = component as Rectangle;
                this.drawRectangle(
                    r.x1 + moveByX,
                    r.y1 + moveByY,
                    r.x2 + moveByX,
                    r.y2 + moveByY,
                    r.color,
                    r.radius,
                    r.opacity);
                break;
            case componentTypes.measure:
                const m = component as Measure;
                this.drawMeasure(
                    m.x1 + moveByX,
                    m.y1 + moveByY,
                    m.x2 + moveByX,
                    m.y2 + moveByY,
                    m.color,
                    m.radius,
                    m.opacity
                )
                break;
            case componentTypes.label:
                const label = component as Label;
                this.drawLabel(
                    label.x + moveByX,
                    label.y + moveByY,
                    label.text,
                    label.color,
                    label.fontSize,
                    label.opacity
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
                    arc.radius,
                    arc.opacity
                );
                break;
            case componentTypes.shape:
                const shape = component as Shape;
                this.drawShape(shape);
                break;
            case componentTypes.picture:
                const pic = component as Picture;
                this.drawPicture(
                    pic.x + moveByX,
                    pic.y + moveByY,
                    pic.pictureSource,
                    pic.opacity
                );
                break;
            case componentTypes.polygon:
                const polygon = component as Polygon;
                this.drawPolygon(
                    polygon.vectors,
                    polygon.color,
                    polygon.strokeColor,
                    polygon.radius,
                    polygon.opacity,
                    polygon.enableStroke
                )
                break;
            case componentTypes.boundBox:
                const boundbox = component as BoundBox;
                this.drawRectangle(
                    boundbox.x1,
                    boundbox.y1,
                    boundbox.x2,
                    boundbox.y2,
                    '#e9e9e9',
                    2,
                    50
                )
        }
    }
    drawTemporaryComponent() {
        switch (this.temporaryComponentType) {
            case componentTypes.point:
                this.drawPoint(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.line:
                this.drawLine(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.circle:
                this.drawCircle(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                this.drawMeasure(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.rectangle:
                this.drawRectangle(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                this.drawMeasure(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                this.drawMeasure(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[1]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                this.drawMeasure(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.measure:
                this.drawMeasure(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.arc:
                console.log(`temporary points: ${this.temporaryPoints[0]}`)
                this.drawArc(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.temporaryPoints[2]!,
                    this.temporaryPoints[3]!,
                    this.temporaryPoints[4]!,
                    this.temporaryPoints[5]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.shape:
                if (this.temporaryShape) {
                    this.drawShape(this.temporaryShape);
                }
                break;
            case componentTypes.picture:
                this.drawPoint(
                    this.temporaryPoints[0]!,
                    this.temporaryPoints[1]!,
                    this.selectedColor,
                    this.selectedRadius,
                    100);
                break;
            case componentTypes.polygon:
                this.drawPolygon(
                    [...this.temporaryVectors, {x: this.getCursorXLocal(), y: this.getCursorYLocal()}],
                    this.selectedColor,
                    '#ffffff',
                    this.selectedRadius,
                    100,
                    true,
                )
                break;
        }
    }
    drawUserCursor(x: number, y: number) {
        const mouseShapeVectors: VectorType[] = [
            {
                x: 0,
                y: 0
            },
            {
                x: 4,
                y: 16
            },
            {
                x: 8,
                y: 10
            },
            {
                x: 15,
                y: 8
            },
            {
                x: 0,
                y: 0
            }
        ];
        this.context?.beginPath();
        this.context?.moveTo(x + mouseShapeVectors[0].x, y + mouseShapeVectors[0].y);
        mouseShapeVectors.forEach((point, index) => {
            if (index > 0) {
            this.context?.lineTo(x + point.x, y + point.y);
        }
    });
    this.context?.closePath();
    this.context!.fillStyle = '#0080ff';
    this.context?.fill();

    this.context!.strokeStyle = '#e9e9e9';
    this.context!.lineWidth = 1;
    this.context?.stroke();
    }
    drawPoint(x: number, y: number, color: string, radius: number, opacity: number) {
        if (this.context) {
            if (this.selectedComponent != null || this.mode == this.modes.Move) {
                this.context.lineWidth = 2;
                this.context.fillStyle = '#ffffff';
                this.context.strokeStyle = this.selectedColor;
                this.context.beginPath();
                this.context.rect(
                    (x + this.cOutX) * this.zoom - 4,
                    (y + this.cOutY) * this.zoom - 4,
                    8,
                    8
                )
                this.context.closePath();
                this.context.fill();
                this.context.stroke();
            } else {
                this.context.lineWidth = 3 * this.zoom;
                this.context.fillStyle = color + _num2hex(opacity);
                this.context.strokeStyle = color + _num2hex(opacity);
                this.context.beginPath();
                this.context.arc(
                    (x + this.cOutX) * this.zoom,
                    (y + this.cOutY) * this.zoom,
                    2 * this.zoom, 0, 3.14159 * 2, false);
                this.context.closePath();
                this.context.stroke();
            }
        }
    }
    drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        if (this.context) {
            this.context.lineWidth = radius * this.zoom;
            this.context.fillStyle = color + _num2hex(opacity);
            this.context.strokeStyle = color + _num2hex(opacity);
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
        y1: number,
        x2: number,
        y2: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        if (this.context) {
            this.context.lineWidth = radius * this.zoom;
            this.context.fillStyle = color + _num2hex(opacity);
            this.context.strokeStyle = color + _num2hex(opacity);
            this.context.beginPath();
            this.context.arc(
                (x1 + this.cOutX) * this.zoom,
                (y1 + this.cOutY) * this.zoom,
                this.getDistance(x1, y1, x2, y2) * this.zoom,
                0, 3.14159 * 2, false);
            this.context.closePath();
            this.context.stroke();
        }
    }
    drawRectangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        this.drawLine(x1, y1, x2, y1, color, radius, opacity);
        this.drawLine(x2, y1, x2, y2, color, radius, opacity);
        this.drawLine(x2, y2, x1, y2, color, radius, opacity);
        this.drawLine(x1, y2, x1, y1, color, radius, opacity);
    }
    drawArrowhead(
        x: number,
        y: number,
        angle: number,
        length: number,
        offset: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        var arrowX = x + length * Math.cos(angle);
        var arrowY = y + length * Math.sin(angle);
        var offsetX = offset * Math.cos(angle + Math.PI / 2);
        var offsetY = offset * Math.sin(angle + Math.PI / 2);

        this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius, opacity);
        this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
        this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
    }
    drawMeasure(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        let distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;
        let angle = Math.atan2(y2 - y1, x2 - x1);
        var defaultArrowLength = 25;
        var arrowOffset = 5;
        let arrowLength = defaultArrowLength;
        let localZoom = this.zoom;
        let localDiff = 0;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
        }
        const distanceText = distance.toFixed(2) + "" + this.unitMeasure;
        this.context?.save();
        this.context!.font = (this.fontSize * localZoom) + `px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        const textWidth: number = this.context?.measureText(distanceText).width ?? 0;
        this.context?.restore();
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

            this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius, opacity);
            this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius, opacity);
        }
        this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, radius, opacity);
        this.drawArrowhead(x2, y2, angle, -arrowLength, arrowOffset, color, radius, opacity);
        this.context?.save();
        this.context?.translate((midX * this.zoom) + this.cOutX * this.zoom, ((midY * this.zoom) + (textOffsetY * 2)) + this.cOutY * this.zoom);
        this.context?.rotate(angle);
        this.context!.textAlign = 'center';
        this.context!.textBaseline = isShortDistance ? 'top' : 'middle';
        this.context!.fillStyle = color + _num2hex(opacity!);
        this.context!.font = (this.fontSize * localZoom) + `px ${this.displayFont}, Consolas, DejaVu Sans Mono, monospace`;
        this.context?.fillText(distanceText, 0, localDiff);
        this.context?.restore();
    }
    drawLabel(
        x: number,
        y: number,
        text: string,
        color: string,
        fontSize: number,
        opacity: number,
    ) {
        if (this.context) {
            this.drawPoint(x, y, '#0ff', 2, opacity);

            var localZoom = this.zoom;
            var localDiff = 0;

            if (this.zoom <= 0.25) {
                localZoom = 0.5;
                localDiff = 20;
                y += localDiff;
            }

            this.context.fillStyle = color + _num2hex(opacity);
            this.context.font = (fontSize * localZoom) + `px ${this.displayFont}, monospace, 'SECEmojis'`;

            var maxLength = 24; // 24 Characters per row
            var tmpLength = 0;
            var tmpText = "";
            var arrText = text.split(" ");

            for (var i = 0; i < arrText.length; i++) {
                tmpLength += arrText[i].length + 1;
                tmpText += " " + arrText[i];

                if (tmpLength > maxLength) {
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
    drawArc(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        color: string,
        radius: number,
        opacity: number
    ) {
        if (this.context) {
            var firstAngle = this.getAngle(x1, y1, x2, y2);
            var secondAngle = this.getAngle(x1, y1, x3, y3);

            this.context.lineWidth = radius * this.zoom;
            this.context.fillStyle = color + _num2hex(opacity);
            this.context.strokeStyle = color + _num2hex(opacity);
            this.context.beginPath();
            this.context.arc(
                (x1 + this.cOutX) * this.zoom,
                (y1 + this.cOutY) * this.zoom,
                this.getDistance(x1, y1, x2, y2) * this.zoom,
                firstAngle, secondAngle, false);
            this.context.stroke();
        }
    }
    drawShape(shape: Shape) {
        this.drawAllComponents(shape.components, shape.x, shape.y);
        this.drawPoint(shape.x, shape.y, shape.color, shape.radius, shape.opacity);
    }
    drawPicture(
        x: number,
        y: number,
        basedURL: string,
        opacity: number
    ) {
        this.drawPoint(x, y, '#00ffff', 2, opacity);
        if (!this.imageCache[basedURL]) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = basedURL;
            img.onerror = () => {
                this.imageCache[basedURL] = 'ERROR'; // Use a specific error marker
            };
            img.onload = () => {
                this.imageCache[basedURL] = img;
                this.renderImage(x, y, img, opacity);
            };
        } else {
            // Check if cached value is an error marker
            if (this.imageCache[basedURL] === 'ERROR') {
                this.renderImage(x, y, null, opacity); // Pass null to trigger error shape
            } else {
                this.renderImage(x, y, this.imageCache[basedURL], opacity);
            }
        }
    }

    renderImage(
        x: number,
        y: number,
        img: HTMLImageElement | null, // Update type to include null
        opacity: number
    ) {
        // Check for both null and empty string, or use falsy check
        if (!img || img === null) {
            const errorShape: Shape = {
                components: [
                    new Circle(0, 0, 10, 10, 2, '#ff0000', opacity),
                    new Line(-7, -7, 7, 7, 2, '#ff0000', opacity),
                    new Line(-7, 7, 7, -7, 2, '#ff0000', opacity),
                    new Label(17, 6, "Image Error", this.fontSize, opacity)
                ],
                x: x,
                y: y,
                color: '#ffffff',
                radius: 2,
                opacity: opacity,
                active: true,
                name: 'Error shape shit',
                type: componentTypes.shape,
                addComponent: function (component: Component) {
                    this.components.push(component);
                }
            }
            this.drawShape(errorShape);
            return;
        }
        const width = img.naturalWidth * this.zoom || 100;
        const height = img.naturalHeight * this.zoom || 100;
        if (this.context) {
            this.context.globalAlpha = opacity / 100;
            this.context.drawImage(
                img,
                (x + this.cOutX) * this.zoom,
                (y + this.cOutY) * this.zoom,
                width,
                height
            );
            this.context.globalAlpha = 1;
        }
    }
    drawPolygon(
        vectors: VectorType[],
        fillColor: string,
        strokeColor: string,
        radius: number,
        opacity: number,
        enableStroke: boolean
    ) {
        if (vectors.length < 2) return;
        this.context!.lineWidth = radius * this.zoom;
        this.context!.globalAlpha = opacity / 100;
        this.context!.fillStyle = fillColor;
        this.context!.strokeStyle = strokeColor;
        this.context!.beginPath();
        this.context!.moveTo(
            (vectors[0].x + this.cOutX) * this.zoom,
            (vectors[0].y + this.cOutY) * this.zoom
        );
        for (let i = 1; i < vectors.length; i++) {
            this.context!.lineTo(
                (vectors[i].x + this.cOutX) * this.zoom,
                (vectors[i].y + this.cOutY) * this.zoom
            );
        }
        this.context!.closePath();
        this.context!.fill();
        if (enableStroke) {
            this.context!.stroke();
        }
        this.context!.globalAlpha = 1;
    }
    drawOrigin(cx: number, cy: number) {
        if (this.context) {
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
    }
    drawRules() {
        if (this.context) {
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
    }
    drawGrid(camXoff: number, camYoff: number) {
        const gridSpacingAdjusted = this.gridSpacing * this.zoom;
        let densityDivisor;
        if (this.gridSpacing < 5) {
            if (this.zoom <= 1) {
                densityDivisor = 50;
            } else if (this.zoom <= 2) {
                densityDivisor = 25;
            } else {
                densityDivisor = 20;
            }
        }
        else if (this.gridSpacing < 10) {
            if (this.zoom < 1) {
                densityDivisor = 6;
            } else if (this.zoom <= 2) {
                densityDivisor = 3;
            } else {
                densityDivisor = 1;
            }
        }
        else if (this.gridSpacing < 20) {
            if (this.zoom < 1) {
                densityDivisor = 3;
            } else {
                densityDivisor = 1.5;
            }
        }
        else if (this.gridSpacing < 50) {
            if (this.zoom < 1) densityDivisor = 2;
            else densityDivisor = 1;
        }
        else {
            if (this.zoom < 1) {
                densityDivisor = 2
            } else {
                densityDivisor = 1;
            }
        }
        const effectiveSpacing = gridSpacingAdjusted * densityDivisor;
        const leftBound = -this.displayWidth / 2;
        const rightBound = this.displayWidth / 2;
        const topBound = -this.displayHeight / 2;
        const bottomBound = this.displayHeight / 2;
        const startX = Math.floor((leftBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const startY = Math.floor((topBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const endX = Math.ceil((rightBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        const endY = Math.ceil((bottomBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
        this.context!.fillStyle = "#cccccc75";
        for (let x = startX; x <= endX; x += effectiveSpacing) {
            for (let y = startY; y <= endY; y += effectiveSpacing) {
                this.context?.beginPath();
                const adjustedX = x + camXoff * this.zoom;
                const adjustedY = y + camYoff * this.zoom;
                this.context?.arc(adjustedX, adjustedY, 1, 0, Math.PI * 2);
                this.context?.fill();
            }
        }
    }
    moveComponent(index: number, x: number, y: number) {
        if (index !== null && this.logicDisplay) {
            const component = this.logicDisplay.components[index];

            switch (component.type) {
                case componentTypes.point:
                case componentTypes.label:
                case componentTypes.picture:
                case componentTypes.shape:
                    const singlePointComponent = component as Point | Label | Picture | Shape;
                    const dx = x - singlePointComponent.x;
                    const dy = y - singlePointComponent.y;
                    singlePointComponent.x += dx;
                    singlePointComponent.y += dy;
                    break;

                case componentTypes.line:
                case componentTypes.circle:
                case componentTypes.rectangle:
                case componentTypes.boundBox:
                case componentTypes.measure:
                    const twoPointComponent = component as Line | Circle | Rectangle | Measure;
                    const dx2 = x - twoPointComponent.x1;
                    const dy2 = y - twoPointComponent.y1;
                    twoPointComponent.x1 += dx2;
                    twoPointComponent.y1 += dy2;
                    twoPointComponent.x2 += dx2;
                    twoPointComponent.y2 += dy2;
                    break;

                case componentTypes.arc:
                    const arc = component as Arc;
                    const dx3 = x - arc.x1;
                    const dy3 = y - arc.y1;
                    arc.x1 += dx3;
                    arc.y1 += dy3;
                    arc.x2 += dx3;
                    arc.y2 += dy3;
                    arc.x3 += dx3;
                    arc.y3 += dy3;
                    break;
            }
        }
    }
    selectComponent(index: number) {
        this.selectedComponent = index;
        if (index != null) {
            this.selectedComponent = index;
            if (this.mode === this.modes.Move) {
                this.previousColor = this.logicDisplay!.components[index].color;
                this.previousRadius = this.logicDisplay!.components[index].radius;
                this.logicDisplay!.components[index].color = this.selectedColor;
                this.logicDisplay!.components[index].radius = this.selectedRadius;
            }
        }
    }
    unselectComponent() {
        if (this.selectedComponent != null) {
            if (this.mode === this.modes.Move && this.previousColor) {
                this.logicDisplay!.components[this.selectedComponent].color = this.previousColor;
                if (this.previousRadius !== null) {
                    this.logicDisplay!.components[this.selectedComponent].radius = this.previousRadius;
                }
                this.previousColor = null;
                this.previousRadius = null;
            }
            this.selectedComponent = null;
        }
    }
    resetMode() {
        this.temporaryComponentType = null;
        this.temporaryShape = null;

        for (var i = 0; i < this.temporaryPoints.length; i++)
            delete this.temporaryPoints[i];

        this.mode = -1;
        this.tooltip = this.defaultTooltip;
    }
    setMode(mode: number) {
        this.unselectComponent();
        this.resetMode();

        if (this.readonly)
            this.mode = this.modes.Navigate;
        else
            this.mode = mode;
    }
    setModeShape(getShape: () => Shape) {
        this.setMode(this.modes.AddShape);
        this.temporaryShape = getShape();
    }
    findIntersectionWith(x: number, y: number) {
        if (!this.logicDisplay) return null;

        // Track all intersections with their distances
        interface Intersection {
            index: number;
            distance: number; 
            type: number;
            pointType: string;
        }

        const intersections: Intersection[] = [];
        const snapBox = this.snapTolerance / this.zoom;

        // First pass: collect all intersections
        for (let i = this.logicDisplay.components.length - 1; i >= 0; i--) {
            if (this.logicDisplay.components[i].active == false) continue;

            // Calculate intersection data 
            const intersection = this.calculateIntersection(i, x, y);
            if (intersection) {
                intersections.push({
                    index: i,
                    distance: intersection.distance,
                    type: this.logicDisplay.components[i].type,
                    pointType: intersection.pointType
                });
            }
        }

        // If no intersections found, return null
        if (intersections.length === 0) return null;

        // Sort intersections by priority rules
        return this.getPrioritizedIntersection(intersections);
    }

    private calculateIntersection(index: number, x: number, y: number): {distance: number, pointType: string} | null {
        const component = this.logicDisplay!.components[index];
        const tolerance = this.snapTolerance / this.zoom;

        switch (component.type) {
            case componentTypes.point:
            case componentTypes.label: 
            case componentTypes.picture:
            case componentTypes.shape:
                const pointComponent = component as Point;
                const delta = this.getDistance(x, y, pointComponent.x, pointComponent.y);
                if (delta <= tolerance) {
                    return { distance: delta, pointType: 'center' };
                }
                break;

            case componentTypes.line:
            case componentTypes.circle:
            case componentTypes.measure:
                const lineComponent = component as Line;
                const delta1 = this.getDistance(x, y, lineComponent.x1, lineComponent.y1);
                const delta2 = this.getDistance(x, y, lineComponent.x2, lineComponent.y2);
                if (delta1 <= tolerance || delta2 <= tolerance) {
                    return {
                        distance: Math.min(delta1, delta2),
                        pointType: delta1 < delta2 ? 'start' : 'end'
                    };
                }
                break;

            case componentTypes.rectangle:
            case componentTypes.boundBox:
                const rectComponent = component as Rectangle;
                // Check all 4 corners of rectangle
                const nw = this.getDistance(x, y, rectComponent.x1, rectComponent.y1);
                const ne = this.getDistance(x, y, rectComponent.x2, rectComponent.y1);
                const sw = this.getDistance(x, y, rectComponent.x1, rectComponent.y2);
                const se = this.getDistance(x, y, rectComponent.x2, rectComponent.y2);
                
                const minDist = Math.min(nw, ne, sw, se);
                if (minDist <= tolerance) {
                    let pointType;
                    if (minDist === nw) pointType = 'nw';
                    else if (minDist === ne) pointType = 'ne';
                    else if (minDist === sw) pointType = 'sw';
                    else pointType = 'se';
                    
                    return {
                        distance: minDist,
                        pointType: pointType
                    };
                }
                break;

            case componentTypes.arc:
                const arcComponent = component as Arc;
                const deltaCenter = this.getDistance(x, y, arcComponent.x1, arcComponent.y1);
                const deltaStart = this.getDistance(x, y, arcComponent.x2, arcComponent.y2);
                const deltaEnd = this.getDistance(x, y, arcComponent.x3, arcComponent.y3);
                
                if (deltaCenter <= tolerance || deltaStart <= tolerance || deltaEnd <= tolerance) {
                    const minDelta = Math.min(deltaCenter, deltaStart, deltaEnd);
                    return {
                        distance: minDelta,
                        pointType: minDelta === deltaCenter ? 'center' : 
                                  minDelta === deltaStart ? 'start' : 'end'
                    };
                }
                break;
            case componentTypes.polygon:
                const polygonComponent = component as Polygon;
                for (let i = 0; i < polygonComponent.vectors.length; i++) {
                    const vector = polygonComponent.vectors[i];
                    const delta = this.getDistance(x, y, vector.x, vector.y);
                    if (delta <= tolerance) {
                        return { distance: delta, pointType: 'vector-' + i };
                    }
                }
        }
        return null;
    }

    private getPrioritizedIntersection(intersections: Array<{index: number, distance: number, type: number, pointType: string}>): number {
        // Sort by priority rules
        intersections.sort((a, b) => {
            // 1. First priority: Distance (closer = higher priority)
            if (Math.abs(a.distance - b.distance) > 0.1) {
                return a.distance - b.distance;
            }

            // 2. Second priority: Component type
            const typePriority: {[key: number]: number} = {
                [componentTypes.point]: 1,
                [componentTypes.label]: 2,
                [componentTypes.picture]: 2,
                [componentTypes.shape]: 3,
                [componentTypes.line]: 4,
                [componentTypes.circle]: 5,
                [componentTypes.rectangle]: 6,
                [componentTypes.arc]: 7,
                [componentTypes.measure]: 8
            };

            if (typePriority[a.type] !== typePriority[b.type]) {
                return typePriority[a.type] - typePriority[b.type];
            }

            // 3. Third priority: Point type within component
            const pointTypePriority: {[key: string]: number} = {
                'center': 1,
                'start': 2,
                'end': 3
            };
            
            return (pointTypePriority[a.pointType] || 0) - (pointTypePriority[b.pointType] || 0);
        });

        // Return the index of the highest priority intersection
        return intersections[0].index;
    }
    undo() {
        if (this.undoStack.length > 0) {
            // Remove the last state from the undoStack and push it to the redoStack
            const state = this.undoStack.pop();
            if (state) {
                this.redoStack.push(state);
            }

            // Get the new last state from the undoStack (if any) to apply to the logicDisplay
            const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;

            if (lastState) {
                this.logicDisplay!.components = []
                this.logicDisplay?.importJSON(JSON.parse(lastState), this.logicDisplay.components);
                if (this.onComponentArrayChanged) {
                    console.log('[renderer] array changed defined, firing')
                    this.onComponentArrayChanged();
                }
            } else
                return

            this.update(); // Re-render the canvas
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
            console.log(JSON.parse(state != null ? state : '[]')); // Log the parsed state (optional)

            // Clear the current components
            this.logicDisplay!.components = [];

            // Update the display with the next state
            this.logicDisplay?.importJSON(JSON.parse(state != null ? state : '[]'), this.logicDisplay.components);
            if (this.onComponentArrayChanged) {
                console.log('[renderer] array changed defined, firing')
                this.onComponentArrayChanged();
            }
            this.update(); // Re-render the canvas
        }
    }
    public onComponentChangeCallback: (() => void) | null = null;

    public onComponentArrayChanged: (() => void) | null = null;

    private notifyComponentChange() {
        if (this.onComponentChangeCallback) {
            this.onComponentChangeCallback();
        }
    }
    performAction(e: MouseEvent, action: number) {
        switch (this.mode) {
            case this.modes.AddPoint:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    }
                    this.temporaryPoints[0] = this.getCursorXLocal();
                    this.temporaryPoints[1] = this.getCursorYLocal();
                } else if (action === this.mouseAction.Down) {
                    this.logicDisplay?.addComponent(new Point(
                        this.temporaryPoints[0]!,
                        this.temporaryPoints[1]!
                    ));
                    this.saveState();
                }
                this.tooltip = 'Add point (press esc to cancel)';
                break;

            case this.modes.AddLine:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.line) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.line;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.line) {
                        this.logicDisplay?.addComponent(new Line(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!
                        ));
                        this.temporaryPoints[0] = this.temporaryPoints[2];
                        this.temporaryPoints[1] = this.temporaryPoints[3];
                        this.saveState();
                    }
                }
                this.tooltip = "Add line (press esc to cancel)";
                break;

            case this.modes.AddCircle:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.circle) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.circle;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.circle) {
                        this.logicDisplay?.addComponent(new Circle(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!
                        ));
                        this.saveState();
                    }
                }
                this.tooltip = "Add circle (press esc to cancel)";
                break;

            case this.modes.AddArc:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.circle) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.arc) {
                        this.temporaryPoints[4] = this.getCursorXLocal();
                        this.temporaryPoints[5] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.circle;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.circle) {
                        this.temporaryComponentType = componentTypes.arc;
                        this.temporaryPoints[4] = this.getCursorXLocal();
                        this.temporaryPoints[5] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.arc) {
                        console.log('[renderer] adding new arc');
                        this.logicDisplay?.addComponent(new Arc(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!,
                            this.temporaryPoints[4]!,
                            this.temporaryPoints[5]!
                        ));
                        this.saveState();
                    }
                }
                this.tooltip = "Add arc (press esc to cancel)";
                break;

            case this.modes.AddRectangle:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.rectangle) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.rectangle;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.rectangle) {
                        this.logicDisplay?.addComponent(new Rectangle(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!
                        ));
                        this.saveState();
                    }
                }
                this.tooltip = "Add rectangle (press esc to cancel)";
                break;
            case this.modes.AddBoundbox:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.rectangle) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.rectangle;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.rectangle) {
                        this.logicDisplay?.addComponent(new BoundBox(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!
                        ))
                    }
                }
                break;
            case this.modes.AddMeasure:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.measure) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryComponentType = componentTypes.measure;
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.measure) {
                        this.logicDisplay?.addComponent(new Measure(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            this.temporaryPoints[2]!,
                            this.temporaryPoints[3]!
                        ));
                        this.saveState();
                    }
                }
                this.tooltip = "Measure (press esc to cancel)";
                break;

            case this.modes.AddLabel:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    const text = prompt('Add text...');
                    if (text && text.length > 0) {
                        this.logicDisplay?.addComponent(new Label(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            text,
                            this.fontSize
                        ));
                        this.saveState();
                        this.mode = this.modes.Navigate;
                    }
                }
                this.tooltip = "Add label (press esc to cancel)";
                break;

            case this.modes.AddShape:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.shape;
                    } else if (this.temporaryComponentType === componentTypes.shape && this.temporaryShape) {
                        this.temporaryShape.x = this.getCursorXLocal();
                        this.temporaryShape.y = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryShape) {
                        this.logicDisplay?.addComponent(this.temporaryShape);
                        this.saveState();
                    }
                }
                this.tooltip = "Add shape (press esc to cancel)";
                break;

            case this.modes.AddPicture:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                if (action === this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    const url = prompt('Enter a valid Image URL');
                    if (url && url.length > 0) {
                        this.logicDisplay?.addComponent(new Picture(
                            this.temporaryPoints[0]!,
                            this.temporaryPoints[1]!,
                            url
                        ));
                        this.saveState();
                        this.mode = this.modes.Navigate;
                    }
                }
                this.tooltip = "Add Picture (press esc to cancel)";
                break;
            case this.modes.AddPolygon:
                this.displayRef!.style.cursor = `url("${CrosshairCursor}") 16 16, crosshair`;
                this.tooltip = "Add Polygon";
                let firstVec: VectorType = {
                    x: 0,
                    y: 0
                }
                if (action == this.mouseAction.Move) {
                    if (this.temporaryComponentType === null) {
                        this.temporaryComponentType = componentTypes.point;
                    } else if (this.temporaryComponentType === componentTypes.point) {
                        this.temporaryPoints[0] = this.getCursorXLocal();
                        this.temporaryPoints[1] = this.getCursorYLocal();
                    } else if (this.temporaryComponentType === componentTypes.polygon) {
                        this.temporaryPoints[2] = this.getCursorXLocal();
                        this.temporaryPoints[3] = this.getCursorYLocal();
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporaryComponentType == componentTypes.point) {
                        firstVec.x = this.getCursorXLocal();
                        firstVec.y = this.getCursorYLocal();
                        this.temporaryComponentType = componentTypes.polygon;
                        this.temporaryVectors.push(firstVec);
                        this.temporaryVectorIndex++;
                    } else if (this.temporaryComponentType === componentTypes.polygon) {
                        let tempVector: VectorType = {
                            x: this.getCursorXLocal(),
                            y: this.getCursorYLocal()
                        }
                        if (
                            this.temporaryVectors.length > 0 &&
                            tempVector.x === this.temporaryVectors[0].x &&
                            tempVector.y === this.temporaryVectors[0].y
                        ) {
                            this.logicDisplay?.addComponent(new Polygon(this.temporaryVectors));
                            this.temporaryComponentType = null;
                            this.temporaryVectorIndex = 0;
                            this.temporaryVectors = [];
                            this.saveState();
                            this.update();
                        } else if (
                            this.temporaryVectors.length > 0 &&
                            ((Math.abs(tempVector.x - this.temporaryVectors[0].x) < 10) &&
                            (Math.abs(tempVector.y - this.temporaryVectors[0].y) < 10))
                        ) {
                            this.temporaryVectors.push(tempVector);
                            this.temporaryVectors.push({
                                x: this.temporaryVectors[0].x,
                                y: this.temporaryVectors[0].y
                            });
                            this.logicDisplay?.addComponent(new Polygon(this.temporaryVectors));
                            this.temporaryComponentType = null;
                            this.temporaryVectors = [];
                            this.saveState();
                            this.update();
                        } else {
                            this.temporaryVectors.push(tempVector);
                            this.temporaryVectorIndex++;
                            this.temporaryPoints[0] = this.temporaryVectors[this.temporaryVectorIndex - 1].x;
                            this.temporaryPoints[1] = this.temporaryVectors[this.temporaryVectorIndex - 1].y;
                        }
                    }
                }
                break;
            case this.modes.Navigate:
                this.displayRef!.style.cursor = `url("${NavigateIdleCursor}") 16 16, default`;
                if (action === this.mouseAction.Down) {
                    this.camMoving = true;
                    this.xCNaught = this.getCursorXRaw();
                    this.yCNaught = this.getCursorYRaw();
                    this.displayRef!.style.cursor = `url("${NavigateDragCursor}") 16 16, default`;
                } else if (action === this.mouseAction.Up) {
                    this.camMoving = false;
                    this.camX += this.getCursorXRaw() - this.xCNaught;
                    this.camY += this.getCursorYRaw() - this.yCNaught;
                    this.displayRef!.style.cursor = `url("${NavigateIdleCursor}") 16 16, default`;
                } else if (action === this.mouseAction.Move) {
                    if (this.camMoving)
                        this.displayRef!.style.cursor = `url("${NavigateDragCursor}") 16 16, default`;
                    else
                        this.displayRef!.style.cursor = `url("${NavigateIdleCursor}") 16 16, default`;
                }
                this.tooltip = "Navigate";
                break;

            case this.modes.Move:
                this.displayRef!.style.cursor = `url("${DefaultCursor}") 6 6, default`;
                if (action === this.mouseAction.Move) {
                    if (this.selectedComponent === null) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                            this.getCursorXLocal(),
                            this.getCursorYLocal()
                        ) ?? null;
                    } else {
                        if (this.logicDisplay) {
                            this.moveComponent(
                                this.selectedComponent,
                                this.getCursorXLocal(),
                                this.getCursorYLocal()
                            );
                            this.saveState();
                        }
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.selectedComponent === null) {
                        this.selectedComponent = this.temporarySelectedComponent;
                    } else {
                        this.selectedComponent = null;
                        this.saveState();
                    }
                }
                this.tooltip = "Move (click a node point to select, esc to cancel)";
                break;

            case this.modes.Delete:
                this.displayRef!.style.cursor = `url("${DefaultCursor}") 6 6, default`;
                if (action === this.mouseAction.Move) {
                    if (this.selectedComponent === null) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                            this.getCursorXLocal(),
                            this.getCursorYLocal()
                        ) ?? null;
                    }
                } else if (action === this.mouseAction.Down) {
                    if (this.temporarySelectedComponent !== null && this.logicDisplay?.components[this.temporarySelectedComponent]) {
                        this.logicDisplay.components[this.temporarySelectedComponent].active = false;
                        this.saveState();
                    }
                }
                this.tooltip = "Delete (click a node point to delete, esc to cancel)";
                break;
            case this.modes.Select:
                this.displayRef!.style.cursor = `url("${DefaultCursor}") 6 6, default`;
                if (action == this.mouseAction.Move) {
                    console.log('[renderer] moused moved during select')
                    if (this.selectedComponent == null) {
                        this.temporarySelectedComponent = this.findIntersectionWith(
                            this.getCursorXRaw(),
                            this.getCursorYRaw()
                        )
                    } else {
                        // Get the selected component
                        const component = this.logicDisplay?.components[this.selectedComponent];

                        // If actively dragging a handle
                        if (this.dragHandle) {
                            // Get cursor position in world coordinates
                            let localX, localY;
                            if (this.snap) {
                                // Use uniform grid snapping regardless of grid spacing
                                const snapToUniformGrid = (value: number) => {
                                    const baseGridSize = this.gridSpacing;
                                    return Math.round(value / baseGridSize) * baseGridSize;
                                };
                                localX = snapToUniformGrid(this.getCursorXLocal());
                                localY = snapToUniformGrid(this.getCursorYLocal());
                            } else {
                                // Allow free movement when snap is disabled
                                localX = this.getCursorXLocal();
                                localY = this.getCursorYLocal();
                            }

                            // Update component based on type
                            if (component) {
                                let componentModified = false; // Flag to check if component was modified
                                switch (component.type) {
                                    case componentTypes.line:
                                    case componentTypes.measure:
                                    case componentTypes.circle:
                                        const lineComponent = component as Line;
                                        if (this.dragHandle === 'start') {
                                            if (lineComponent.x1 !== localX || lineComponent.y1 !== localY) {
                                                lineComponent.x1 = localX;
                                                lineComponent.y1 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'end') {
                                            if (lineComponent.x2 !== localX || lineComponent.y2 !== localY) {
                                                lineComponent.x2 = localX;
                                                lineComponent.y2 = localY;
                                                componentModified = true;
                                            }
                                        }
                                        break;
                                    case componentTypes.rectangle:
                                    case componentTypes.boundBox:
                                        const rectComponent = component as Rectangle;
                                        if (this.dragHandle === 'start') {
                                            // NW resize
                                            if (rectComponent.x1 !== localX || rectComponent.y1 !== localY) {
                                                rectComponent.x1 = localX;
                                                rectComponent.y1 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'top-right') {
                                            // NE resize
                                            if (rectComponent.x2 !== localX || rectComponent.y1 !== localY) {
                                                rectComponent.x2 = localX;
                                                rectComponent.y1 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'bottom-left') {
                                            // SW resize
                                            if (rectComponent.x1 !== localX || rectComponent.y2 !== localY) {
                                                rectComponent.x1 = localX;
                                                rectComponent.y2 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'bottom-right') {
                                            // SE resize
                                            if (rectComponent.x2 !== localX || rectComponent.y2 !== localY) {
                                                rectComponent.x2 = localX;
                                                rectComponent.y2 = localY;
                                                componentModified = true;
                                            }
                                        }
                                        break;
                                    case componentTypes.arc:
                                        const arcComponent = component as Arc;
                                        if (this.dragHandle === 'start') {
                                            if (arcComponent.x1 !== localX || arcComponent.y1 !== localY) {
                                                arcComponent.x1 = localX;
                                                arcComponent.y1 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'mid') {
                                            if (arcComponent.x2 !== localX || arcComponent.y2 !== localY) {
                                                arcComponent.x2 = localX;
                                                arcComponent.y2 = localY;
                                                componentModified = true;
                                            }
                                        } else if (this.dragHandle === 'end') {
                                            if (arcComponent.x3 !== localX || arcComponent.y3 !== localY) {
                                                arcComponent.x3 = localX;
                                                arcComponent.y3 = localY;
                                                componentModified = true;
                                            }
                                        }
                                        break;
                                    case componentTypes.point:
                                    case componentTypes.label:
                                    case componentTypes.picture:
                                        const pointComponent = component as Point;
                                        if (pointComponent.x !== localX || pointComponent.y !== localY) {
                                            pointComponent.x = localX;
                                            pointComponent.y = localY;
                                            componentModified = true;
                                        }
                                        break;
                                    case componentTypes.polygon:
                                        const poly = component as Polygon;
                                        if (this.dragHandle && this.dragHandle.startsWith('handle-')) {
                                            const handleIndex = parseInt(this.dragHandle.split('-')[1]);
                                            if (handleIndex >= 0 && handleIndex < poly.vectors.length) {
                                                if (poly.vectors[handleIndex].x !== localX || poly.vectors[handleIndex].y !== localY) {
                                                    poly.vectors[handleIndex].x = localX;
                                                    poly.vectors[handleIndex].y = localY;
                                                    componentModified = true;
                                                }
                                            }
                                        }
                                        break;
                                }
                                if (componentModified) {
                                    this.saveState();
                                    // Notify the client that the component has changed
                                    this.notifyComponentChange();
                                }
                            }
                        } else {
                            // Enhanced handle detection (rest of this block remains the same)
                            const handleSize = 5 / this.zoom; // Consistent handle size in world units
                            const handles = component ? this.getComponentHandles(component) : [];
                            let isOverHandle = false;

                            for (const handle of handles) {
                                // Calculate distance in world coordinates
                                const dx = this.getCursorXLocal() - handle.x;
                                const dy = this.getCursorYLocal() - handle.y;
                                const distSquared = dx * dx + dy * dy;

                                // Check if cursor is over handle using world coordinates
                                if (distSquared < (handleSize * handleSize)) {
                                    this.displayRef!.style.cursor = `url("${handle.cursor}") 16 16, default`;
                                    isOverHandle = true;
                                    break;
                                }
                            }

                            if (!isOverHandle) {
                                this.displayRef!.style.cursor = `url("${DefaultCursor}") 6 6, default`;
                            }
                        }
                    }
                } else if (action == this.mouseAction.Down) {
                    console.log('[renderer] moused down during select')
                    if (this.selectedComponent !== null) {
                        console.log('[renderer] selected component', this.selectedComponent)
                        const component = this.logicDisplay?.components[this.selectedComponent];
                        if (component && component.type !== componentTypes.point &&
                            component.type !== componentTypes.label &&
                            component.type !== componentTypes.picture) {

                            const handles = component ? this.getComponentHandles(component) : [];
                            const handleSize = 5 / this.zoom;

                            for (const handle of handles) {
                                // Check collision in world coordinates
                                const dx = this.getCursorXLocal() - handle.x;
                                const dy = this.getCursorYLocal() - handle.y;
                                const distSquared = dx * dx + dy * dy;

                                if (distSquared < (handleSize * handleSize)) {
                                    this.dragHandle = handle.id;
                                    // No need to notify here, as mouse.Move will handle updates
                                    return;
                                }
                            }
                        }
                    }

                    if (this.temporarySelectedComponent != null) {
                        console.log('[renderer] selected component', this.temporarySelectedComponent)
                        if (this.selectedComponent === this.temporarySelectedComponent) {
                            this.unselectComponent();
                            this.handles = [];
                        } else {
                            this.selectedComponent = this.temporarySelectedComponent;
                            this.selectComponent(this.temporarySelectedComponent);
                        }
                        // In case a new component is selected or unselected
                        this.notifyComponentChange();
                    } else {
                        if (this.selectedComponent !== null) { // Only unselect if something was selected
                            this.unselectComponent();
                            this.notifyComponentChange(); // Notify if selection is cleared
                        }
                    }
                } else if (action == this.mouseAction.Up) {
                    this.dragHandle = null;
                    this.displayRef!.style.cursor = 'url("../") 0 0, default';
                    // After releasing the drag, ensure the state is up-to-date
                    this.notifyComponentChange();
                }

                if (this.selectedComponent !== null) {
                    const selectedComponent = this.logicDisplay!.components[this.selectedComponent];
                    if (selectedComponent.type !== componentTypes.point &&
                        selectedComponent.type !== componentTypes.label &&
                        selectedComponent.type !== componentTypes.picture) {
                        const handlePoints = this.getComponentHandles(selectedComponent);
                        if (this.lastSelectedComponent !== this.selectedComponent) {
                            this.dragHandle = null;
                            this.lastSelectedComponent = this.selectedComponent;
                        }
                    }
                }

                this.tooltip = "Select (click to select/deselect)";
                break;
        }
    }
    setZoom(zoomFactor: number) {
        var newZoom = this.zoom * zoomFactor;
        console.log(newZoom)

        // Zoom interval control
        if (newZoom <= 0.4 || newZoom >= 15)
            return;

        this.targetZoom = newZoom;
        const viewportCenterX = this.displayWidth / 2;
		const viewportCenterY = this.displayHeight / 2;
		const cursorOffsetX = (this.mouse!.cursorXGlobal - this.offsetX - viewportCenterX) / this.zoom;
		const cursorOffsetY = (this.mouse!.cursorYGlobal - this.offsetY - viewportCenterY) / this.zoom;
        const zoomDiff = this.targetZoom - this.zoom;
        this.camX -= cursorOffsetX * (zoomDiff / this.zoom);
		this.camY -= cursorOffsetY * (zoomDiff / this.zoom);
    }
    clearGrid() {
        if (this.context) {
            this.context.restore();
            this.context.fillStyle = '#1d1d1d';
            this.context.fillRect(
                0,
                0,
                this.displayWidth,
                this.displayHeight
            );
            this.context.save();
            this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
            this.context.strokeStyle = '#E9E9E9';
            this.context.lineWidth = 0.15;
        }
    }
    getTooltip() {
        var text = this.tooltip;
        return text + ` (${fps} FPS, dx=${Math.floor(this.getCursorXLocal())};dy=${Math.floor(this.getCursorYLocal())})`;
    }
    update() {
        this.offsetX = this.displayRef!.offsetLeft;
        this.offsetY = this.displayRef!.offsetTop;
        this.zoom = this.targetZoom;
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
        this.refreshSelectionTools();
        if (this.recordingMode) {
            this.drawUserCursor((this.getCursorXRaw() + this.camX) * this.zoom, (this.getCursorYRaw() + this.camY) * this.zoom);
        }
    }
}
export const InitializeInstance = (renderer: GraphicsRenderer) => {
    renderer.start();
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDistance = 0;
    let isPinching = false;
    const getTouchPos = (e: TouchEvent) => {
        const touch = e.touches[0];
        return {
            x: touch.clientX,
            y: touch.clientY
        };
    };
    const getPinchDistance = (e: TouchEvent) => {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        return Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
    };
    renderer.displayRef?.addEventListener('touchstart', (e: any) => {
        e.preventDefault();

        // Store initial touch position
        const pos = getTouchPos(e);
        touchStartX = pos.x;
        touchStartY = pos.y;

        // Handle pinch start
        if (e.touches.length === 2) {
            isPinching = true;
            initialPinchDistance = getPinchDistance(e);
            return;
        }

        // Simulate mouse position for single touch
        renderer.mouse!.cursorXGlobal = pos.x;
        renderer.mouse!.cursorYGlobal = pos.y;

        // For navigation and move modes, start the action immediately 
        if (renderer.mode === renderer.modes.Navigate) {
            renderer.performAction(e, renderer.mouseAction.Down);
        }
    }, { passive: false });
    renderer.displayRef?.addEventListener('touchmove', (e: any) => {
        e.preventDefault();

        // Handle pinch zoom
        if (e.touches.length === 2 && isPinching) {
            const currentDistance = getPinchDistance(e);
            const pinchDelta = currentDistance - initialPinchDistance;

            if (Math.abs(pinchDelta) > 10) { // Add threshold to prevent accidental zooms
                if (pinchDelta > 0) {
                    renderer.setZoom(renderer.zoomIn)
                } else {
                    renderer.setZoom(renderer.zoomOut)
                }
                initialPinchDistance = currentDistance;
            }
            return;
        }

        // Handle single touch movement
        const pos = getTouchPos(e);
        renderer.mouse!.cursorXGlobal = pos.x;
        renderer.mouse!.cursorYGlobal = pos.y;

        // Always update cursor position for all modes
        renderer.performAction(e, renderer.mouseAction.Move);
    }, { passive: false });

    renderer.displayRef?.addEventListener('touchend', (e: any) => {
        e.preventDefault();

        // Reset pinch state
        if (isPinching) {
            isPinching = false;
            return;
        }

        // Handle touch end
        const pos = e.changedTouches[0];
        renderer.mouse!.cursorXGlobal = pos.clientX;
        renderer.mouse!.cursorYGlobal = pos.clientY;

        // For navigation mode, just end the action
        if (renderer.mode === renderer.modes.Navigate) {
            renderer.performAction(e, renderer.mouseAction.Up);
            return;
        }

        // For Delete mode, trigger mouse down to perform deletion
        if (renderer.mode === renderer.modes.Delete) {
            renderer.performAction(e, renderer.mouseAction.Down);
            return;
        }

        // For Move mode and all drawing tools, trigger mouse down on tap
        if ([renderer.modes.Move, renderer.modes.AddPoint, renderer.modes.AddLine,
        renderer.modes.AddCircle, renderer.modes.AddArc, renderer.modes.AddRectangle,
        renderer.modes.AddMeasure, renderer.modes.AddLabel].includes(renderer.mode)) {
            renderer.performAction(e, renderer.mouseAction.Down);
        }

        // Always perform mouse up to clean states
        renderer.performAction(e, renderer.mouseAction.Up);
    }, { passive: false });
    renderer.displayRef!.onkeyup = (e: KeyboardEvent) => {
        renderer.keyboard?.onKeyUp(e)
    }
    renderer.displayRef!.onkeydown = (e: KeyboardEvent) => {
        renderer.keyboard?.onKeyDown(e)
    }
    renderer.displayRef!.addEventListener('mousemove', (e: any) => {
        // Ignore emulated mouse events from touch
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) {
            return;
        }

        renderer.mouse?.onMouseMove(e);

        if (!renderer.gridPointer) {
            renderer.gridPointer = true;
        }

        renderer.performAction(e, renderer.mouseAction.Move);
    });

    renderer.displayRef!.addEventListener('mouseout', () => {
        renderer.gridPointer = false;
    });

    renderer.displayRef!.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.which == 2) {
            renderer.camMoving = true;
            renderer.xCNaught = renderer.getCursorXRaw();
            renderer.yCNaught = renderer.getCursorYRaw();
        } else {
            renderer.mouse?.onMouseDown(e);
            renderer.performAction(e, renderer.mouseAction.Down);
        }
    });

    renderer.displayRef!.addEventListener('mouseup', (e: MouseEvent) => {
        if (e.which == 2) {
            renderer.camMoving = false;
            renderer.camX += renderer.getCursorXRaw() - renderer.xCNaught;
            renderer.camY += renderer.getCursorYRaw() - renderer.yCNaught;
            renderer.updateCamera();
        } else {
            renderer.mouse?.onMouseUp(e);
            renderer.performAction(e, renderer.mouseAction.Up);
        }
    });

    renderer.displayRef!.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            renderer.setZoom(renderer.zoomIn);
        } else {
            renderer.setZoom(renderer.zoomOut);
        }
    });

    let animationFrameId: number | null;
    let isWindowFocused = true;
    let lastDrawTime = 0;
    const TARGET_FPS = 60;
    const FRAME_TIME = 1000 / TARGET_FPS;
    const FPS_UPDATE_INTERVAL = 500;

    // Use passive event listeners for better performance
    window.addEventListener('focus', () => {
        if (!isWindowFocused) {
            isWindowFocused = true;
            lastDrawTime = performance.now();
            if (!animationFrameId) {
                repeatInstance();
            }
        }
    }, { passive: true });

    window.addEventListener('blur', () => {
        isWindowFocused = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }, { passive: true });

    function repeatInstance(timestamp: number = 0) {
        if (!isWindowFocused) return;

        // Throttle to target FPS
        const deltaTime = timestamp - lastDrawTime;
        if (deltaTime >= FRAME_TIME) {
            frameCount++;
            lastDrawTime = timestamp - (deltaTime % FRAME_TIME);

            // Update FPS counter every 500ms instead of every second
            if (timestamp - lastTime >= FPS_UPDATE_INTERVAL) {
                fps = Math.round((frameCount * 1000) / (timestamp - lastTime));
                frameCount = 0;
                lastTime = timestamp;
            }

            // Use try-catch for robustness
            try {
                renderer.update();
            } catch (error) {
                console.error('Render error:', error);
            }
        }

        animationFrameId = requestAnimationFrame(repeatInstance);
    }

    // Initial call with high-resolution timestamp
    repeatInstance(performance.now());
}