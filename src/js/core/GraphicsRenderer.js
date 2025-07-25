const $ = require('jquery')
const rpc = require('discord-rpc')
const client = new rpc.Client({ transport: 'ipc' })
client.login({ clientId: '1309147585130397736' }).catch(console.error)
const diag = require('@electron/remote').dialog
const fs = require('fs');
const { BrowserWindow } = require('@electron/remote');
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsWarningThreshold = 20;
let warningDisplayed = false;
function GraphicsRenderer(displayName, width, height) {
	// Enumerate all available modes
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

	// Enumerate all type of action
	this.MOUSEACTION = {
		MOVE: 0,
		DOWN: 1,
		UP: 2
	};

	this.preferredFont = 'gsansmono'

	// Draw read only
	this.readonly = false;

	// By default the mode is SELECT (used to be NAVIGATE)
	this.mode = this.MODES.SELECT;

	this.previousColor = null;
	this.previousRadius = null;

	// The index of temporary selected component
	this.temporarySelectedComponent = null;
	// The index of selected component
	this.selectedComponent = null;
	this.temporaryComponentType = null;
	this.temporaryShape = null;
	this.temporaryPoints = new Array(
		null, null,   // x1, y1
		null, null,   // x2, y2
		null, null);  // x3, y3

	// Temporary or selected color
	this.selectedColor = "#0080ff";
	this.selectedRadius = 2;

	this.logicDisplay;

	this.counter = 0;
	this.undoStack = []
	this.redoStack = []
	this.temporaryObjectArray = []
	this.lastArray = [];
	this.temporaryVectors = [];
	this.temporaryVectorIndex = 0;

	this.displayWidth = width;
	this.displayHeight = height;
	this.offsetX = 0;
	this.offsetY = 0;

	// Camera
	this.camX = 0;
	this.camY = 0;
	this.zoom = 1;
	this.zoomin = 3 / 2;
	this.zoomout = 2 / 3;
	this.currentZoom = 1; // Add this to your initialization
	this.targetZoom = 1;  // Add this to your initialization
	this.zoomSpeed = 0.4 // Adjust the speed of the zoom transition
	this.maxZoomFactor = 15;
	this.camMoving = false;
	this.xCNaught = 0;
	this.yCNaught = 0;
	this.cOutX = 0;
	this.cOutY = 0;

	this.inFocus = false;
	this.initResize = false;
	this.isKeyDown = false;

	this.showGrid = true;
	this.showOrigin = true;
	this.showRules = true;
	this.gridPointer = false;
	this.gridSpacing = 100; // Pixel

	this.conversionFactor = 1;
	this.unitName = "px";
	this.unitMeasure = "m";
	this.unitFactor = 1;
	this.unitConversionFactor = 1 / 100;

	// Snapping setting
	this.snap = true;
	this.snapTolerance = 20;

	this.fontSize = 18;

	this.maximumStack = 50;

	this.displayName = displayName;
	this.cvn = 0; // Canvas HTML element
	this.context; // Canvas object

	this.tooltipDefault = "CompassCAD"
	this.tooltip = this.tooltipDefault;
	this.filePath = ''

	// Multiplayer UI
	this.peerCursors = new Map();

	this.keyboard = null;
	this.mouse = null;
	this.config = null;
	this.translator = null;
	this.drawDebugPoint = false;
	this.colliderColor = '#00ff00'
	this.imageCache = {};

	// Miscellaneous/debug settings
	this.pcbEditorMode = false;
	this.pcbEditor = {
		radius: 1
	}
	this.enableNewScrollControls = false;
	this.enableWebGL = false;
	this.enableLegacyGridStyle = false;
	this.enableSnap = true;
	this.enableZoomWarpingToCursor = false;
	this.enableTutoringMode = false;
	this.configFlags = [];
}

GraphicsRenderer.prototype.init = async function (e) {
	/*
	 * INITIALIZE THE LOGIC
	 */
	this.logicDisplay = new LogicDisplay();
	this.logicDisplay.init();
	this.zoom = 1;
	document.getElementById('zoom-level').innerText = '1.000x'
	this.temporaryObjectArray = []

	/*
	 * INITIALIZE INPUT HANDLER 
	 */
	this.keyboard = new KeyboardHandler();
	this.mouse = new MouseHandler();
	this.config = new ConfigHandler();
	this.translator = new Localizator();

	this.cvn = $('#' + this.displayName);
	this.cvn.css('cursor', 'crosshair');
	if (this.enableWebGL) {
		console.log('[renderer] using WebGL')
		this.context = enableWebGLCanvas(this.cvn[0]);
        this.context.start2D();
	} else {
		console.log('[renderer] using ctx2d')
		this.context = /** @type {CanvasRenderingContext2D} */ (this.cvn[0].getContext('2d'));
	}
	this.execute()
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
};
GraphicsRenderer.prototype.updateActivity = function (details = null) {
	// Use the last details if none are provided
	if (details === null) {
		details = this.lastActivityDetails || 'Editing design'; // Default fallback
	} else {
		this.lastActivityDetails = details; // Cache the current details for future use
	}

	// Avoid redundant updates by comparing the current component count
	if (!this.lastComponentCount || this.lastComponentCount !== this.logicDisplay.components.length) {
		this.lastComponentCount = this.logicDisplay.components.length; // Cache the latest count
		if (client && typeof client.setActivity === 'function') {
			try {
				client.setActivity({
					details: details || 'Editing design', // Action being performed
					state: `Total components: ${this.logicDisplay.components.length}`, // Component count
					largeImageKey: 'logo_round', // Main image key for Discord Rich Presence
					smallImageKey: 'work_file', // Secondary image key
					startTimestamp: Date.now() // Start timestamp for the session
				}).catch(() => {
					// Silently handle Discord RPC errors
				});
			} catch {
				// Ignore any Discord RPC initialization errors
			}
		}
	}
};
GraphicsRenderer.prototype.lerp = function (start, end, time) {
	return start + (end - start) * time;
}
GraphicsRenderer.prototype.getLocal = async function (key) {
	return await this.translator.getLocalizedString(key);
}
GraphicsRenderer.prototype.updatePeerCursor = function (peerId, x, y, color, name) {
	this.peerCursors.set(peerId, {
		x: x,
		y: y,
		color: color,
		name: name,
		lastUpdate: Date.now()
	});
}

GraphicsRenderer.prototype.updatePeerName = function (peerId, name) {
	const cursor = this.peerCursors.get(peerId);
	if (cursor) {
		cursor.name = name;
		this.peerCursors.set(peerId, cursor);
	}
}

GraphicsRenderer.prototype.execute = async function (e) {
	const disableLerp = await this.config.getValueKey("disableLerp");
	this.preferredFont = await this.config.getValueKey("preferredFont");
	this.offsetX = this.cvn.offset().left;
	this.offsetY = this.cvn.offset().top;
	// I know I might get a lot of controversy for this
	/*if (disableLerp !== true) {
		this.currentZoom = this.lerp(this.currentZoom, this.targetZoom, this.zoomSpeed);
	} else {
		
	}*/
	this.currentZoom = this.targetZoom;
	this.zoom = this.currentZoom;
	this.updateCamera();

	// Clear and redraw grid
	this.clearGrid();
	if (this.pcbEditorMode) {
		this.showGrid = false;
		this.gridSpacing = 0.5;
		this.maxZoomFactor = 30;
		this.conversionFactor = 2.7;
		this.unitMeasure = 'mm';
		document.getElementById('add-point').style.display = 'none';
	}
	if (this.showGrid) this.drawGrid(this.cOutX, this.cOutY);
	if (this.showOrigin) this.drawOrigin(this.cOutX, this.cOutY);

	// Draw components and temporary elements
	this.drawAllComponents(this.logicDisplay.components, 0, 0);
	if (this.temporaryComponentType !== null) this.drawTemporaryComponent();

	// Debugging visuals
	if (this.drawDebugPoint) {
		this.drawPoint(this.getCursorXRaw(), this.getCursorYRaw(), '#fff', 2);
		this.drawLine(this.getCursorXRaw(), this.getCursorYRaw(), this.getCursorXLocal(), this.getCursorYLocal(), '#fff', 2);
	}

	this.refreshSelectionTools();

	// Draw rules and tooltips
	this.drawRules();
	this.drawPeerCursors();
	this.drawToolTip();

	// Update Rich Presence only when the component count changes
	this.updateActivity();
	document.getElementById('zoom-level').innerText = `${this.targetZoom.toFixed(3)}x`;
	this.isKeyDown = this.keyboard.pressedKeys.size > 0;
	if (this.enableTutoringMode) {
		if (this.isKeyDown) {
			let keys = this.keyboard.getDisplayText();
			this.context.fillStyle = "#fff";
			this.context.font = `bold 42px ${getComputedStyle(document.body).getPropertyValue('--main-font')}`;
			this.context.fillText(keys, - this.displayWidth / 2 + 80, this.displayHeight / 2 - 50);
		}
	}
    if (this.enableWebGL) {
        this.context.finish2D();
    }
};

GraphicsRenderer.prototype.refreshSelectionTools = function () {
	if (this.selectedComponent != null && this.logicDisplay.components[this.selectedComponent]) {
		// Always draw component size measurements
		this.drawComponentSize(this.logicDisplay.components[this.selectedComponent]);

		// Draw handles for the selected component
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
				this.drawPoint(handle.x, handle.y, '#fff', 2);
			}
		}
	}
};

GraphicsRenderer.prototype.copy = function (e) {
	if (this.selectedComponent != null) {
		const component = this.logicDisplay.components[this.selectedComponent];
		this.temporaryObjectArray = [component];
		navigator.clipboard.writeText(JSON.stringify(this.temporaryObjectArray));
		callToast('Copied to clipboard.')
	}
}

GraphicsRenderer.prototype.cut = function (e) {
	if (this.selectedComponent != null) {
		const component = this.logicDisplay.components[this.selectedComponent];
		this.temporaryObjectArray = [component];
		this.logicDisplay.components.splice(this.selectedComponent, 1);
		this.unselectComponent()
		this.saveState();
		navigator.clipboard.writeText(JSON.stringify(this.temporaryObjectArray));
	}
}

