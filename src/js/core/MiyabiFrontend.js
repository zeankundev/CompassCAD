const DiscordRPC = require('discord-rpc');
const RPCClient = new DiscordRPC.Client({
    transport: 'ipc'
});
const ElectronDialog = require('@electron/remote').dialog;
const Filesystem = require('fs');
const {
    BrowserWindow
} = require('@electron/remote');

// Tracking purposes
let LastRenderTime = performance.now();
let FrameCount = 0;
let FPS = 0;
let WarningDisplayed = false;

// Misc settings
let FPSWarningValue = 20;

class MiyabiFrontend {
    constructor(display_name, w, h) {
        this.MODES = {
            ADDPOINT: 1,
            ADDLINE: 2,
            ADDCIRCLE: 3,
            ADDRECTANGLE: 4,
            ADDARC: 5,
            ADDMEASURE: 6,
            ADDLABEL: 7,
            ADDSHAPE: 8,
            ADDPICTURE: 9,
            ADDPOLYGON: 10,
            DELETE: 20,
            TRIM: 21,
            NAVIGATE: 22,
            MOVE: 23,
            EDIT: 24,
            SELECT: 25
        };
        this.MOUSEACTION = {
            MOVE: 0,
            DOWN: 1,
            UP: 2
        };
        this.preferredFont = 'gsansmono';
        this.readOnly = false;
        this.mode = this.MODES.SELECT;
        this.previousColor = null;
        this.previousRadius = null;
        this.temporarySelectedComponent = null;
        this.selectedComponent = null;
        this.temporaryComponentType = null;
        this.temporaryShape = null;
        this.temporaryPoints = [
            null, null, 
            null, null,
            null, null
        ];
        this.selectedColor = '#0080ff';
        this.selectedRadius = 2;
        this.logicDisplay = null;
        this.undoStack = [];
        this.redoStack = [];
        this.temporaryObjectArray = [];
        this.lastArray = [];
        this.temporaryVectors = [];
        this.temporaryVectorIndex = 0;
        this.displayWidth = w;
        this.displayHeight = h;
        this.offsetX = 0;
        this.offsetY = 0;
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;
        this.zoomin = 3/2;
        this.zoomout = 2/3;
        this.maxZoomFactor = 15;
        this.camMoving = false;
        this.xCNaught = 0;
        this.yCNaught = 0;
        this.cOutX = 0;
        this.cOutY = 0;
        this.isKeyDown = false;
        this.showGrid = true;
        this.showOrigin = true;
        this.showRules = true;
        this.gridPointer = false;
        this.gridSpacing = 100;
        this.conversionFactor = 1;
        this.unitName = "px";
        this.unitMeasure = "m";
        this.unitFactor = 1;
        this.unitConversionFactor = 1 / 100;
        this.snap = true;
        this.snapTolerance = 20;
        this.fontSize = 18;
        this.maximumStack = 50;
        this.displayName = display_name;
        this.canvas = null;
        this.context = null;
        this.tooltipDefault = 'CompassCAD (using Miyabi Renderer (beta))';
        this.tooltip = this.tooltipDefault;
        this.filePath = '';
        this.peerCursors = new Map();
        this.keyboardController = null;
        this.mouseHandler = null;
        this.configHandler = null;
        this.translator = null;
        this.imageCache = {};
        this.pcbEditorMode = false;
        this.pcbEditor = {
            radius: 1
        };
        // Internal testing
        this._drawDebugPoint = false;
        this._colliderColor = '#00ff00';
        // Flags
        this.configFlags = [];
        this.FLAGS_enableNewScrollControls = false;
        this.FLAGS_enableWebGL = false;
        this.FLAGS_enableLegacyGridStyle = false;
        this.FLAGS_enableSnap = true;
        this.FLAGS_enableZoomWarpingToCursor = false;
        this.FLAGS_enableTutoringMode = false;
    }
    async start() {
        this.logicDisplay = new LogicDisplay();
        this.logicDisplay.init();
        this.zoom = 1;
        this._setInner('text', 'zoom-level', '1.000x');
        this.temporaryObjectArray = [];
        this.keyboardController = new KeyboardController();
        this.mouseHandler = new MouseHandler();
        this.configHandler = new ConfigHandler();
        this.translator = new Localizator();
        this.canvas = document.getElementById('canvas');
        this._setCanvasCursor('crosshair');
        if (this.FLAGS_enableWebGL) {
            this.context = enableWebGLCanvas(this.canvas);
        } else {
            this.context = /** @type {CanvasRenderingContext2D} */ this.canvas.getContext('2d');
        }
        this._loadInitial();
        this.update();
    }
    async _loadInitial() {
        this.gridSpacing = await this.config.getValueKey("gridSpacing")
        this.fontSize = await this.config.getValueKey("fontSize");
        this.maximumStack = await this.config.getValueKey("maximumStack");
        this.updateActivity('Starting a new design', 'On New Design 1');
        clearForm();
        this.configFlags = await this.config.getFlags();
        console.log(this.configFlags)
        const useOldGrid = Array.isArray(this.configFlags) ? this.configFlags.includes('enable-old-grid') : false;
        this.enableLegacyGridStyle = useOldGrid;
        const enableZoomToCursorWarping = Array.isArray(this.configFlags) ? this.configFlags.includes('enable-zoom-to-cursor-warping') : false;
        this.enableZoomWarpingToCursor = enableZoomToCursorWarping;
        this.selectedColor = getComputedStyle(document.body).getPropertyValue('--theme') != null ? getComputedStyle(document.body).getPropertyValue('--theme') : '#0080ff';
        this.enableNewScrollControls = Array.isArray(this.configFlags) ? this.configFlags.includes('enable-new-scroll-controls') : false;
        this.enableTutoringMode = Array.isArray(this.configFlags) ? this.configFlags.includes('enable-tutoring-mode') : false;
    }
    _setInner(type, id, value) {
        const getType = (type) => {
            switch (type) {
                case 'text':
                    return 'innerText'
                case 'html':
                    return 'innerHTML'
                default:
                    throw new SyntaxError(`Unknown type: ${type}`);
            }
        }
        document.getElementById(id)[getType(type)] = value;
    }
    _setCanvasCursor(cursor) {
        if (cursor != null) {
            this.canvas.style.cursor = cursor;
        } else {
            throw new Error('Cursor cannot be null');
        }
    }
    updateActivity(details = null) {
        if (details == null) {
            details = this.lastActivityDetails || 'We don\'t know what they are doing.';
        } else {
            this.lastActivityDetails = details;
        }
        if (!this.lastComponentCount || this.lastComponentCount !== this.logicDisplay.components.length) {
            this.lastComponentCount = this.logicDisplay.components.length; // Cache the latest count
            if (client && typeof client.setActivity === 'function') {
                try {
                    client.setActivity({
                        details: details || 'Editing design',
                        state: `Total components: ${this.logicDisplay.components.length}`,
                        largeImageKey: 'logo_round',
                        smallImageKey: 'work_file',
                        startTimestamp: Date.now()
                    }).catch((e) => {
                        console.error('Failed to set Discord activity:', e);
                    });
                } catch {

                }
            }
        }
    }
    async getLocal(key) {
        return await this.translator.getLocalizedString(key);
    }
    updatePeerCursor(peerId, x, y, color, name) {
        this.peerCursors.set(peerId, {
            x: x,
            y: y,
            color: color,
            name: name,
            lastUpdate: Date.now()
        });
    }
    updatePeerName(peerId, name) {
        const cursor = this.peerCursors.get(peerId);
        if (cursor) {
            cursor.name = name;
            this.peerCursors.set(peerId, cursor);
        }
    }
    async update() {
        this.preferredFont = await this.config.getValueKey('preferredFont');
        this.offsetX = this.canvas.offsetLeft;
        this.offsetY = this.canvas.offsetTop;
        this.currentZoom = this.targetZoom;
        this.zoom = this.currentZoom;
        this.updateCamera();
        this.clearGrid();
        if (this.pcbEditorMode) {
            this.showGrid = false;
            this.gridSpacing = 0.5;
            this.maxZoomFactor = 30;
            this.conversionFactor = 2.7;
            this.unitMeasure = 'mm';
        }
        if (this.showGrid) this.drawGrid(this.cOutX, this.cOutY);
        if (this.showOrigin) this.drawOrigin(this.cOutX, this.cOutY);
        this.drawAllComponents(this.logicDisplay.components, 0, 0);
        if (this.temporaryComponentType !== null) this.drawTemporaryComponent();
        if (this._drawDebugPoint) {
            // Internal testing later on
        }
        this.drawRules();
        this.drawPeerCursors();
        this.drawTooltip();
        this.drawTooltip();
        this.updateActivity();
        this._setInner('text', 'zoom-level', `${this.targetZoom.toFixed(3)}x`);
        this.isKeyDown = this.keyboard.pressedKeys.size > 0;
        if (this.FLAGS_enableTutoringMode) {
            if (this.isKeyDown) {
                let keys = this.keyboard.getDisplayText();
                this.context.fillStyle = "#fff";
                this.context.font = `bold 42px ${getComputedStyle(document.body).getPropertyValue('--main-font')}`;
                this.context.fillText(keys, - this.displayWidth / 2 + 80, this.displayHeight / 2 - 50);
            }
        }
    }
    refreshSelectionTools() {
        this.drawComponentSize(this.logicDisplay.components[this.selectedComponent]);
        const selectedComponent = this.logicDisplay.components[this.selectedComponent];
        if (selectedComponent.isActive()) {
            const handles = this.getComponentHandles(selectedComponent);
			console.log(`[renderer] handle len: ${handles.length}`);
			switch (handles.length) {
				case 2:
					if (handles[0] && handles[1] && typeof handles[0].x === 'number' && typeof handles[0].y === 'number' 
						&& typeof handles[1].x === 'number' && typeof handles[1].y === 'number') {
						this.context.strokeStyle = this.selectedColor;
						this.context.lineWidth = 2;
						this.context.beginPath();
						this.context.moveTo((handles[0].x + this.cOutX) * this.zoom, (handles[0].y + this.cOutY) * this.zoom);
						this.context.lineTo((handles[1].x + this.cOutX) * this.zoom, (handles[1].y + this.cOutY) * this.zoom);
						this.context.stroke();
					}
					break;
				case 4:
					if (handles[0] && handles[1] && handles[2] && handles[3] && 
						typeof handles[0].x === 'number' && typeof handles[0].y === 'number' &&
						typeof handles[1].x === 'number' && typeof handles[1].y === 'number' &&
						typeof handles[2].x === 'number' && typeof handles[2].y === 'number' &&
						typeof handles[3].x === 'number' && typeof handles[3].y === 'number') {
						this.context.strokeStyle = this.selectedColor;
						this.context.lineWidth = 2;
						this.context.beginPath();
						this.context.moveTo((handles[0].x + this.cOutX) * this.zoom, (handles[0].y + this.cOutY) * this.zoom);
						this.context.lineTo((handles[1].x + this.cOutX) * this.zoom, (handles[1].y + this.cOutY) * this.zoom);
						this.context.moveTo((handles[1].x + this.cOutX) * this.zoom, (handles[1].y + this.cOutY) * this.zoom);
						this.context.lineTo((handles[3].x + this.cOutX) * this.zoom, (handles[3].y + this.cOutY) * this.zoom);
						this.context.moveTo((handles[3].x + this.cOutX) * this.zoom, (handles[3].y + this.cOutY) * this.zoom);
						this.context.lineTo((handles[2].x + this.cOutX) * this.zoom, (handles[2].y + this.cOutY) * this.zoom);
						this.context.moveTo((handles[2].x + this.cOutX) * this.zoom, (handles[2].y + this.cOutY) * this.zoom);
						this.context.lineTo((handles[0].x + this.cOutX) * this.zoom, (handles[0].y + this.cOutY) * this.zoom);
						this.context.closePath();
						this.context.stroke();
					}
				default:
					break;
			}
			for (const handle of handles) {
				// We'll write an efficient code later on
			}
        }
    }
    cut() {
        if (this.selectedComponent != null) {
            const component = this.logicDisplay.components[this.selectedComponent];
            this.temporaryObjectArray = [component];
            this.logicDisplay.components.splice(this.selectedComponent, 1);
            this.unselectComponent()
            this.saveState();
            navigator.clipboard.writeText(JSON.stringify(this.temporaryObjectArray));
        }
    }
    copy() {
        if (this.selectedComponent != null) {
            const component = this.logicDisplay.components[this.selectedComponent];
            this.temporaryObjectArray = [component];
            navigator.clipboard.writeText(JSON.stringify(this.temporaryObjectArray));
            callToast('Copied to clipboard.')
        }
    }
    paste() {
       if (this.selectedComponent == null) {
            navigator.clipboard.readText().then(data => {
                this.unselectComponent()
                try {
                    const pastedComponents = JSON.parse(data);
                    if (!Array.isArray(pastedComponents)) {
                        console.error("Pasted data is not an array");
                        return;
                    }
                    const currentComponents = this.logicDisplay.components;
                    const initialLength = currentComponents.length;
                    clearForm()
                    this.unselectComponent();
                    this.logicDisplay.importJSON(pastedComponents, currentComponents);
                    this.unselectComponent();
                    this.setMode(this.MODES.SELECT);
                    this.unselectComponent();
                    const newComponentIndex = this.logicDisplay.components.length - pastedComponents.length;
                    this.setMode(this.MODES.MOVE);
                    this.unselectComponent()
                    this.selectComponent(newComponentIndex);
                    const handleMouseDown = () => {
                        this.setMode(this.MODES.SELECT);
                        this.unselectComponent();
                        document.removeEventListener("mousedown", handleMouseDown);
                        clearForm()
                        this.saveState()
                    };
                    document.addEventListener("mousedown", handleMouseDown);
                } catch (error) {
                    console.error("Error parsing clipboard data:", error);
                }
            }).catch(err => console.error("Failed to read clipboard contents:", err));
        } else {
            callToast('Deselect to paste.')
        } 
    }
    saveState() {
        let hasChanged = false;
	for (let i = 0; i < this.logicDisplay.components.length; i++) {
		if (JSON.stringify(this.logicDisplay.components[i]) !== JSON.stringify(this.lastArray[i])) {
			hasChanged = true;
			break;
		}
	}

	if (hasChanged) {
		this.undoStack.push(JSON.stringify(this.logicDisplay.components));
            this.lastArray = [...this.logicDisplay.components];
            if (this.undoStack.length > this.maximumStack) {
                this.undoStack.shift();
            }
            console.log(this.undoStack);
            if (doupdatestack) {
                console.log('[renderer] doupdatestack true, sending editor state');
                sendCurrentEditorState();
            } else {
                doupdatestack = true;
            }
            this.redoStack = [];
        }
    }
    clearGrid() {
        this.context.restore();
        this.context.fillStyle = "#202020";
        this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
        this.context.save();
        this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
        this.context.strokeStyle = "#cccccc40";
        this.context.lineWidth = 0.15;
    }
    drawAllComponents(components, x, y) {
        components.forEach((component) => {
            if (!component.isActive()) return;
            this.drawComponent(component, x, y);
        })
    }
    drawComponent(component, moveByX = 0, moveByY = 0) {
        switch (component.type) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint({
                    x: component.x + moveByX,
                    y: component.y + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.LINE:
                this.drawLine({
                    x1: component.x1 + moveByX,
                    y1: component.y1 + moveByY,
                    x2: component.x2 + moveByX,
                    y2: component.y2 + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle({
                    x1: component.x1 + moveByX,
                    y1: component.y1 + moveByY,
                    x2: component.x2 + moveByX,
                    y2: component.y2 + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle({
                    x1: component.x1 + moveByX,
                    y1: component.y1 + moveByY,
                    x2: component.x2 + moveByX,
                    y2: component.y2 + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure({
                    x1: component.x1 + moveByX,
                    y1: component.y1 + moveByY,
                    x2: component.x2 + moveByX,
                    y2: component.y2 + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel({
                    x: component.x + moveByX,
                    y: component.y + moveByY,
                    text: component.text,
                    color: component.color,
                    radius: component.radius,
                    fontSize: component.fontSize,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc({
                    x1: component.x1 + moveByX,
                    y1: component.y1 + moveByY,
                    x2: component.x2 + moveByX,
                    y2: component.y2 + moveByY,
                    x3: component.x3 + moveByX,
                    y3: component.y3 + moveByY,
                    color: component.color,
                    radius: component.radius,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(component);
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPicture({
                    x: component.x + moveByX,
                    y: component.y + moveByY,
                    basedURL: component.pictureSource,
                    opacity: component.opacity
                });
                break;
            case COMPONENT_TYPES.POLYGON:
                this.drawPolygon({
                    vectors: component.vectors,
                    fillColor: component.color,
                    strokeColor: component.strokeColor,
                    radius: component.radius,
                    opacity: component.opacity,
                    enableStroke: component.enableStroke
                });
                break;
        }
    }

    drawTemporaryComponent() {
        switch (this.temporaryComponentType) {
            case COMPONENT_TYPES.POINT:
                this.drawPoint({
                    x: this.temporaryPoints[0],
                    y: this.temporaryPoints[1],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.LINE:
                this.drawLine({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.pcbEditorMode ? this.pcbEditor.radius : this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.CIRCLE:
                this.drawCircle({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                this.drawMeasure({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.RECTANGLE:
                this.drawRectangle({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                this.drawMeasure({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                this.drawMeasure({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[1],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                this.drawMeasure({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[0],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.MEASURE:
                this.drawMeasure({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.LABEL:
                this.drawLabel({
                    x: this.temporaryPoints[0],
                    y: this.temporaryPoints[1],
                    text: this.temporaryText,
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.ARC:
                this.drawArc({
                    x1: this.temporaryPoints[0],
                    y1: this.temporaryPoints[1],
                    x2: this.temporaryPoints[2],
                    y2: this.temporaryPoints[3],
                    x3: this.temporaryPoints[4],
                    y3: this.temporaryPoints[5],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.SHAPE:
                this.drawShape(this.temporaryShape);
                break;
            case COMPONENT_TYPES.PICTURE:
                this.drawPoint({
                    x: this.temporaryPoints[0],
                    y: this.temporaryPoints[1],
                    color: this.selectedColor,
                    radius: this.selectedRadius,
                    opacity: 100
                });
                break;
            case COMPONENT_TYPES.POLYGON:
                if (this.temporaryVectors.length === 1) {
                    this.drawPoint({
                        x: this.temporaryVectors[0].x,
                        y: this.temporaryVectors[0].y,
                        color: this.selectedColor,
                        radius: this.selectedRadius,
                        opacity: 100
                    });
                } else if (this.temporaryVectors.length > 1) {
                    this.drawPolygon({
                        vectors: [
                            ...this.temporaryVectors,
                            { x: this.getCursorXLocal(), y: this.getCursorYLocal() }
                        ],
                        fillColor: this.selectedColor,
                        strokeColor: '#ffffff',
                        radius: this.selectedRadius,
                        opacity: 100,
                        enableStroke: true
                    });
                }
                break;
        }
    }
    drawPoint(data) {
        // data: {x, y, color, radius, opacity, ...}
        const x = data.x, y = data.y, color = data.color || "#fff", radius = data.radius || 2, opacity = data.opacity ?? 100;
        if (this.temporarySelectedComponent != null || this.mode == this.MODES.MOVE) {
            this.context.lineWidth = 2;
            this.context.fillStyle = '#fff';
            this.context.strokeStyle = this.selectedColor;
            this.context.beginPath();
            this.context.rect(
                (x + this.cOutX) * this.zoom - 4,
                (y + this.cOutY) * this.zoom - 4,
                8,
                8
            );
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
        } else if (this.pcbEditorMode) {
            return;
        } else {
            this.context.lineWidth = 3 * this.zoom;
            this.context.fillStyle = color + num2hex(opacity);
            this.context.strokeStyle = color + num2hex(opacity);
            this.context.beginPath();
            this.context.arc(
                (x + this.cOutX) * this.zoom,
                (y + this.cOutY) * this.zoom,
                2 * this.zoom, 0, 3.14159 * 2, false
            );
            this.context.closePath();
            this.context.fill();
            this.context.stroke();
        }
    }

    drawLine(data) {
        // data: {x1, y1, x2, y2, color, radius, opacity}
        const {x1, y1, x2, y2, color = "#fff", radius = 2, opacity = 100} = data;
        this.context.lineWidth = radius * this.zoom;
        this.context.fillStyle = color + num2hex(opacity);
        this.context.strokeStyle = color + num2hex(opacity);
        this.context.lineCap = "round";
        this.context.beginPath();
        this.context.moveTo(
            (x1 + this.cOutX) * this.zoom,
            (y1 + this.cOutY) * this.zoom
        );
        this.context.lineTo(
            (x2 + this.cOutX) * this.zoom,
            (y2 + this.cOutY) * this.zoom
        );
        this.context.stroke();
    }

    drawCircle(data) {
        // data: {x1, y1, x2, y2, color, radius, opacity}
        const {x1, y1, x2, y2, color = "#fff", radius = 2, opacity = 100} = data;
        this.context.lineWidth = radius * this.zoom;
        this.context.fillStyle = color + num2hex(opacity);
        this.context.strokeStyle = color + num2hex(opacity);
        this.context.beginPath();
        this.context.arc(
            (x1 + this.cOutX) * this.zoom,
            (y1 + this.cOutY) * this.zoom,
            this.getDistance(x1, y1, x2, y2) * this.zoom,
            0, 3.14159 * 2, false
        );
        this.context.closePath();
        this.context.stroke();
    }

    drawRectangle(data) {
        // data: {x1, y1, x2, y2, color, radius, opacity}
        const {x1, y1, x2, y2, color = "#fff", radius = 2, opacity = 100} = data;
        this.drawLine({x1, y1, x2, y2: y1, color, radius, opacity});
        this.drawLine({x1: x2, y1, x2, y2, color, radius, opacity});
        this.drawLine({x1: x2, y1: y2, x2: x1, y2, color, radius, opacity});
        this.drawLine({x1, y1: y2, x2: x1, y2: y1, color, radius, opacity});
    }

    async drawMeasure(data) {
        // data: {x1, y1, x2, y2, color, radius, opacity}
        let {x1, y1, x2, y2, color = "#fff", radius = 2, opacity = 100} = data;
        let distance;
        if (this.pcbEditorMode)
            distance = (this.getDistance(x1, y1, x2, y2) * this.unitFactor * (this.unitConversionFactor / 0.37)) * 10;
        else
            distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;

        let angle = Math.atan2(y2 - y1, x2 - x1);

        let localZoom = this.zoom, localDiff = 0;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
        }

        const distanceText = distance.toFixed(2) + "" + this.unitMeasure;
        this.context.save();
        this.context.font = (24 * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;
        const textWidth = this.context.measureText(distanceText).width;
        this.context.restore();

        var defaultArrowLength = 25;
        var arrowOffset = 5;
        let arrowLength = defaultArrowLength;
        const minDistanceForFullArrow = defaultArrowLength * 3 / 100;
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

            if (this.pcbEditorMode) {
                this.drawLine({x1, y1, x2: midX - halfGapX, y2: midY - halfGapY, color, radius: 0.25, opacity});
                this.drawLine({x1: midX + halfGapX, y1: midY + halfGapY, x2, y2, color, radius: 0.25, opacity});
            } else {
                this.drawLine({x1, y1, x2: midX - halfGapX, y2: midY - halfGapY, color, radius, opacity});
                this.drawLine({x1: midX + halfGapX, y1: midY + halfGapY, x2, y2, color, radius, opacity});
            }
        }

        if (this.pcbEditorMode) {
            this.drawArrowhead({x: x1, y: y1, angle, length: arrowLength, offset: arrowOffset, color, radius: 0.25, opacity: 100});
            this.drawArrowhead({x: x2, y: y2, angle, length: -arrowLength, offset: arrowOffset, color, radius: 0.25, opacity: 100});
        } else {
            this.drawArrowhead({x: x1, y: y1, angle, length: arrowLength, offset: arrowOffset, color, radius, opacity});
            this.drawArrowhead({x: x2, y: y2, angle, length: -arrowLength, offset: arrowOffset, color, radius, opacity});
        }

        this.context.save();
        const centerOffsetX = midX * this.zoom + this.cOutX * this.zoom;
        const centerOffsetY = midY * this.zoom + this.cOutY * this.zoom;
        this.context.translate(centerOffsetX, centerOffsetY);
        this.context.rotate(angle);
        this.context.translate(-centerOffsetX, -centerOffsetY);
        this.context.translate(centerOffsetX, centerOffsetY + textOffsetY * 2);

        this.context.textAlign = 'center';
        this.context.textBaseline = isShortDistance ? 'top' : 'middle';
        this.context.fillStyle = color + num2hex(opacity);
        this.context.font = (this.fontSize * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;
        this.context.fillText(distanceText, 0, localDiff);
        this.context.restore();
    }

    drawArrowhead(data) {
        // data: {x, y, angle, length, offset, color, radius, opacity}
        const {x, y, angle, length, offset, color = "#fff", radius = 2, opacity = 100} = data;
        var arrowX = x + length * Math.cos(angle);
        var arrowY = y + length * Math.sin(angle);
        var offsetX = offset * Math.cos(angle + Math.PI / 2);
        var offsetY = offset * Math.sin(angle + Math.PI / 2);

        this.drawLine({x1: x, y1: y, x2: arrowX + offsetX, y2: arrowY + offsetY, color, radius, opacity});
        this.drawLine({x1: x, y1: y, x2: arrowX - offsetX, y2: arrowY - offsetY, color, radius, opacity});
        this.drawLine({x1: arrowX + offsetX, y1: arrowY + offsetY, x2: arrowX - offsetX, y2: arrowY - offsetY, color, radius, opacity});
    }

    async drawLabel(data) {
        // data: {x, y, text, color, radius, fontSize, opacity}
        const {x, y, text, color = "#00ffff", radius = 2, fontSize, opacity = 100} = data;
        this.drawPoint({x, y, color: '#00ffff', radius: 2, opacity});

        let localZoom = this.zoom, localDiff = 0, yy = y;
        if (this.zoom <= 0.25) {
            localZoom = 0.5;
            localDiff = 20;
            yy += localDiff;
        }

        this.context.fillStyle = color + num2hex(opacity);
        let fs = fontSize || this.fontSize;
        this.context.font = (fs * localZoom) + `px ${this.preferredFont}, 'SECEmojis', Consolas, DejaVu Sans Mono, monospace`;

        let maxLength = 24, tmpLength = 0, tmpText = "";
        let words = text.split(' ');
        for (let word of words) {
            if (word.includes('\\n')) {
                const parts = word.split('\\n');
                for (let j = 0; j < parts.length; j++) {
                    if (j > 0) {
                        this.context.fillText(
                            tmpText.trim(),
                            (this.cOutX + x + 5) * this.zoom,
                            (this.cOutY + yy) * this.zoom
                        );
                        yy += 25 + localDiff;
                        tmpLength = 0;
                        tmpText = "";
                    }
                    tmpText += parts[j] + " ";
                    tmpLength += parts[j].length + 1;
                }
            } else {
                if (tmpLength + word.length + 1 <= maxLength) {
                    tmpText += word + " ";
                    tmpLength += word.length + 1;
                } else {
                    this.context.fillText(
                        tmpText.trim(),
                        (this.cOutX + x + 5) * this.zoom,
                        (this.cOutY + yy) * this.zoom
                    );
                    yy += 25 + localDiff;
                    tmpText = word + " ";
                    tmpLength = word.length + 1;
                }
            }
        }
        if (tmpText.trim().length > 0) {
            this.context.fillText(
                tmpText.trim(),
                (this.cOutX + x + 5) * this.zoom,
                (this.cOutY + yy) * this.zoom
            );
        }
    }

    drawArc(data) {
        // data: {x1, y1, x2, y2, x3, y3, color, radius, opacity}
        const {x1, y1, x2, y2, x3, y3, color = "#fff", radius = 2, opacity = 100} = data;
        var firstAngle = this.getAngle(x1, y1, x2, y2);
        var secondAngle = this.getAngle(x1, y1, x3, y3);

        this.context.lineWidth = radius * this.zoom;
        this.context.fillStyle = color + num2hex(opacity);
        this.context.strokeStyle = color + num2hex(opacity);
        this.context.beginPath();
        this.context.arc(
            (x1 + this.cOutX) * this.zoom,
            (y1 + this.cOutY) * this.zoom,
            this.getDistance(x1, y1, x2, y2) * this.zoom,
            firstAngle, secondAngle, false
        );
        this.context.stroke();
    }

    drawShape(data) {
        // data: {components, x, y, color, radius}
        this.drawAllComponents(data.components, data.x, data.y);
        this.drawPoint({x: data.x, y: data.y, color: data.color, radius: data.radius});
    }

    drawPicture(data) {
        // data: {x, y, basedURL, opacity}
        const {x, y, basedURL, opacity = 100} = data;
        this.drawPoint({x, y, color: '#0ff', radius: 2, opacity});

        if (!this.imageCache[basedURL]) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = basedURL;

            img.onerror = () => {
                this.imageCache[basedURL] = true;
            };
            img.onload = () => {
                this.imageCache[basedURL] = img;
                this.renderImage({x, y, img, opacity});
            };
        } else {
            this.renderImage({x, y, img: this.imageCache[basedURL], opacity});
        }
    }

    renderImage(data) {
        // data: {x, y, img, opacity}
        const {x, y, img, opacity = 100} = data;
        if (img == true) {
            const errorShape = {
                components: [
                    new Circle(0, 0, 10, 10, 2, '#ff0000', opacity),
                    new Line(-7, -7, 7, 7, 2, '#ff0000', opacity),
                    new Line(-7, 7, 7, -7, 2, '#ff0000', opacity),
                    new Label(17, 6, "Image Error", this.fontSize, opacity)
                ],
                x: x,
                y: y,
                color: '#ff0000',
                radius: 2
            };
            this.drawShape(errorShape);
            return;
        }
        const width = img.naturalWidth * this.zoom || 100;
        const height = img.naturalHeight * this.zoom || 100;
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

    drawPolygon(data) {
        // data: {vectors, fillColor, strokeColor, radius, opacity, enableStroke}
        const {vectors, fillColor = "#fff", strokeColor = "#fff", radius = 2, opacity = 100, enableStroke = true} = data;
        if (!vectors || vectors.length < 2) return;
        this.context.lineWidth = radius * this.zoom;
        this.context.fillStyle = fillColor + num2hex(opacity);
        this.context.strokeStyle = strokeColor + num2hex(opacity);
        this.context.beginPath();
        this.context.moveTo((vectors[0].x + this.cOutX) * this.zoom, (vectors[0].y + this.cOutY) * this.zoom);
        for (let i = 1; i < vectors.length; i++) {
            this.context.lineTo((vectors[i].x + this.cOutX) * this.zoom, (vectors[i].y + this.cOutY) * this.zoom);
        }
        this.context.closePath();
        this.context.fill();
        if (enableStroke) this.context.stroke();
    }
}
