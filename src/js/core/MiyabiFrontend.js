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
}