GraphicsRenderer.prototype.paste = function (e) {
	if (this.selectedComponent == null) {
		navigator.clipboard.readText().then(data => {
			this.unselectComponent()
			try {
				const pastedComponents = JSON.parse(data);
				if (!Array.isArray(pastedComponents)) {
					console.error("Pasted data is not an array");
					return;
				}

				// Merge existing components with the new ones
				const currentComponents = this.logicDisplay.components;
				const initialLength = currentComponents.length;

				clearForm()

				this.unselectComponent(); // Ensure no previous selection before pasting
				this.logicDisplay.importJSON(pastedComponents, currentComponents);

				// Ensure correct selection of the newly pasted object
				this.unselectComponent();
				this.setMode(this.MODES.SELECT);
				this.unselectComponent();
				const newComponentIndex = this.logicDisplay.components.length - pastedComponents.length;
				this.setMode(this.MODES.MOVE);
				this.unselectComponent()
				this.selectComponent(newComponentIndex);

				// Ensure mode switches back to SELECT if mouse is down
				const handleMouseDown = () => {
					this.setMode(this.MODES.SELECT);
					this.unselectComponent(); // Ensure components are properly deselected
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

GraphicsRenderer.prototype.weirdPaste = function () {
    console.log(`[renderer] weird pasting, current pos: x:${this.getCursorXLocal()},y:${this.getCursorYLocal()}`)
    navigator.clipboard.read().then(clipboardItems => {
		clipboardItems.forEach(async clipboardItem => {
			// Get available types from clipboard item
			const types = clipboardItem.types;
			
			for (const type of types) {
                console.warn(type);
				try {
					if (type === 'text/plain') {
						const textBlob = await clipboardItem.getType('text/plain');
						const text = await textBlob.text();
						if (text.includes('active') || text.includes('type')) {
							this.paste();
							refreshHierarchy();
						} else {
							this.logicDisplay.addComponent(
								new Label(
									this.getCursorXLocal(),
									this.getCursorYLocal(),
									text
								)
							)
							refreshHierarchy();
						}
					}
					else if (type.startsWith('image/')) {
                        const imageBlob = await clipboardItem.getType(type);
                        const arrayBuffer = await imageBlob.arrayBuffer();
						// Convert ArrayBuffer to base64 safely
						function arrayBufferToBase64(buffer) {
							let binary = '';
							const bytes = new Uint8Array(buffer);
							const len = bytes.byteLength;
							for (let i = 0; i < len; i++) {
								binary += String.fromCharCode(bytes[i]);
							}
							return btoa(binary);
						}
						const base64String = arrayBufferToBase64(arrayBuffer);
						const imageUrl = `data:${type};base64,${base64String}`;
						this.logicDisplay.addComponent(
							new Picture(
								this.getCursorXLocal(),
								this.getCursorYLocal(), 
								imageUrl
							)
						);
						refreshHierarchy();
					}
				} catch (err) {
					console.error('Error reading clipboard:', err);
				}
			}
		});
	}).catch(err => {
		console.error('Failed to read clipboard contents:', err);
	});
}

GraphicsRenderer.prototype.saveState = function () {
    // Only save if components have changed since last save
    const currentState = JSON.stringify(this.logicDisplay.components);
    if (this.undoStack.length === 0 || this.undoStack[this.undoStack.length - 1] !== currentState) {
        this.undoStack.push(currentState);
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

        // Clear the redo stack when a new action is performed
        this.redoStack = [];
    }
};

GraphicsRenderer.prototype.returnLatexInstance = async function (latex) {
	const MathJaxInstance = await MathJax;

	return MathJaxInstance.tex2svg(latex, { display: true });
}
GraphicsRenderer.prototype.clearGrid = function (e) {
	this.context.restore();
	this.context.fillStyle = "#202020";
	this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
	this.context.save();

	this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
	this.context.strokeStyle = "#cccccc40";
	this.context.lineWidth = 0.15;
};

GraphicsRenderer.prototype.drawAllComponents = function (components, moveByX, moveByY) {
	for (var i = 0; i < components.length; i++) {
		if (!components[i].isActive())
			continue;

		this.drawComponent(components[i], moveByX, moveByY);
	}
};

GraphicsRenderer.prototype.drawComponent = function (component, moveByX, moveByY) {
	switch (component.type) {
		case COMPONENT_TYPES.POINT:
			this.drawPoint(
				component.x + moveByX,
				component.y + moveByY,
				component.color,
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.LINE:
			this.drawLine(
				component.x1 + moveByX,
				component.y1 + moveByY,
				component.x2 + moveByX,
				component.y2 + moveByY,
				component.color,
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.CIRCLE:
			this.drawCircle(
				component.x1 + moveByX,
				component.y1 + moveByY,
				component.x2 + moveByX,
				component.y2 + moveByY,
				component.color,
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.RECTANGLE:
			this.drawRectangle(
				component.x1 + moveByX,
				component.y1 + moveByY,
				component.x2 + moveByX,
				component.y2 + moveByY,
				component.color,
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.MEASURE:
			this.drawMeasure(
				component.x1 + moveByX,
				component.y1 + moveByY,
				component.x2 + moveByX,
				component.y2 + moveByY,
				component.color,
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.LABEL:
			this.drawLabel(
				component.x + moveByX,
				component.y + moveByY,
				component.text,
				component.color,
				component.radius,
				component.fontSize,
				component.opacity);
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
				component.radius,
				component.opacity);
			break;
		case COMPONENT_TYPES.SHAPE:
			this.drawShape(component);
			break;
		case COMPONENT_TYPES.PICTURE:
			this.drawPicture(
				component.x + moveByX,
				component.y + moveByY,
				component.pictureSource,
				component.opacity
			);
			break;
		case COMPONENT_TYPES.POLYGON:
			this.drawPolygon(
				component.vectors,
				component.color,
				component.strokeColor,
				component.radius,
				component.opacity,
				component.enableStroke
			)
	}
};

/**
 * This method is used to draw current temporary component
 */
GraphicsRenderer.prototype.drawTemporaryComponent = function (e) {
	switch (this.temporaryComponentType) {
		case COMPONENT_TYPES.POINT:
			this.drawPoint(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.selectedColor,
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.LINE:
			this.drawLine(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.pcbEditorMode ? this.pcbEditor.radius : this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.CIRCLE:
			this.drawCircle(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			this.drawMeasure(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.RECTANGLE:
			this.drawRectangle(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			this.drawMeasure(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			this.drawMeasure(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[1],
				this.selectedColor,
				this.selectedRadius,
				100);
			this.drawMeasure(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[0],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.MEASURE:
			this.drawMeasure(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.LABEL:
			this.drawLabel(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryText,
				this.selectedColor,
				this.selectedRadius,
				100);
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
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.SHAPE:
			this.drawShape(this.temporaryShape);
			break;
		case COMPONENT_TYPES.PICTURE:
			this.drawPoint(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.selectedColor,
				this.selectedRadius,
				100);
			break;
		case COMPONENT_TYPES.POLYGON:
			if (this.temporaryVectors.length >= 0 && this.temporaryVectors.length < 1) {
				this.drawPoint(
					this.temporaryVectors[0].x,
					this.temporaryVectors[0].y,
					this.selectedColor,
					this.selectedRadius,
					100);
			} else {
				this.drawPolygon(
					[...this.temporaryVectors, {x: this.getCursorXLocal(), y: this.getCursorYLocal()}],
					this.selectedColor,
					'#ffffff',
					this.selectedRadius,
					100,
					true
				)
			}
	}
};

GraphicsRenderer.prototype.drawPoint = function (x, y, color, radius, opacity) {
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
		)
		this.context.closePath();
		this.context.fill();
		this.context.stroke();
	} else if (this.pcbEditorMode) {
		return;
	} else {
		this.context.lineWidth = 3 * this.zoom;
		this.context.fillStyle = color + num2hex(opacity);
		this.context.strokeStyle = color + num2hex(opacity);;
		this.context.beginPath();
		this.context.arc(
			(x + this.cOutX) * this.zoom,
			(y + this.cOutY) * this.zoom,
			2 * this.zoom, 0, 3.14159 * 2, false);
		this.context.closePath();
		this.context.fill();
		this.context.stroke();
	}
};

GraphicsRenderer.prototype.drawLine = function (x1, y1, x2, y2, color, radius, opacity) {
	this.context.lineWidth = radius * this.zoom;
	this.context.fillStyle = color + num2hex(opacity);
	this.context.strokeStyle = color + num2hex(opacity);
	this.context.lineCap = "round"; // Ensure rounded ends for the line
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
};

GraphicsRenderer.prototype.drawCircle = function (x1, y1, x2, y2, color, radius, opacity) {
	this.context.lineWidth = radius * this.zoom;
	this.context.fillStyle = color + num2hex(opacity);
	this.context.strokeStyle = color + num2hex(opacity);;
	this.context.beginPath();
	this.context.arc(
		(x1 + this.cOutX) * this.zoom,
		(y1 + this.cOutY) * this.zoom,
		this.getDistance(x1, y1, x2, y2) * this.zoom,
		0, 3.14159 * 2, false);
	this.context.closePath();
	this.context.stroke();
};

GraphicsRenderer.prototype.drawRectangle = function (x1, y1, x2, y2, color, radius, opacity) {
	this.drawLine(x1, y1, x2, y1, color, radius, opacity);
	this.drawLine(x2, y1, x2, y2, color, radius, opacity);
	this.drawLine(x2, y2, x1, y2, color, radius, opacity);
	this.drawLine(x1, y2, x1, y1, color, radius, opacity);
};

GraphicsRenderer.prototype.drawMeasure = async function (x1, y1, x2, y2, color, radius, opacity) {
	// Calculate the distance between the two points
	if (this.pcbEditorMode)
		var distance = (this.getDistance(x1, y1, x2, y2) * this.unitFactor * (this.unitConversionFactor / 0.37)) * 10;
	else
		var distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;

	// Calculate the angle of the line in radians
	var angle = Math.atan2(y2 - y1, x2 - x1);

	// Adjust zoom levels
	if (this.pcbEditorMode) {
		var localZoom = 1;
		var localDiff = 0;
		if (this.zoom <= 0.25) {
			localZoom = 0.5;
			localDiff = 20;
		}
	} else {
		var localZoom = this.zoom;
		var localDiff = 0;
		if (this.zoom <= 0.25) {
			localZoom = 0.5;
			localDiff = 20;
		}
	}

	// Format the distance text
	const distanceText = distance.toFixed(2) + "" + this.unitMeasure;

	// Measure the text width to create an adaptive gap
	this.context.save();
	this.context.font = (24 * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;
	const textWidth = this.context.measureText(distanceText).width;
	this.context.restore();

	// Default length and offset for the arrowhead lines
	var defaultArrowLength = 25;
	var arrowOffset = 5;
	let arrowLength = defaultArrowLength;

	// Minimum distance to display the full measure line and gap
	const minDistanceForFullArrow = defaultArrowLength * 3 / 100; // 0.5 meters
	if (distance < minDistanceForFullArrow) {
		arrowLength = (distance / minDistanceForFullArrow) * defaultArrowLength;
	}
	const isShortDistance = distance < minDistanceForFullArrow * 2;

	// Calculate the midpoint
	const midX = (x1 + x2) / 2;
	const midY = (y1 + y2) / 2;

	// If short distance, set text position to above the midpoint
	const textOffsetY = isShortDistance ? (750 / 100) * this.zoom : 0;

	// Draw line segments only if distance is above threshold
	if (!isShortDistance) {
		const basePadding = 20;
		const adaptivePadding = basePadding * this.zoom;
		const labelGap = (textWidth + adaptivePadding) / this.zoom;

		const halfGapX = (labelGap / 2) * Math.cos(angle);
		const halfGapY = (labelGap / 2) * Math.sin(angle);

		if (this.pcbEditorMode) {
			this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, 0.25);
			this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, 0.25);
		} else {
			this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius, opacity);
			this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius, opacity);
		}
	}

	// Draw arrowheads
	if (this.pcbEditorMode) {
		this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, 0.25, 100);
		this.drawArrowhead(x2, y2, angle, -arrowLength, arrowOffset, color, 0.25, 100);
	} else {
		this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, radius, opacity);
		this.drawArrowhead(x2, y2, angle, -arrowLength, arrowOffset, color, radius, opacity);
	}

	this.context.save();
	const centerOffsetX = midX * this.zoom + this.cOutX * this.zoom;
	const centerOffsetY = midY * this.zoom + this.cOutY * this.zoom;
	this.context.translate(centerOffsetX, centerOffsetY);
	this.context.rotate(angle);
	this.context.translate(-centerOffsetX, -centerOffsetY);
	this.context.translate(centerOffsetX, centerOffsetY + textOffsetY * 2);

	// Set text alignment to center
	this.context.textAlign = 'center';
	this.context.textBaseline = isShortDistance ? 'top' : 'middle';
	this.context.fillStyle = color + num2hex(opacity);
	this.context.font = (this.fontSize * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;

	// Draw the text slightly above the line if distance is short
	this.context.fillText(distanceText, 0, localDiff);

	// Restore the context to avoid affecting subsequent drawings
	this.context.restore();
};

GraphicsRenderer.prototype.drawArrowhead = function (x, y, angle, length, offset, color, radius, opacity) {
	var arrowX = x + length * Math.cos(angle);
	var arrowY = y + length * Math.sin(angle);
	var offsetX = offset * Math.cos(angle + Math.PI / 2);
	var offsetY = offset * Math.sin(angle + Math.PI / 2);

	this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius, opacity);
	this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
	this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
};

GraphicsRenderer.prototype.drawLabel = async function (x, y, text, color, radius, fontSize, opacity) {
	this.drawPoint(x, y, '#00ffff', 2, opacity);

	var localZoom = this.zoom;
	var localDiff = 0;

	if (this.zoom <= 0.25) {
		localZoom = 0.5;
		localDiff = 20;
		y += localDiff;
	}

	this.context.fillStyle = color + num2hex(opacity);
	var fontSize = fontSize || this.fontSize;
	this.context.font = (fontSize * localZoom) + `px ${this.preferredFont}, 'SECEmojis', Consolas, DejaVu Sans Mono, monospace`;

	var maxLength = 24; // 24 Characters per row
	var tmpLength = 0;
	var tmpText = "";
	var arrText = this.logicDisplay.customSyntax(text).split(" ");

	let words = text.split(' ');
	for (let word of words) {
		// Handle line breaks within words
		if (word.includes('\\n')) {
			const parts = word.split('\\n');
			for (let j = 0; j < parts.length; j++) {
				if (j > 0) {
					// Start new line for subsequent parts
					this.context.fillText(
						tmpText.trim(),
						(this.cOutX + x + 5) * this.zoom, 
						(this.cOutY + y) * this.zoom
					);
					y += 25 + localDiff;
					tmpLength = 0;
					tmpText = "";
				}
				tmpText += parts[j] + " ";
				tmpLength += parts[j].length + 1;
			}
		} else {
			// Add word if it fits on current line
			if (tmpLength + word.length + 1 <= maxLength) {
				tmpText += word + " ";
				tmpLength += word.length + 1;
			} else {
				// Print current line and start new one
				this.context.fillText(
					tmpText.trim(),
					(this.cOutX + x + 5) * this.zoom,
					(this.cOutY + y) * this.zoom
				);
				y += 25 + localDiff;
				tmpText = word + " ";
				tmpLength = word.length + 1;
			}
		}
	}

	// Print any remaining text
	if (tmpText.trim().length > 0) {
		this.context.fillText(
			tmpText.trim(),
			(this.cOutX + x + 5) * this.zoom,
			(this.cOutY + y) * this.zoom
		);
	}
};

GraphicsRenderer.prototype.drawArc = function (x1, y1, x2, y2, x3, y3, color, radius, opacity) {
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
		firstAngle, secondAngle, false);
	this.context.stroke();
};

GraphicsRenderer.prototype.drawShape = function (shape) {
	this.drawAllComponents(shape.components, shape.x, shape.y);
	this.drawPoint(shape.x, shape.y, shape.color, shape.radius);
};
GraphicsRenderer.prototype.drawPicture = function (x, y, basedURL, opacity) {
	this.drawPoint(x, y, '#0ff', 2, opacity);

	if (!this.imageCache[basedURL]) {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = basedURL;

		img.onerror = () => {
			this.imageCache[basedURL] = true;
		};
		img.onload = () => {
			this.imageCache[basedURL] = img;
			this.renderImage(x, y, img);
		};
	} else {
		this.renderImage(x, y, this.imageCache[basedURL], opacity);
	}
};

GraphicsRenderer.prototype.renderImage = function (x, y, img, opacity) {
	if (img == true) {
		// Draw a placeholder shape with X when image fails to load
		const errorShape = {
			components: [
				// Rectangle borders
				new Circle(0, 0, 10, 10, 2, '#ff0000', opacity),

				// X cross
				new Line(-7, -7, 7, 7, 2, '#ff0000', opacity),
				new Line(-7, 7, 7, -7, 2, '#ff0000', opacity),

				// Error text
				new Label(17, 6, "Image Error", this.fontSize, opacity)
			],
			x: x,
			y: y,
			color: '#ff0000',
			radius: 2
		};

		this.drawShape(errorShape);
		return
	}

	const width = img.naturalWidth * this.zoom || 100;
	const height = img.naturalHeight * this.zoom || 100;

	this.context.globalAlpha = opacity / 100; // Set opacity

	this.context.drawImage(
		img,
		(x + this.cOutX) * this.zoom,
		(y + this.cOutY) * this.zoom,
		width,
		height
	);

	this.context.globalAlpha = 1;
};

GraphicsRenderer.prototype.drawPolygon = function(vectors, fillColor, strokeColor, radius, opacity, enableStroke) {
	if (vectors.length < 2) return; // Not enough points to form a polygon

	this.context.lineWidth = radius * this.zoom;
	this.context.fillStyle = fillColor + num2hex(opacity);
	this.context.strokeStyle = strokeColor + num2hex(opacity);
	this.context.beginPath();

	// Move to the first point
	this.context.moveTo((vectors[0].x + this.cOutX) * this.zoom, (vectors[0].y + this.cOutY) * this.zoom);

	// Draw lines to subsequent points
	for (let i = 1; i < vectors.length; i++) {
		this.context.lineTo((vectors[i].x + this.cOutX) * this.zoom, (vectors[i].y + this.cOutY) * this.zoom);
	}

	// Close the path to form a polygon
	this.context.closePath();
	this.context.fill();
	enableStroke ? this.context.stroke() : null; 
}

GraphicsRenderer.prototype.drawToolTip = function (e) {
	// Shadow effect (black text offset by 5px to the right and bottom)
	this.context.shadowColor = "black";
	this.context.shadowOffsetX = 2;
	this.context.shadowOffsetY = 2;
	this.context.textBaseline = 'alphabetic'
	this.context.textAlign = 'left';
	// Tooltip text
	this.context.fillStyle = "#fff"; // Set text color to white
	this.context.font = `13px ${getComputedStyle(document.body).getPropertyValue('--main-font')}`;
	this.context.fillText(this.getToolTip(), -this.displayWidth / 2 + 80, this.displayHeight / 2 - 10);
};


GraphicsRenderer.prototype.drawOrigin = function (cx, cy) {
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
};

GraphicsRenderer.prototype.drawRules = function (e) {
	if (!this.showRules)
		return;

	if (this.gridPointer) {
		// Vertical rule: outer (for contrast) then inner
		this.context.lineWidth = 2;
		this.context.strokeStyle = '#2e2e2e'; // Outer contrasting color
		this.context.beginPath();
		this.context.moveTo(this.getCursorXInFrame(), -this.displayHeight);
		this.context.lineTo(this.getCursorXInFrame(), this.displayHeight);
		this.context.closePath();
		this.context.stroke();

		// Horizontal rule: outer (for contrast) then inner
		this.context.lineWidth = 2;
		this.context.strokeStyle = '#2e2e2e';
		this.context.beginPath();
		this.context.moveTo(-this.displayWidth, this.getCursorYInFrame());
		this.context.lineTo(this.displayWidth, this.getCursorYInFrame());
		this.context.closePath();
		this.context.stroke();

		this.context.lineWidth = 1;
		this.context.strokeStyle = '#cccccc'; // Inner rule color
		this.context.beginPath();
		this.context.moveTo(this.getCursorXInFrame(), -this.displayHeight);
		this.context.lineTo(this.getCursorXInFrame(), this.displayHeight);
		this.context.closePath();
		this.context.stroke();

		this.context.lineWidth = 1;
		this.context.strokeStyle = '#cccccc';
		this.context.beginPath();
		this.context.moveTo(-this.displayWidth, this.getCursorYInFrame());
		this.context.lineTo(this.displayWidth, this.getCursorYInFrame());
		this.context.closePath();
		this.context.stroke();
	}

	// TODO Show rules!
};

GraphicsRenderer.prototype.drawPeerCursors = function () {
	const now = Date.now();
	const staleThreshold = 5000;
	this.peerCursors.forEach((cursor, peerId) => {
		if (now - cursor.lastUpdate > staleThreshold) {
			this.peerCursors.delete(peerId);
			return;
		}

		// Draw cursor pointer
		this.context.beginPath();
		const screenX = (cursor.x + this.cOutX) * this.zoom;
		const screenY = (cursor.y + this.cOutY) * this.zoom;

		const mouseShapeVectors = [
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
		]
		
		// Draw a custom cursor shape
		this.context.beginPath();
		this.context.moveTo(screenX + mouseShapeVectors[0].x, screenY + mouseShapeVectors[0].y);

		// Draw path through all points
		mouseShapeVectors.forEach((point, index) => {
			if (index > 0) { // Skip first point since we already moved there
				this.context.lineTo((screenX + point.x), (screenY + point.y));
			}
		});

		this.context.closePath();

		// Fill with peer's color 
		this.context.fillStyle = cursor.color;
		this.context.fill();

		// Draw outline
		this.context.strokeStyle = '#ffffff';
		this.context.lineWidth = 1;
		this.context.stroke();
		
		// Draw outline
		this.context.strokeStyle = '#ffffff';
		this.context.lineWidth = 1;
		this.context.stroke();

		// Draw name with background for better visibility
		const name = cursor.name;
		this.context.font = `bold 12px ${getComputedStyle(document.body).getPropertyValue('--main-font')}`;
		const metrics = this.context.measureText(name);
		
		// Draw name background
		this.context.fillStyle = cursor.color;
		this.context.roundRect(
			screenX + 15,
			screenY + 16,
			metrics.width + 8,
			20,
			5
		);
		this.context.fill();
		this.context.closePath();
		
		// Draw name text
		this.context.fillStyle = '#fff';
		this.context.fillText(
			name,
			screenX + 19,
			screenY + 30
		);
	});
}

GraphicsRenderer.prototype.drawGrid = function (camXoff, camYoff) {
	if (!this.enableLegacyGridStyle) {
		// Modern dot grid style
		// Base grid spacing adjusted by zoom
		const gridSpacingAdjusted = (this.gridSpacing * 2) * this.zoom;

		// Dynamically adjust density based on zoom level
		let densityDivisor;
		// For very small grid spacing (<5), be more aggressive with density reduction
		if (this.gridSpacing < 5) {
			if (this.zoom < 0.5) {
				densityDivisor = 100;
			} else if (this.zoom <= 1) {
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
		else {
			if (this.zoom < 0.75) {
				densityDivisor = 1.5
			} else {
				densityDivisor = 0.5;
			}
		}

		// Adjust spacing based on density
		const effectiveSpacing = gridSpacingAdjusted * densityDivisor;

		// Calculate grid boundaries
		const leftBound = -this.displayWidth / 2;
		const rightBound = this.displayWidth / 2;
		const topBound = -this.displayHeight / 2;
		const bottomBound = this.displayHeight / 2;

		// Calculate grid start/end positions
		const startX = Math.floor((leftBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
		const startY = Math.floor((topBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
		const endX = Math.ceil((rightBound - camXoff * this.zoom) / effectiveSpacing) * effectiveSpacing;
		const endY = Math.ceil((bottomBound - camYoff * this.zoom) / effectiveSpacing) * effectiveSpacing;

		// Draw dot grid
		this.context.fillStyle = "#cccccc75";
		for (let x = startX; x <= endX; x += effectiveSpacing) {
			for (let y = startY; y <= endY; y += effectiveSpacing) {
				this.context.beginPath();
				const adjustedX = x + camXoff * this.zoom;
				const adjustedY = y + camYoff * this.zoom;
				this.context.arc(adjustedX, adjustedY, 1, 0, Math.PI * 2);
				this.context.fill();
			}
		}
	} else {
		// Legacy cartesian grid style
		const gridSpacing = this.gridSpacing * this.zoom;

		// Calculate grid boundaries
		const leftBound = -this.displayWidth / 2;
		const rightBound = this.displayWidth / 2;
		const topBound = -this.displayHeight / 2;
		const bottomBound = this.displayHeight / 2;

		// Calculate grid lines start/end positions
		const startX = Math.floor((leftBound - camXoff * this.zoom) / gridSpacing) * gridSpacing;
		const endX = Math.ceil((rightBound - camXoff * this.zoom) / gridSpacing) * gridSpacing;
		const startY = Math.floor((topBound - camYoff * this.zoom) / gridSpacing) * gridSpacing;
		const endY = Math.ceil((bottomBound - camYoff * this.zoom) / gridSpacing) * gridSpacing;

		// Draw vertical lines
		this.context.beginPath();
		this.context.strokeStyle = "#cccccc40";
		this.context.lineWidth = 0.5;

		for (let x = startX; x <= endX; x += gridSpacing) {
			const adjustedX = x + camXoff * this.zoom;
			this.context.moveTo(adjustedX, topBound);
			this.context.lineTo(adjustedX, bottomBound);
		}

		// Draw horizontal lines
		for (let y = startY; y <= endY; y += gridSpacing) {
			const adjustedY = y + camYoff * this.zoom;
			this.context.moveTo(leftBound, adjustedY);
			this.context.lineTo(rightBound, adjustedY);
		}

		this.context.stroke();
	}
};

GraphicsRenderer.prototype.snapToGrid = function (x, y) {
	const gridSize = this.gridSpacing * this.zoom;
	const snappedX = Math.round(x / gridSize) * gridSize;
	const snappedY = Math.round(y / gridSize) * gridSize;
	return { x: snappedX, y: snappedY };
};

/**
 * This method is used to perform a specified action based on the
 * type of mouse action (action) see above MOUSEACTION
 * @param e
 * @param action
 */
GraphicsRenderer.prototype.performAction = async function (e, action) {
	switch (this.mode) {
		case this.MODES.ADDPOINT:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addPoint');
            setContextMenuMode('compadd');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				}
				this.temporaryPoints[0] = this.getCursorXLocal(); // TODO this.getCursorSnapX();
				this.temporaryPoints[1] = this.getCursorYLocal(); // TODO this.getCursorSnapY();
			} else if (action == this.MOUSEACTION.DOWN) {
				this.logicDisplay.addComponent(new Point(
					this.temporaryPoints[0],
					this.temporaryPoints[1]));
				this.saveState()
				this.execute()
				refreshHierarchy()
			}
			break;
		case this.MODES.ADDLINE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addLine');
            setContextMenuMode('compadd');
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
					this.logicDisplay.addComponent(new Line(
						this.temporaryPoints[0],
						this.temporaryPoints[1],
						this.temporaryPoints[2],
						this.temporaryPoints[3],
						this.pcbEditorMode ? this.pcbEditor.radius : this.selectedRadius));

					this.temporaryPoints[0] = this.temporaryPoints[2];
					this.temporaryPoints[1] = this.temporaryPoints[3];
					this.saveState()
					this.execute()
					refreshHierarchy()
				}
			}
			break;
		case this.MODES.ADDCIRCLE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addCircle');
            setContextMenuMode('compadd');
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
					this.logicDisplay.addComponent(new Circle(
						this.temporaryPoints[0],
						this.temporaryPoints[1],
						this.temporaryPoints[2],
						this.temporaryPoints[3]));
					this.saveState()
					this.execute()
					refreshHierarchy()
				}
			}
			break;
		case this.MODES.ADDARC:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addArc');
            setContextMenuMode('compadd');
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
			} else if (action == this.MOUSEACTION.DOWN) {
				if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					this.temporaryComponentType = COMPONENT_TYPES.CIRCLE;
					this.temporaryPoints[2] = this.getCursorXLocal();
					this.temporaryPoints[3] = this.getCursorYLocal();
				} else if (this.temporaryComponentType == COMPONENT_TYPES.CIRCLE) {
					this.temporaryComponentType = COMPONENT_TYPES.ARC;
					this.temporaryPoints[4] = this.getCursorXLocal();
					this.temporaryPoints[5] = this.getCursorYLocal();
				} else if (this.temporaryComponentType == COMPONENT_TYPES.ARC) {
					this.logicDisplay.addComponent(new Arc(
						this.temporaryPoints[0],
						this.temporaryPoints[1],
						this.temporaryPoints[2],
						this.temporaryPoints[3],
						this.temporaryPoints[4],
						this.temporaryPoints[5]));
					this.saveState()
					this.execute()
					refreshHierarchy()
				}
			}
			break;
		case this.MODES.ADDRECTANGLE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addRectangle');
            setContextMenuMode('compadd');
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
					this.logicDisplay.addComponent(new Rectangle(
						this.temporaryPoints[0],
						this.temporaryPoints[1],
						this.temporaryPoints[2],
						this.temporaryPoints[3]));
					this.saveState()
					this.execute()
					refreshHierarchy()
				}
			}
			break;
		case this.MODES.ADDMEASURE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addMeasure');
            setContextMenuMode('compadd');
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
					this.logicDisplay.addComponent(new Measure(
						this.temporaryPoints[0],
						this.temporaryPoints[1],
						this.temporaryPoints[2],
						this.temporaryPoints[3]));
					this.saveState()
					this.execute()
					refreshHierarchy()
				}
			}
			break;
		case this.MODES.ADDLABEL:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addLabel');
            setContextMenuMode('compadd');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					this.temporaryPoints[0] = this.getCursorXLocal();
					this.temporaryPoints[1] = this.getCursorYLocal();
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				let savedX = this.getCursorXLocal()
				let savedY = this.getCursorYLocal()
				callPrompt(await this.getLocal('enterText'))
					.then(text => {
						if (text.length > 0) {
							this.logicDisplay.addComponent(new Label(
								savedX,
								savedY,
								text,
								parseInt(this.fontSize)));
							this.saveState()
							this.execute()
							refreshHierarchy()
							this.setMode(this.MODES.SELECT)
						}
					})
					.catch(e => { })
			}
			break;
		case this.MODES.ADDSHAPE:
			this.cvn.css('cursor', 'crosshair');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.SHAPE;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.SHAPE) {
					this.temporaryShape.x = this.getCursorXLocal();
					this.temporaryShape.y = this.getCursorYLocal();
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				this.logicDisplay.addComponent(this.temporaryShape);
				this.resetMode()
				this.saveState()
				this.execute()
				refreshHierarchy()
			}
			break;
		case this.MODES.ADDPICTURE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addPicture');
            setContextMenuMode('compadd');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					this.temporaryPoints[0] = this.getCursorXLocal();
					this.temporaryPoints[1] = this.getCursorYLocal();
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				let savedX = this.getCursorXLocal()
				let savedY = this.getCursorYLocal()
				callPrompt('Enter valid image URL')
					.then(url => {
						if (url.length > 0) {
							this.logicDisplay.addComponent(new Picture(
								savedX,
								savedY,
								url));
							this.saveState()
							this.execute()
							refreshHierarchy()
							this.setMode(this.MODES.SELECT)
						}
					})
					.catch(e => { })
			}
			break;
		case this.MODES.ADDPOLYGON:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addPolygon');
            setContextMenuMode('compadd');
			let firstVector = {
				x: 0,
				y: 0
			}
			// Polygons follow these structures
			// Polygons follow these structures
			// [{x:num,y:num},{x:num,y:num},...]
			// If the next vector is the first one, it closes the polygon
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					this.temporaryPoints[0] = this.getCursorXLocal();
					this.temporaryPoints[1] = this.getCursorYLocal();
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POLYGON) {
					this.temporaryPoints[2] = this.getCursorXLocal();
					this.temporaryPoints[3] = this.getCursorYLocal();
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					firstVector.x = this.getCursorXLocal();
					firstVector.y = this.getCursorYLocal();
					this.temporaryComponentType = COMPONENT_TYPES.POLYGON;
					this.temporaryVectors.push(firstVector);
					this.temporaryVectorIndex++;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POLYGON) {
					let temporaryVector = {
						x: this.getCursorXLocal(),
						y: this.getCursorYLocal()
					}
					if (
						this.temporaryVectors.length > 0 &&
						temporaryVector.x == this.temporaryVectors[0].x &&
						temporaryVector.y == this.temporaryVectors[0].y
					) {
						console.log('[renderer] closing polygon');
						this.logicDisplay.addComponent(new Polygon(this.temporaryVectors));
						this.temporaryComponentType = null;
						this.temporaryVectors = [];
						this.saveState()
						this.execute()
						refreshHierarchy()
					} else if (
						this.temporaryVectors.length > 0 &&
						((Math.abs(temporaryVector.x - this.temporaryVectors[0].x) < (this.pcbEditorMode ? 2 : 10)) && 
						(Math.abs(temporaryVector.y - this.temporaryVectors[0].y) < (this.pcbEditorMode ? 2 : 10)))
					) {
						// If within 10 units of first point, add current vector and duplicate first point
						this.temporaryVectors.push(temporaryVector);
						this.temporaryVectors.push({
							x: this.temporaryVectors[0].x,
							y: this.temporaryVectors[0].y
						});
						// Create polygon and reset
						this.logicDisplay.addComponent(new Polygon(this.temporaryVectors));
						this.temporaryComponentType = null;
						this.temporaryVectors = [];
						this.saveState();
						this.execute();
						refreshHierarchy();
					} else {
						this.temporaryVectors.push(temporaryVector);
						this.temporaryVectorIndex++;
						this.temporaryPoints[0] = this.temporaryVectors[this.temporaryVectorIndex - 1].x;
						this.temporaryPoints[1] = this.temporaryVectors[this.temporaryVectorIndex - 1].y;
					}
				}
			}
		break;
		case this.MODES.NAVIGATE:
			this.cvn.css('cursor', 'default');
			this.tooltip = await this.getLocal('navigate');
            setContextMenuMode('default');
			if (action == this.MOUSEACTION.DOWN) {
				this.camMoving = true;
				this.xCNaught = this.getCursorXRaw();
				this.yCNaught = this.getCursorYRaw();
			} else if (action == this.MOUSEACTION.UP) {
				this.camMoving = false;
				this.camX += this.getCursorXRaw() - this.xCNaught;
				this.camY += this.getCursorYRaw() - this.yCNaught;
			}
			break;
		case this.MODES.MOVE:
			this.cvn.css('cursor', 'default');
            setContextMenuMode('default');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.selectedComponent == null) {
					// Cache cursor positions to avoid recalculation
					const cursorX = this.getCursorXRaw();
					const cursorY = this.getCursorYRaw();

					// Only check for intersection every other frame to reduce overhead
					if (frameCount % 2 === 0) {
						this.temporarySelectedComponent = this.findIntersectionWith(cursorX, cursorY);
					}
				} else {
					// Cache local cursor positions
					const localX = this.getCursorXLocal();
					const localY = this.getCursorYLocal();

					// Move component every frame for smooth motion 
					this.moveComponent(this.selectedComponent, localX, localY);

					// Update handles live during movement
					const component = this.logicDisplay.components[this.selectedComponent];
					// Skip handle drawing during move mode - handles are only for select mode

					// Throttle state saves and form updates to every 6 frames
					if (frameCount % 6 === 0) {
						// Use requestAnimationFrame for better performance
						requestAnimationFrame(() => {
							// Defer form updates to next idle period
							if ('requestIdleCallback' in window) {
								requestIdleCallback(() => {
									sendCurrentEditorState()
									createFormForSelection()
                                    this.saveState();
								});
							} else {
								setTimeout(() => {
									sendCurrentEditorState()
									createFormForSelection()
								}, 0);
							}
						});
					}
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				// Select the temporary component if one exists
				if (this.temporarySelectedComponent != null) {
					if (this.selectedComponent === this.temporarySelectedComponent) {
						// If clicking the already selected component, unselect it
						this.unselectComponent();
						sendCurrentEditorState();
                        this.saveState();
						clearForm();
					} else {
						// Select the component under the cursor
						this.selectComponent(this.temporarySelectedComponent);
						sendCurrentEditorState();
						createFormForSelection();
					}
				} else {
					// No component under the cursor; deselect the currently selected component
					this.unselectComponent();
					clearForm();
				}
				this.saveState();
				this.execute();
			}
			this.tooltip = await this.getLocal('move');
			break;
		case this.MODES.EDIT:
			// TODO: In the next release
			this.tooltip = "Edit (press esc to cancel)";
			break;
		case this.MODES.SELECT:
			this.cvn.css('cursor', 'default');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.selectedComponent == null) {
					this.temporarySelectedComponent = this.findIntersectionWith(
						this.getCursorXRaw(),
						this.getCursorYRaw()
					)
				} else {
					// Get the selected component
					const component = this.logicDisplay.components[this.selectedComponent];

					// If actively dragging a handle
					if (this.dragHandle) {
						// Get cursor position in world coordinates
						let localX, localY;
						if (this.enableSnap) {
							// Use uniform grid snapping regardless of grid spacing
							const snapToUniformGrid = (value) => {
								const baseGridSize = this.gridSpacing / 2;
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
						switch (component.type) {
							case COMPONENT_TYPES.LINE:
							case COMPONENT_TYPES.MEASURE:
							case COMPONENT_TYPES.CIRCLE:
								if (this.dragHandle === 'start') {
									component.x1 = localX;
									component.y1 = localY;
								} else if (this.dragHandle === 'end') {
									component.x2 = localX;
									component.y2 = localY;
								}
								break;
							case COMPONENT_TYPES.RECTANGLE:
								if (this.dragHandle === 'start') {
									// NW resize
									component.x1 = localX;
									component.y1 = localY;
								} else if (this.dragHandle === 'anchor-handle-1') {
									// NE resize 
									component.x2 = localX;
									component.y1 = localY;
								} else if (this.dragHandle === 'anchor-handle-2') {
									// SW resize
									component.x1 = localX;
									component.y2 = localY;
								} else if (this.dragHandle === 'end') {
									// SE resize
									component.x2 = localX;
									component.y2 = localY;
								}
								break;
							case COMPONENT_TYPES.ARC:
								if (this.dragHandle === 'start') {
									component.x1 = localX;
									component.y1 = localY;
								} else if (this.dragHandle === 'mid') {
									component.x2 = localX;
									component.y2 = localY;
								} else if (this.dragHandle === 'end') {
									// Only update end point (x3,y3) without affecting mid point
									component.x3 = localX;
									component.y3 = localY;
								}
								break;
							case COMPONENT_TYPES.POINT:
							case COMPONENT_TYPES.LABEL:
							case COMPONENT_TYPES.PICTURE:
								component.x = localX;
								component.y = localY;
								break;
							case COMPONENT_TYPES.POLYGON:
								if (this.dragHandle && this.dragHandle.startsWith('handle-')) {
									// Extract the index from the handle id (e.g., 'handle-0' -> 0)
									const handleIndex = parseInt(this.dragHandle.split('-')[1]);
									if (handleIndex >= 0 && handleIndex < component.vectors.length) {
										// Update the vector at the specified index
										component.vectors[handleIndex].x = localX;
										component.vectors[handleIndex].y = localY;
									}
								}
								break;
						}
						this.saveState();
						// Update form every 6 frames for better performance
						if (frameCount % 6 === 0) {
							console.log('[framecount] framecount % 6 is 0, executing optimized tick')
							// Use requestAnimationFrame for smoother updates
							window.requestAnimationFrame(() => {
								createFormForSelection();
								sendCurrentEditorState();
							});
						}
					} else {
						// Enhanced handle detection that accounts for camera position
						const handleSize = 5 / this.zoom; // Consistent handle size in world units
						const handles = this.getComponentHandles(component);
						let isOverHandle = false;

						for (const handle of handles) {
							// Calculate distance in world coordinates
							const dx = this.getCursorXLocal() - handle.x;
							const dy = this.getCursorYLocal() - handle.y;
							const distSquared = dx * dx + dy * dy;

							if (this.drawDebugPoint) {
								// Draw handle visualization (in screen space)
								const screenX = (handle.x + this.cOutX) * this.zoom;
								const screenY = (handle.y + this.cOutY) * this.zoom;
								this.context.beginPath();
								this.context.arc(screenX, screenY, handleSize * this.zoom, 0, Math.PI * 2);
								this.context.strokeStyle = this.colliderColor;
								this.context.stroke();
							}

							// Check if cursor is over handle using world coordinates
							if (distSquared < (handleSize * handleSize)) {
								this.cvn.css('cursor', handle.cursor || 'pointer');
								isOverHandle = true;
								break;
							}
						}

						if (!isOverHandle) {
							this.cvn.css('cursor', 'default');
						}
					}
				}
			} else if (action == this.MOUSEACTION.DOWN) {
				if (this.selectedComponent !== null) {
					const component = this.logicDisplay.components[this.selectedComponent];
					if (component.type !== COMPONENT_TYPES.POINT &&
						component.type !== COMPONENT_TYPES.LABEL &&
						component.type !== COMPONENT_TYPES.PICTURE) {
                        
						const handles = this.getComponentHandles(component);
						const handleSize = 5 / this.zoom;

						for (const handle of handles) {
							// Check collision in world coordinates
							const dx = this.getCursorXLocal() - handle.x;
							const dy = this.getCursorYLocal() - handle.y;
							const distSquared = dx * dx + dy * dy;

							if (distSquared < (handleSize * handleSize)) {
								this.dragHandle = handle.id;

								// Handle resizing based on handle type
								switch (handle.id) {
									case 'start':
										if (component.type === COMPONENT_TYPES.ARC) {
											component.x1 = this.getCursorXLocal();
											component.y1 = this.getCursorYLocal();
										} else {
											component.x1 = this.getCursorXLocal();
											component.y1 = this.getCursorYLocal();
										}
										break;

									case 'anchor-handle-1':
									case 'mid':
										if (component.type === COMPONENT_TYPES.ARC) {
											component.x2 = this.getCursorXLocal();
											component.y2 = this.getCursorYLocal();
										} else {
											// NE resize for rectangle
											component.x2 = this.getCursorXLocal();
											component.y1 = this.getCursorYLocal();
										}
										break;

									case 'anchor-handle-2':
										if (component.type !== COMPONENT_TYPES.ARC) {
											// SW resize for rectangle only
											component.x1 = this.getCursorXLocal();
											component.y2 = this.getCursorYLocal();
										}
										break;

									case 'end':
										if (component.type === COMPONENT_TYPES.ARC) {
											component.x3 = this.getCursorXLocal();
											component.y3 = this.getCursorYLocal();
										} else {
											component.x2 = this.getCursorXLocal();
											component.y2 = this.getCursorYLocal();
										}
										break;
								}

								this.saveState();
								return;
							}
						}
					}
				}

				if (this.temporarySelectedComponent != null) {
					if (this.selectedComponent === this.temporarySelectedComponent) {
                        setContextMenuMode('default');
						this.unselectComponent();
						clearForm();
						refreshHierarchy();
					} else {
                        setContextMenuMode('selection');
						this.selectComponent(this.temporarySelectedComponent);
						createFormForSelection();
						refreshHierarchy();
					}
				} else {
					this.unselectComponent();
					clearForm();
				}
			} else if (action == this.MOUSEACTION.UP) {
				this.dragHandle = null;
				this.cvn.css('cursor', 'default');
			}

			// Draw handles for selected component
			if (this.selectedComponent !== null) {
				const selectedComponent = this.logicDisplay.components[this.selectedComponent];
				if (selectedComponent.type !== COMPONENT_TYPES.POINT &&
					selectedComponent.type !== COMPONENT_TYPES.LABEL &&
					selectedComponent.type !== COMPONENT_TYPES.PICTURE) {
					const handlePoints = this.getComponentHandles(selectedComponent);
					if (this.lastSelectedComponent !== this.selectedComponent) {
						this.dragHandle = null;
						this.lastSelectedComponent = this.selectedComponent;
					}
				}
			}

			this.tooltip = await this.getLocal('select');
			break;
		case this.MODES.DELETE:
			this.cvn.css('cursor', 'default');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.selectedComponent == null) {
					this.temporarySelectedComponent = this.findIntersectionWith(
						this.getCursorXRaw(),
						this.getCursorYRaw());
				}
			} else if (action == this.MOUSEACTION.DOWN) {
                if (this.temporarySelectedComponent != null) {
                    this.logicDisplay.components.splice(this.temporarySelectedComponent, 1);
                }
                refreshHierarchy();
				sendCurrentEditorState();
				this.saveState();
				this.execute();
			}
			this.tooltip = await this.getLocal('delete');
			break;
		default:
			this.tooltip = this.tooltipDefault;
	}
};
GraphicsRenderer.prototype.deleteOnSelect = function () {
    // Only allow deletion in SELECT mode and if a component is selected
    if (this.mode === this.MODES.SELECT && this.selectedComponent != null) {
        this.handles = [];
        this.logicDisplay.components.splice(this.selectedComponent, 1);
        this.selectedComponent = null;
        refreshHierarchy();
        clearForm();
        sendCurrentEditorState();
        setContextMenuMode('default');
        this.saveState();
        this.execute();
    }
};
GraphicsRenderer.prototype.drawComponentSize = function (component) {
	if (!component || !component.type) return;

	// Configure text format based on component type
	let displayText = '';
	switch (component.type) {
		case COMPONENT_TYPES.RECTANGLE:
		case COMPONENT_TYPES.LINE:
			displayText = `${Number(Math.abs(component.x2 - component.x1).toFixed(2))}×${Number(Math.abs(component.y2 - component.y1).toFixed(2))}`;
			break;
		case COMPONENT_TYPES.MEASURE:
			displayText = `L: ${Number(Math.abs(component.x2 - component.x1).toFixed(2))} (${Number(this.getDistance(component.x1, component.y1, component.x2, component.y2) / 100).toFixed(2)}m)`;
			break
		case COMPONENT_TYPES.CIRCLE:
			displayText = `RAD: ${Number(Math.abs(this.getDistance(component.x1, component.y1, component.x2, component.y2)).toFixed(2))}`;
			break;
		case COMPONENT_TYPES.ARC:
			displayText = `RAD: ${Number(Math.abs(this.getDistance(component.x1, component.y1, component.x2, component.y2)).toFixed(2))}, COV: ${Math.round((Math.abs(this.getAngle(component.x1, component.y1, component.x3, component.y3)).toFixed(2) / Math.PI) * 180)}°`;
			break;
		default:
			return; // Exit for unsupported types
	}

	// Unified rendering code
	this.context.font = `18px ${getComputedStyle(document.body).getPropertyValue('--main-font')}`;
	const textWidth = this.context.measureText(displayText).width;
	const boxWidth = textWidth + 20;
	const boxX = (((component.x2 - component.x1) / 2 + component.x1) + this.cOutX) * this.zoom - (boxWidth / 2);
	const componentYPositions = [
		component.y1,
		component.y2
	];

	const lowestY = Math.max(...componentYPositions);
	const boxY = ((lowestY + this.cOutY) * this.zoom) + 7.5;

	// Draw background
	this.context.fillStyle = this.selectedColor;
	this.context.beginPath();
	this.context.roundRect(
		boxX,      // Centered X position
		boxY,      // Y position 
		boxWidth,  // Dynamic width
		25,        // Height
		5          // Border radius
	);
	this.context.fill();
	this.context.closePath();

	// Draw text
	this.context.fillStyle = '#fff';
	this.context.textBaseline = 'middle';
	this.context.textAlign = 'center';
	this.context.fillText(
		displayText,
		(((component.x2 - component.x1) / 2 + component.x1) + this.cOutX) * this.zoom,
		boxY + 15  // Vertically centered in box
	);
}
const handles = []
GraphicsRenderer.prototype.getComponentHandles = function (component) {
	if (this.selectedComponent != null || !this.logicDisplay.components[this.selectedComponent].isActive()) {
		switch (component.type) {
			case COMPONENT_TYPES.RECTANGLE:
				// Clear any existing handles first
				handles.length = 0;

				// Start handle
				handles.push({
					x: component.x1,
					y: component.y1,
					id: 'start',
					cursor: 'nw-resize'
				});
				handles.push({
					x: component.x2,
					y: component.y1,
					id: 'anchor-handle-1',
					cursor: 'ne-resize'
				});
				handles.push({
					x: component.x1,
					y: component.y2,
					id: 'anchor-handle-2',
					cursor: 'sw-resize'
				}),
					// End handle 
					handles.push({
						x: component.x2,
						y: component.y2,
						id: 'end',
						cursor: 'se-resize'
					});
				break;
			case COMPONENT_TYPES.LINE:
			case COMPONENT_TYPES.MEASURE:
			case COMPONENT_TYPES.CIRCLE:
				handles.length = 0;

				// Start handle
				handles.push({
					x: component.x1,
					y: component.y1,
					id: 'start',
					cursor: 'move'
				});
				handles.push({
					x: component.x2,
					y: component.y2,
					id: 'end',
					cursor: 'move'
				
				});
				break;
			case COMPONENT_TYPES.ARC:
				// Clear any existing handles first
				handles.length = 0;

				handles.push({
					x: component.x1,
					y: component.y1,
					id: 'start',
					cursor: 'nw-resize'
				});

				handles.push({
					x: component.x2,
					y: component.y2,
					id: 'mid',
					cursor: 'se-resize'
				});

				handles.push({
					x: component.x3,
					y: component.y3,
					id: 'end',
					cursor: 'move'
				})
				break;
			case COMPONENT_TYPES.POINT:
			case COMPONENT_TYPES.LABEL:
			case COMPONENT_TYPES.PICTURE:
			case COMPONENT_TYPES.SHAPE:
				// Clear any existing handles first
				handles.length = 0;

				handles.push({
					x: component.x,
					y: component.y,
					id: 'miscellaneous',
					cursor: 'move'
				});
				break;
			case COMPONENT_TYPES.POLYGON:
				handles.length = 0;
				component.vectors.forEach((polygonHandle, index) => {
					handles.push({
						x: polygonHandle.x,
						y: polygonHandle.y,
						id: `handle-${index}`,
						cursor: 'move'
					});
				});
				break;
		}
	}

	return handles;
};
GraphicsRenderer.prototype.undo = function () {
	// Only allow undo if there is more than one state in the stack
	if (this.undoStack.length > 1) {
		// Move the current state to the redo stack
		const state = this.undoStack.pop();
		this.redoStack.push(state);
		// The new current state is now the last in the undo stack
		const lastState = this.undoStack[this.undoStack.length - 1];
		this.logicDisplay.components = [];
		this.logicDisplay.importJSON(JSON.parse(lastState), this.logicDisplay.components);
		this.execute(); // Re-render the canvas
	}
};



GraphicsRenderer.prototype.redo = function () {
	if (this.redoStack.length > 0) {
		// Move the current state to the undoStack
		this.undoStack.push(JSON.stringify(this.logicDisplay.components));

		// Get the last state from the redoStack
		const state = this.redoStack.pop();
		console.log('upcoming state');
		console.log(state); // Log the state (optional)
		console.log('parsed state');
		console.log(JSON.parse(state)); // Log the parsed state (optional)

		// Clear the current components
		this.logicDisplay.components = [];

		// Update the display with the next state
		this.logicDisplay.importJSON(JSON.parse(state), this.logicDisplay.components);
		this.execute(); // Re-render the canvas
	}
};


GraphicsRenderer.prototype.moveComponent = function (index, x, y) {
	if (index != null) {
		switch (this.logicDisplay.components[index].type) {
			case COMPONENT_TYPES.POINT:
			case COMPONENT_TYPES.LABEL:
			case COMPONENT_TYPES.PICTURE:
			case COMPONENT_TYPES.SHAPE:
				var dx = x - this.logicDisplay.components[index].x;
				var dy = y - this.logicDisplay.components[index].y;

				this.logicDisplay.components[index].x += dx;
				this.logicDisplay.components[index].y += dy;
				break;
			case COMPONENT_TYPES.LINE:
			case COMPONENT_TYPES.CIRCLE:
			case COMPONENT_TYPES.RECTANGLE:
			case COMPONENT_TYPES.MEASURE:
				var dx = x - this.logicDisplay.components[index].x1;
				var dy = y - this.logicDisplay.components[index].y1;

				this.logicDisplay.components[index].x1 += dx;
				this.logicDisplay.components[index].y1 += dy;
				this.logicDisplay.components[index].x2 += dx;
				this.logicDisplay.components[index].y2 += dy;
				break;
			case COMPONENT_TYPES.ARC:
				var dx = x - this.logicDisplay.components[index].x1;
				var dy = y - this.logicDisplay.components[index].y1;

				this.logicDisplay.components[index].x1 += dx;
				this.logicDisplay.components[index].y1 += dy;
				this.logicDisplay.components[index].x2 += dx;
				this.logicDisplay.components[index].y2 += dy;
				this.logicDisplay.components[index].x3 += dx;
				this.logicDisplay.components[index].y3 += dy;
				break;
		}
	}
};

GraphicsRenderer.prototype.selectComponent = function (index) {
	if (index != null) {
		this.selectedComponent = index;
        setContextMenuMode('selection');
		if (this.mode === this.MODES.MOVE) {
			this.previousColor = this.logicDisplay.components[index].color;
			this.previousRadius = this.logicDisplay.components[index].radius;
			this.logicDisplay.components[index].color = this.selectedColor;
			this.logicDisplay.components[index].radius = this.selectedRadius;
		}
	}
};

GraphicsRenderer.prototype.unselectComponent = function (e) {
	if (this.selectedComponent != null) {
		if (this.mode === this.MODES.MOVE && this.previousColor) {
			this.logicDisplay.components[this.selectedComponent].color = this.previousColor;
			this.logicDisplay.components[this.selectedComponent].radius = this.previousRadius;
			this.previousColor = null;
			this.previousRadius = null;
		}
        setContextMenuMode('default');
		this.selectedComponent = null;
	}
};

GraphicsRenderer.prototype.updateCamera = function () {
	this.cOutX = this.camX;
	this.cOutY = this.camY;

	if (this.camMoving) {
		this.cOutX += this.getCursorXRaw() - this.xCNaught;
		this.cOutY += this.getCursorYRaw() - this.yCNaught;
	}
};


/**
 * This method is used to set CAD in SHAPE mode
 * @param getShape : a function that return a shape
 */
GraphicsRenderer.prototype.setModeShape = function (getShape) {
	this.setMode(this.MODES.ADDSHAPE);
	this.temporaryShape = getShape();
};

GraphicsRenderer.prototype.setMode = function (mode) {
	if (this.temporarySelectedComponent != null) {
		this.unselectComponent();
		clearForm();
	}
	this.resetMode();

	if (this.readonly)
		this.mode = this.MODES.NAVIGATE;
	else {
		this.mode = mode;
        this.temporaryVectors = [];
        this.temporaryVectorIndex = null;
		refreshToolSelection(this.mode);
        setContextMenuMode('default');
	}
};

GraphicsRenderer.prototype.resetMode = function (e) {
	this.temporaryComponentType = null;
	this.temporaryShape = null;

	for (var i = 0; i < this.temporaryPoints.length; i++)
		delete this.temporaryPoints[i];

	this.mode = -1;
	this.tooltip = this.tooltipDefault;
};

GraphicsRenderer.prototype.setZoom = function (zoomFactor) {
	// Calculate the new zoom based on the current zoom and zoomFactor
	var newZoom = this.zoom * zoomFactor;

	// Ensure zoom does not go beyond limits
	if (newZoom <= 0.4 || newZoom >= this.maxZoomFactor) {
		return;
	}

	// Set the target zoom
	this.targetZoom = newZoom;

	if (this.enableZoomWarpingToCursor == true) {
		console.log('[flag] warping enabled')
		// Get cursor position in local coordinates before zoom
		const cursorXLocal = this.getCursorXLocal();
		const cursorYLocal = this.getCursorYLocal();

		// Calculate cursor position relative to viewport center
		const viewportCenterX = this.displayWidth / 2;
		const viewportCenterY = this.displayHeight / 2;
		const cursorOffsetX = (this.mouse.cursorXGlobal - this.offsetX - viewportCenterX) / this.zoom;
		const cursorOffsetY = (this.mouse.cursorYGlobal - this.offsetY - viewportCenterY) / this.zoom;

		// Calculate the zoom difference
		const zoomDiff = this.targetZoom - this.zoom;

		// Adjust camera position to keep cursor position fixed
		// Use the local cursor position to determine the zoom center point
		this.camX -= cursorOffsetX * (zoomDiff / this.zoom);
		this.camY -= cursorOffsetY * (zoomDiff / this.zoom);
	}

	// Display the zoom level
};


GraphicsRenderer.prototype.zoomIn = function (e) {
	this.setZoom(this.zoomin);
};

GraphicsRenderer.prototype.zoomOut = function (e) {
	this.setZoom(this.zoomout);
};

GraphicsRenderer.prototype.getCursorXRaw = function (e) {
	return Math.floor(this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
};

GraphicsRenderer.prototype.getCursorYRaw = function (e) {
	return Math.floor(this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
};
GraphicsRenderer.prototype.getCursorXLocal = function (e) {
	// Base grid spacing that remains constant across zoom levels
	const baseGridSpacing = this.gridSpacing;

	// Calculate raw cursor position in world coordinates
	const rawXLocal = (this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;

	if (!this.enableSnap) {
		return rawXLocal;
	}

	// Snap to base grid spacing regardless of zoom level
	return Math.round(rawXLocal / baseGridSpacing) * baseGridSpacing;
};

GraphicsRenderer.prototype.getCursorYLocal = function (e) {
	// Base grid spacing that remains constant across zoom levels
	const baseGridSpacing = this.gridSpacing;

	// Calculate raw cursor position in world coordinates  
	const rawYLocal = (this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;

	if (!this.enableSnap) {
		return rawYLocal;
	}

	// Snap to base grid spacing regardless of zoom level
	return Math.round(rawYLocal / baseGridSpacing) * baseGridSpacing;
};

GraphicsRenderer.prototype.getCursorXInFrame = function () {
	if (this.enableSnap) {
		const screenX = this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2;
		const worldX = (screenX / this.zoom) - this.cOutX;
		const gridSize = this.gridSpacing;
		const snappedX = Math.round(worldX / gridSize) * gridSize;
		return (snappedX + this.cOutX) * this.zoom;
	} else {
		return this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2;
	}
};

GraphicsRenderer.prototype.getCursorYInFrame = function () {
	if (this.enableSnap) {
		const screenY = this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2;
		const worldY = (screenY / this.zoom) - this.cOutY;
		const gridSize = this.gridSpacing;
		const snappedY = Math.round(worldY / gridSize) * gridSize;
		return (snappedY + this.cOutY) * this.zoom;
	} else {
		return this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2;
	}
};
GraphicsRenderer.prototype.setToolTip = function (text) {
	this.tooltip = text;
};

GraphicsRenderer.prototype.getToolTip = function (e) {
	var text = this.tooltip;
	return text + ` (dx=${Math.floor(this.getCursorXLocal())};dy=${Math.floor(this.getCursorYLocal())}, ${(this.enableSnap ? "snapping" : "not snapping")}, ${fps.toFixed(0)} FPS`;
};

//TODO: Move in Utils.
GraphicsRenderer.prototype.getDistance = function (x1, y1, x2, y2) {
	var distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	return distance.toFixed(2);
};

// TODO: Move in Utils.
GraphicsRenderer.prototype.findIntersectionWith = function (x, y) {
	// Track all intersections with their distances
	const intersections = [];
	const snapBox = this.snapTolerance / this.zoom;

	// First pass: collect all intersections
	for (var i = this.logicDisplay.components.length - 1; i >= 0; i--) {
		if (!this.logicDisplay.components[i].isActive()) continue;

		// Debug visualization
		if (this.drawDebugPoint) {
			this.visualizeColliders(i, snapBox);
		}

		// Calculate intersection data
		const intersection = this.calculateIntersection(i, x, y);
		if (intersection) {
			intersections.push({
				index: i,
				distance: intersection.distance,
				type: this.logicDisplay.components[i].type,
				pointType: intersection.pointType // 'center', 'start', 'end', etc.
			});
		}
	}

	// If no intersections found, return null
	if (intersections.length === 0) return null;

	// Sort intersections by priority rules
	return this.getPrioritizedIntersection(intersections);
};

GraphicsRenderer.prototype.calculateIntersection = function (index, x, y) {
	const component = this.logicDisplay.components[index];
	const tolerance = this.snapTolerance / this.zoom;

	switch (component.type) {
		case COMPONENT_TYPES.POINT:
		case COMPONENT_TYPES.LABEL:
		case COMPONENT_TYPES.PICTURE:
		case COMPONENT_TYPES.SHAPE:
			const delta = this.getDistance(x, y, component.x, component.y);
			if (delta <= tolerance) {
				return { distance: delta, pointType: 'center' };
			}
			break;

		case COMPONENT_TYPES.LINE:
		case COMPONENT_TYPES.CIRCLE:
		case COMPONENT_TYPES.MEASURE:
			const delta1 = this.getDistance(x, y, component.x1, component.y1);
			const delta2 = this.getDistance(x, y, component.x2, component.y2);
			if (delta1 <= tolerance || delta2 <= tolerance) {
				return {
					distance: Math.min(delta1, delta2),
					pointType: delta1 < delta2 ? 'start' : 'end'
				};
			}
			break;

		case COMPONENT_TYPES.RECTANGLE:
			// Check all 4 corners of rectangle
			const nw = this.getDistance(x, y, component.x1, component.y1); // Northwest
			const ne = this.getDistance(x, y, component.x2, component.y1); // Northeast
			const sw = this.getDistance(x, y, component.x1, component.y2); // Southwest
			const se = this.getDistance(x, y, component.x2, component.y2); // Southeast

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
		case COMPONENT_TYPES.ARC:
			const deltaCenter = this.getDistance(x, y, component.x1, component.y1);
			const deltaStart = this.getDistance(x, y, component.x2, component.y2);
			const deltaEnd = this.getDistance(x, y, component.x3, component.y3);

			if (deltaCenter <= tolerance || deltaStart <= tolerance || deltaEnd <= tolerance) {
				const minDelta = Math.min(deltaCenter, deltaStart, deltaEnd);
				return {
					distance: minDelta,
					pointType: minDelta === deltaCenter ? 'center' :
						minDelta === deltaStart ? 'start' : 'end'
				};
			}
			break;
		case COMPONENT_TYPES.POLYGON:
			for (let i = 0; i < component.vectors.length; i++) {
				const vector = component.vectors[i];
				const delta = this.getDistance(x, y, vector.x, vector.y);
				if (delta <= tolerance) {
					return {
						distance: delta,
						pointType: `vector-${i}`  // Track which vertex was selected
					};
				}
			}
			break;
	}
	return null;
};

GraphicsRenderer.prototype.getPrioritizedIntersection = function (intersections) {
	// Sort by priority rules
	intersections.sort((a, b) => {
		// 1. First priority: Distance (closer = higher priority)
		if (Math.abs(a.distance - b.distance) > 0.1) {
			return a.distance - b.distance;
		}

		// 2. Second priority: Component type
		const typePriority = {
			[COMPONENT_TYPES.POINT]: 1,
			[COMPONENT_TYPES.LABEL]: 2,
			[COMPONENT_TYPES.PICTURE]: 2,
			[COMPONENT_TYPES.SHAPE]: 3,
			[COMPONENT_TYPES.LINE]: 4,
			[COMPONENT_TYPES.CIRCLE]: 5,
			[COMPONENT_TYPES.RECTANGLE]: 6,
			[COMPONENT_TYPES.ARC]: 7,
			[COMPONENT_TYPES.MEASURE]: 8
		};

		if (typePriority[a.type] !== typePriority[b.type]) {
			return typePriority[a.type] - typePriority[b.type];
		}

		// 3. Third priority: Point type within component
		const pointTypePriority = {
			'center': 1,
			'start': 2,
			'end': 3
		};

		return pointTypePriority[a.pointType] - pointTypePriority[b.pointType];
	});

	// Return the index of the highest priority intersection
	return intersections[0].index;
};

GraphicsRenderer.prototype.visualizeColliders = function (index, snapBox) {
	const component = this.logicDisplay.components[index];

	this.context.strokeStyle = this.colliderColor;
	this.context.lineWidth = 1;

	switch (component.type) {
		case COMPONENT_TYPES.POINT:
		case COMPONENT_TYPES.LABEL:
		case COMPONENT_TYPES.PICTURE:
		case COMPONENT_TYPES.SHAPE:
			this.drawCollisionBox(component.x, component.y, snapBox);
			break;

		case COMPONENT_TYPES.LINE:
		case COMPONENT_TYPES.CIRCLE:
		case COMPONENT_TYPES.RECTANGLE:
		case COMPONENT_TYPES.MEASURE:
			this.drawCollisionBox(component.x1, component.y1, snapBox);
			this.drawCollisionBox(component.x2, component.y2, snapBox);
			break;

		case COMPONENT_TYPES.ARC:
			this.drawCollisionBox(component.x1, component.y1, snapBox);
			this.drawCollisionBox(component.x2, component.y2, snapBox);
			this.drawCollisionBox(component.x3, component.y3, snapBox);
			break;
	}
};

GraphicsRenderer.prototype.drawCollisionBox = function (x, y, size) {
	this.drawRectangle(
		x - size,
		y - size,
		x + size,
		y + size,
		this.colliderColor,
		1
	);
};

GraphicsRenderer.prototype.saveComponent = function () {
	console.warn(this.logicDisplay.exportJSON())
}

//TODO: Move in Utils.
/**
 * Return the angle in radiants
 */
GraphicsRenderer.prototype.getAngle = function (x1, y1, x2, y2) {
	var PI = Math.PI;
	var dx = x2 - x1;
	var dy = y2 - y1;
	var theta = Math.atan2(dy, dx); // atan2 returns the angle in radians between -PI and PI

	// Scale the angle to the desired range (-6 to 6)
	var scaledAngle = theta * (3.15 / PI);

	return scaledAngle;
};

GraphicsRenderer.prototype.createNew = function () {
	this.logicDisplay.components = [];
	this.filePath = '';
	document.title = `New Design 1 - CompassCAD`;
	$('#titlething')[0].innerText = `New Design 1 - CompassCAD`;
	this.undoStack = [];
	this.redoStack = [];
	this.temporaryObjectArray = [];
	this.updateActivity('Starting a new design', 'On New Design 1');
};

GraphicsRenderer.prototype.openDesign = function () {
	diag.showOpenDialog({
		title: 'Open CompassCAD file',
		properties: ['openFile'],
		filters: [
			{ name: 'CompassCAD File', extensions: ['ccad'] }
		]
	}).then(res => {
		if (res.filePaths && res.filePaths[0]) {
			const fileName = res.filePaths[0];
			console.log(res.filePaths)
			document.title = `${fileName} - CompassCAD`;
			$('#titlething')[0].innerText = `${fileName} - CompassCAD`;

			fs.promises.readFile(res.filePaths[0], 'utf-8')
				.then(resp => JSON.parse(resp))
				.then(data => {
					this.logicDisplay.components = [];
					this.logicDisplay.importJSON(data, this.logicDisplay.components);
					this.filePath = res.filePaths[0];
					this.updateActivity(`Working on ${fileName}`, `On ${fileName}`);
				})
				.catch(error => {
					console.error('Error reading or parsing the file:', error);
					diag.showErrorBox('Failed to open CompassCAD file!', 'Please check the file format.');
					this.updateActivity('Working on a new design', 'On New Design 1');
				});
		}
	});
};
GraphicsRenderer.prototype.isChanged = function () {
	return this.temporaryObjectArray.length != this.logicDisplay.components.length
}
GraphicsRenderer.prototype.updateEditor = function (array) {
	console.log('[p2p] updating editor with array', array)
	let backup = JSON.stringify(this.logicDisplay.components)
	this.logicDisplay.components = []
	peerChange = true
	try {
		this.logicDisplay.importJSON(JSON.parse(array), this.logicDisplay.components)
	} catch (e) {
		this.logicDisplay.importJSON(JSON.parse(backup), this.logicDisplay.components)
		throw new Error(e)
	}
}
GraphicsRenderer.prototype.checkForAnyPeerChanges = function () {
	if (this.isChanged() == true) {
		if (this.logicDisplay.components.length == this.undoStack.length) {
		} else {
			this.saveState()
		}
	}
}
GraphicsRenderer.prototype.saveDesign = function () {
	if (this.filePath) {
		fs.writeFileSync(this.filePath, JSON.stringify(this.logicDisplay.components));
		this.setToolTip('Save success');
		callToast('Save successful!')
	} else {
		diag.showSaveDialog({
			title: 'Save CompassCAD file',
			defaultPath: 'New Design 1.ccad',
			filters: [{ name: 'CompassCAD File', extensions: ['ccad'] }]
		}).then(data => {
			if (!data.canceled) {
				this.filePath = data.filePath;
				document.title = `${data.filePath.replace(/\\/g, '/')} - CompassCAD`
				$('#titlething')[0].innerText = `${data.filePath.replace(/\\/g, '/')} - CompassCAD`
				fs.writeFileSync(this.filePath, JSON.stringify(this.logicDisplay.components));
				this.setToolTip('Save success')
				this.updateActivity(`Working on ${path.basename(this.filePath)}`, `On ${path.basename(this.filePath)}`);
			}
		});
	}
};

GraphicsRenderer.prototype.saveDesignAs = function () {
	console.log('user wants to save as!!')
	// Prompt the user to choose a save location
	diag.showSaveDialog({
		title: 'Save CompassCAD file',
		defaultPath: 'Another Design.ccad',
		filters: [
			{ name: 'CompassCAD File', extensions: ['ccad'], }
		]
	}).then(data => {
		if (!data.canceled) {
			// Save the chosen file path
			this.filePath = data.filePath;
			// Write to the chosen file path
			fs.writeFileSync(this.filePath, JSON.stringify(this.logicDisplay.components));
			this.setToolTip('Save success')
			this.temporaryObjectArray = this.logicDisplay.components
			document.title = `${data.filePath.replace(/\\/g, '/')} - CompassCAD`
			$('#titlething')[0].innerText = `${data.filePath.replace(/\\/g, '/')} - CompassCAD`
		}
	}).catch(err => {
		console.error('Error during save:', err);
	});
}
GraphicsRenderer.prototype.exportDesign = function () {
	console.log('user wants to export!!')
	// Prompt the user to choose a save location
	diag.showSaveDialog({
		title: 'Export Design',
		defaultPath: 'Design 1.svg',
		filters: [
			{ name: 'Scalable Vector Graphics', extensions: ['svg'], }
		]
	}).then(data => {
		if (!data.canceled) {
			const exporter = new SVGExporter(this)
			fs.writeFileSync(data.filePath, exporter.exportSVG());
			this.setToolTip('Export success')
			callToast('CompassCAD has successfully exported your file into SVG. Please check and examine.')
		}
	}).catch(err => {
		console.error('Error during save:', err);
		callToast('An error occured during the save. Please try again.')
	});
}
/*
 * Helper function used to initialize the
 * graphic environment and behaviour (mainly input events)
 */
var initCAD = function (gd) {
	let shiftPressed = false;
	let ctrlPressed = false;
	gd.init();

	// Bind keyboard events
	$(document).keyup(function (e) {
		if (e.key == 'Shift' || e.which == 16) {
			shiftPressed = false;
		} else if (e.key === 'Control' || e.which == 17) {
			ctrlPressed = false;
		}
		if (document.querySelector("modal:not(.hidden)") == null) {
			gd.keyboard.onKeyUp(e);
			gd.isKeyDown = false;
		}
		else
			return
	});

	$(document).keydown(function (e) {
		if (e.key == 'Shift' || e.which == 16) {
			shiftPressed = true;
		} else if (e.key === 'Control' || e.which == 17) {
			ctrlPressed = true;
		}
		if (document.querySelector("modal:not(.hidden)") == null) {
			gd.keyboard.onKeyDown(e);
			gd.isKeyDown = true;
		}
		else
			return
	});

	// Adding keyboard events 

	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.GREATERTHAN, function (e) {
		gd.zoomIn();
	});

	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.LESSTHAN, function (e) {
		gd.zoomOut();
	});

	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.FORWARDSLASH, function (e) {
		const requiredZoomFactor = 1 / renderer.zoom;
		renderer.setZoom(requiredZoomFactor);
	});

	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.N, function (e) {
		if (confirm('Are you sure? You are going to lose your design!') == true)
			renderer.createNew()
		else
			return
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.Z, function (e) {
		gd.undo()
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.Y, function (e) {
		gd.redo()
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.O, function (e) {
		gd.openDesign()
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.S, function (e) {
		gd.saveDesign()
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.E, function (e) {
		gd.exportDesign()
		gd.setMode(gd.MODES.NAVIGATE)
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.K, function (e) {
		toggleSnap()
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.C, function (e) {
		gd.copy()
	}, { ctrl: true });
    gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.DEL, function (e) {
        gd.deleteOnSelect();
    })
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.APOSTROPHE, async function (e) {
		console.log('[bootstrapper] ctrl+apostrophe pressed, firing NOW')
		const config = new ConfigHandler();
		await config.loadConfig();
		// Default grid spacings array from largest to smallest
		const gridSpacings = await config.getGridSettings() || [100, 50, 25, 10];
		console.log(gridSpacings)

		// Get current grid spacing
		let currentSpacing = gd.gridSpacing;

		// Find the next grid spacing
		let nextSpacing;

		// Find current index in grid spacings
		let currentIndex = gridSpacings.indexOf(currentSpacing);

		if (currentIndex === -1) {
			// Current spacing not in array, find nearest larger spacing
			for (let i = 0; i < gridSpacings.length; i++) {
				if (gridSpacings[i] <= currentSpacing) {
					currentIndex = i;
					break;
				}
			}
			if (currentIndex === -1) {
				currentIndex = gridSpacings.length - 1;
			}
		}

		// Get next smaller grid spacing
		nextSpacing = currentIndex < gridSpacings.length - 1 ?
			gridSpacings[currentIndex + 1] :
			gridSpacings[0];

		// Update grid spacing
		gd.gridSpacing = nextSpacing;
		document.getElementById('grid-selector').value = nextSpacing;
		console.log('[bootstrap] next spacing: ' + nextSpacing);
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.SEMICOLON_CHROME, async function (e) {
		console.log('[bootstrapper] ctrl+semicolon (chrome) pressed, firing NOW')
		const config = new ConfigHandler();
		await config.loadConfig();
		// Default grid spacings array from largest to smallest
		const gridSpacings = await config.getGridSettings() || [100, 50, 25, 10];
		console.log(gridSpacings)

		// Get current grid spacing
		let currentSpacing = gd.gridSpacing;

		// Find the next grid spacing
		let nextSpacing;

		// Find current index in grid spacings
		let currentIndex = gridSpacings.indexOf(currentSpacing);

		if (currentIndex === -1) {
			// Current spacing not in array, find nearest smaller spacing
			for (let i = gridSpacings.length - 1; i >= 0; i--) {
				if (gridSpacings[i] >= currentSpacing) {
					currentIndex = i;
					break;
				}
			}
			if (currentIndex === -1) {
				currentIndex = 0;
			}
		}

		// Get next larger grid spacing (opposite direction)
		nextSpacing = currentIndex > 0 ?
			gridSpacings[currentIndex - 1] :
			gridSpacings[gridSpacings.length - 1];

		// Update grid spacing
		gd.gridSpacing = nextSpacing;
		document.getElementById('grid-selector').value = nextSpacing;
		console.log('[bootstrap] next spacing: ' + nextSpacing);
	}, { ctrl: true })
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.V, function (e) {
		gd.weirdPaste();
	}, { ctrl: true });
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.X, function (e) {
		gd.cut()
	}, { ctrl: true });

	// Bind mouse events
	gd.cvn.mousemove(function (e) {
		gd.mouse.onMouseMove(e);

		if (!gd.gridPointer)
			gd.gridPointer = true;

		gd.performAction(e, gd.MOUSEACTION.MOVE);
		
		// Send cursor position to peers
		if (typeof network !== 'undefined' && network.peer) {
			network.sendCursorPosition(
				gd.getCursorXLocal(),
				gd.getCursorYLocal()
			);
		}
	});

	gd.cvn.mouseout(function (e) {
		gd.gridPointer = false;
	});
	/*
	if (action == this.MOUSEACTION.DOWN) {
				this.camMoving = true;
				this.xCNaught = this.getCursorXRaw();
				this.yCNaught = this.getCursorYRaw();
			} else if (action == this.MOUSEACTION.UP) {
				this.camMoving = false;
				this.camX += this.getCursorXRaw() - this.xCNaught;
				this.camY += this.getCursorYRaw() - this.yCNaught;
			}
	*/
	gd.cvn.mousedown(function (e) {
		if (e.which === 2) { // Middle mouse button
			gd.camMoving = true;
			gd.xCNaught = gd.getCursorXRaw();
			gd.yCNaught = gd.getCursorYRaw();
		} else if (e.which === 1) {
			gd.mouse.onMouseDown(e);
			gd.performAction(e, gd.MOUSEACTION.DOWN);
            document.getElementById('context-menu').style.display = 'none';
		} else {
            document.getElementById('context-menu').style.display = 'flex';
            document.getElementById('context-menu').style.left = (e.pageX + 15) + 'px';
            document.getElementById('context-menu').style.top = (e.pageY + 15) + 'px';
        }
	});

	gd.cvn.mouseup(function (e) {
		if (e.which === 2) { // Middle mouse button
			gd.camMoving = false;
			gd.camX += gd.getCursorXRaw() - gd.xCNaught;
			gd.camY += gd.getCursorYRaw() - gd.yCNaught;
			gd.updateCamera();
		} else if (e.which === 1) {
			gd.mouse.onMouseUp(e);
			gd.performAction(e, gd.MOUSEACTION.UP);
		}
	});
	gd.cvn.mouseleave(function (e) {
		gd.mouse.onMouseLeave(e);
		console.warn('Mouse left')
	});
	// enableNewScrollControls
	gd.cvn.on('wheel', (event) => {
		if (gd.enableNewScrollControls == true) {
			event.preventDefault();
			if (event.originalEvent.deltaY < 0) {
				// Basically a scroll up
				if (shiftPressed) {
					gd.camX += 50;
				} else if (ctrlPressed) {
					gd.zoomIn();
				} else {
					gd.camY += 50;
				}
			} else {
				// This is a scroll down
				if (shiftPressed) {
					gd.camX -= 50;
				} else if (ctrlPressed) {
					gd.zoomOut();
				} else {
					gd.camY -= 50;
				}
			}
		} else {
			let zoomFactor = 1
			if (event.originalEvent.deltaY < 0) {
				gd.zoomIn()
			} else {
				gd.zoomOut()
			}
			console.log(`Zoom factor: ${zoomFactor}`);
			event.preventDefault();
		}
	});

	// Start CAD
	let animationFrameId;
	let isWindowFocused = true;

	// Focus/blur event listeners
	window.addEventListener('focus', () => {
		isWindowFocused = true;
		// Restart animation loop when window regains focus
		if (!animationFrameId) {
			repeatInstance();
		}
	});

	window.addEventListener('blur', () => {
		isWindowFocused = false;
		// Cancel animation frame when window loses focus
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	});

	function repeatInstance() {
		// Only run animation if window is focused
		if (isWindowFocused) {
			const currentTime = performance.now();
			frameCount++;

			if (currentTime - lastTime >= 1000) {
				fps = frameCount;
				frameCount = 0;
				lastTime = currentTime;

				if (fps < fpsWarningThreshold && !warningDisplayed) {
					console.warn('FPS dropped below 20!');
					document.getElementById('fps-warner').style.display = 'inline-flex';
				} else if (fps >= fpsWarningThreshold) {
					document.getElementById('fps-warner').style.display = 'none';
				}
			}

			gd.execute();
			animationFrameId = requestAnimationFrame(repeatInstance);
		}
	}

	// Start initial animation
	repeatInstance();

	// Keep peer changes check interval but at a longer interval when unfocused
	setInterval(() => {
		if (isWindowFocused) {
			gd.checkForAnyPeerChanges();
			updateBattery();
		}
	}, isWindowFocused ? 250 : 1000);
};
