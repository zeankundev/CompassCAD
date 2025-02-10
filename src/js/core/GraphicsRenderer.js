const $ = require('jquery')
const rpc = require('discord-rpc')
const client = new rpc.Client({transport: 'ipc'})
client.login({clientId: '1309147585130397736'}).catch(console.error)
const diag = require('@electron/remote').dialog
const fs = require('fs');
const { BrowserWindow } = require('@electron/remote');
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let fpsWarningThreshold = 20;
let warningDisplayed = false;
function GraphicDisplay(displayName, width, height) {
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
	this.selectedRadius = "2";

	this.logicDisplay;

	this.counter = 0;
	this.undoStack = []
	this.redoStack = []
	this.temporaryObjectArray = []
	this.lastArray = [];

	this.displayWidth = width;
	this.displayHeight = height;
	this.offsetX = 0;
	this.offsetY = 0;

	// Camera
	this.camX = 0;
	this.camY = 0;
	this.zoom = 1;
	this.zoomin = 3/2;
	this.zoomout = 2/3;
	this.currentZoom = 1; // Add this to your initialization
	this.targetZoom = 1;  // Add this to your initialization
	this.zoomSpeed = 0.4 // Adjust the speed of the zoom transition
	this.maxZoomFactor = 10;
	this.camMoving = false;
	this.xCNaught = 0;
	this.yCNaught = 0;
	this.cOutX = 0;
	this.cOutY = 0;

	this.inFocus = false;
	this.initResize = false;

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
	this.enableLegacyGridStyle = false;
	this.enableSnap = true;
}

GraphicDisplay.prototype.init = async function (e) {
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
	this.context = this.cvn[0].getContext('2d');
	this.execute()
	this.gridSpacing = await this.config.getValueKey("gridSpacing")
	this.fontSize = await this.config.getValueKey("fontSize");
	this.maximumStack = await this.config.getValueKey("maximumStack");
	this.updateActivity('Starting a new design', 'On New Design 1');
	clearForm()
};
GraphicDisplay.prototype.updateActivity = function (details = null) {
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
GraphicDisplay.prototype.lerp = function (start, end, time) {
	return start + (end - start) * time;
}
GraphicDisplay.prototype.getLocal = async function (key) {
	return await this.translator.getLocalizedString(key);
}
GraphicDisplay.prototype.execute = async function (e) {
	const disableLerp = await this.config.getValueKey("disableLerp");
	const useOldGrid = await this.config.getValueKey("useOldGrid");
	this.preferredFont = await this.config.getValueKey("preferredFont");
	this.offsetX = this.cvn.offset().left;
	this.offsetY = this.cvn.offset().top;
	this.enableLegacyGridStyle = useOldGrid;
	// Handle zoom interpolation
	if (disableLerp !== true) {
		this.currentZoom = this.lerp(this.currentZoom, this.targetZoom, this.zoomSpeed);
	} else {
		this.currentZoom = this.targetZoom;
	}
	this.zoom = this.currentZoom;
	this.updateCamera();

	// Clear and redraw grid
	this.clearGrid();
	if (this.pcbEditorMode) {
		this.showGrid = false;
		this.gridSpacing = 2;
		this.maxZoomFactor = 12;
		this.conversionFactor = 2.7;
		this.unitMeasure = 'mm';
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

	if (this.selectedComponent != null) {
		console.log('[handle] tick: not null')
		const handles = this.getComponentHandles(this.selectedComponent)
		for (const handle of handles) {
			if (this.logicDisplay.components[this.selectedComponent].isActive()) {
				console.log('[handles] drawing handles (called)...')
				this.drawPoint(handle.x, handle.y, '#fff', 2)
			}
		}
	}
	// Draw rules and tooltips
	this.drawRules();
	this.drawToolTip();

	// Update Rich Presence only when the component count changes
	this.updateActivity()
};


GraphicDisplay.prototype.saveState = function () {
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
		sendCurrentEditorState();
	  } else {
		doupdatestack = true;
	  }
  
	  // Clear the redo stack when a new action is performed
	  this.redoStack = [];
	}
  };

GraphicDisplay.prototype.returnLatexInstance = async function(latex) {
	const MathJaxInstance = await MathJax;

    return MathJaxInstance.tex2svg(latex, {display: true});
}
GraphicDisplay.prototype.clearGrid = function (e) {
	this.context.restore();
	this.context.fillStyle = "#202020";
	this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
	this.context.save();

	this.context.translate(this.displayWidth / 2, this.displayHeight / 2);
	this.context.strokeStyle = "#cccccc40";
	this.context.lineWidth = 0.15;
};

GraphicDisplay.prototype.drawAllComponents = function (components, moveByX, moveByY) {
	for (var i = 0; i < components.length; i++) {
		if (!components[i].isActive())
			continue;

		this.drawComponent(components[i], moveByX, moveByY);
	}
};

GraphicDisplay.prototype.drawComponent = function (component, moveByX, moveByY) {
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
};

/**
 * This method is used to draw current temporary component
 */
GraphicDisplay.prototype.drawTemporaryComponent = function (e) {
	switch (this.temporaryComponentType) {
		case COMPONENT_TYPES.POINT:
			this.drawPoint(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.selectedColor,
				this.selectedRadius);
			break;
		case COMPONENT_TYPES.LINE:
			this.drawLine(
				this.temporaryPoints[0],
				this.temporaryPoints[1],
				this.temporaryPoints[2],
				this.temporaryPoints[3],
				this.selectedColor,
				this.pcbEditorMode ? this.pcbEditor.radius : this.selectedRadius);
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
};

GraphicDisplay.prototype.drawPoint = function (x, y, color, radius) {
	this.context.lineWidth = 3 * this.zoom;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.arc(
		(x + this.cOutX) * this.zoom,
		(y + this.cOutY) * this.zoom,
		2 * this.zoom, 0, 3.14159 * 2, false);
	this.context.closePath();
	this.context.stroke();
};

GraphicDisplay.prototype.drawLine = function (x1, y1, x2, y2, color, radius) {
    this.context.lineWidth = radius * this.zoom;
    this.context.fillStyle = color;
    this.context.strokeStyle = color;
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

GraphicDisplay.prototype.drawCircle = function (x1, y1, x2, y2, color, radius) {
	this.context.lineWidth = radius * this.zoom;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.arc(
		(x1 + this.cOutX) * this.zoom,
		(y1 + this.cOutY) * this.zoom,
		this.getDistance(x1, y1, x2, y2) * this.zoom,
		0, 3.14159 * 2, false);
	this.context.closePath();
	this.context.stroke();
};

GraphicDisplay.prototype.drawRectangle = function (x1, y1, x2, y2, color, radius) {
	this.drawLine(x1, y1, x2, y1, color, radius);
	this.drawLine(x2, y1, x2, y2, color, radius);
	this.drawLine(x2, y2, x1, y2, color, radius);
	this.drawLine(x1, y2, x1, y1, color, radius);
};

GraphicDisplay.prototype.drawMeasure = async function (x1, y1, x2, y2, color, radius) {
    // Calculate the distance between the two points
	if (this.pcbEditorMode)
    	var distance = (this.getDistance(x1, y1, x2, y2) * this.unitFactor * (this.unitConversionFactor / 0.37)) * 10;
	else
	var distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;

    // Calculate the angle of the line in radians
    var angle = Math.atan2(y2 - y1, x2 - x1);

    // Adjust zoom levels
    var localZoom = this.zoom;
    var localDiff = 0;
    if (this.zoom <= 0.25) {
        localZoom = 0.5;
        localDiff = 20;
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
    const minDistanceForFullArrow = defaultArrowLength * 2 / 100; // 0.5 meters
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

        this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius); 
        this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius);
    }

    // Draw arrowheads
    this.drawArrowhead(x1, y1, angle, arrowLength, arrowOffset, color, radius);
    this.drawArrowhead(x2, y2, angle, -arrowLength, arrowOffset, color, radius);

    // Save context to apply rotation for the label
    this.context.save();
    this.context.translate((midX * this.zoom) + this.cOutX * this.zoom, ((midY * this.zoom) + (textOffsetY * 2)) + this.cOutY * this.zoom);
    this.context.rotate(angle);

    // Set text alignment to center
    this.context.textAlign = 'center';
    this.context.textBaseline = isShortDistance ? 'top' : 'middle';
    this.context.fillStyle = color;
    this.context.font = (this.fontSize * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;

    // Draw the text slightly above the line if distance is short
    this.context.fillText(distanceText, 0, localDiff);

    // Restore the context to avoid affecting subsequent drawings
    this.context.restore();
};

GraphicDisplay.prototype.drawArrowhead = function (x, y, angle, length, offset, color, radius) {
    var arrowX = x + length * Math.cos(angle);
    var arrowY = y + length * Math.sin(angle);
    var offsetX = offset * Math.cos(angle + Math.PI / 2);
    var offsetY = offset * Math.sin(angle + Math.PI / 2);

    this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius);
    this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius);
    this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius);
};

GraphicDisplay.prototype.drawLabel = async function (x, y, text, color, radius) {
	this.drawPoint(x, y, '#0ff', 2);

	var localZoom = this.zoom;
	var localDiff = 0;

	if (this.zoom <= 0.25) {
		localZoom = 0.5;
		localDiff = 20;
		y += localDiff;
	}

	this.context.fillStyle = color;
	this.context.font = (this.fontSize * localZoom) + `px ${this.preferredFont}, Consolas, DejaVu Sans Mono, monospace`;

	var maxLength = 24; // 24 Characters per row
	var tmpLength = 0;
	var tmpText = "";
	var arrText = this.logicDisplay.customSyntax(text).split(" ");

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
};

GraphicDisplay.prototype.drawArc = function (x1, y1, x2, y2, x3, y3, color, radius) {
	var firstAngle = this.getAngle(x1, y1, x2, y2);
	var secondAngle = this.getAngle(x1, y1, x3, y3);

	this.context.lineWidth = radius * this.zoom;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.arc(
		(x1 + this.cOutX) * this.zoom,
		(y1 + this.cOutY) * this.zoom,
		this.getDistance(x1, y1, x2, y2) * this.zoom,
		firstAngle, secondAngle, false);
	this.context.stroke();
};

GraphicDisplay.prototype.drawShape = function (shape) {
	this.drawAllComponents(shape.components, shape.x, shape.y);
	this.drawPoint(shape.x, shape.y, shape.color, shape.radius);
};
GraphicDisplay.prototype.drawPicture = function (x, y, basedURL) {
	this.drawPoint(x, y, '#0ff', 2);

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
		this.renderImage(x, y, this.imageCache[basedURL]);
	}
};

GraphicDisplay.prototype.renderImage = function (x, y, img) {
	if (img == true) {
		// Draw a placeholder shape with X when image fails to load
		const errorShape = {
			components: [
				// Rectangle borders
				new Circle(0, 0, 10, 10),
				
				// X cross
				new Line(-7, -7, 7, 7, 2),
				new Line(-7, 7, 7, -7, 2),
				
				// Error text
				new Label(17, 6, "Image Error")
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

	this.context.drawImage(
		img,
		(x + this.cOutX) * this.zoom,
		(y + this.cOutY) * this.zoom,
		width,
		height
	);
};

GraphicDisplay.prototype.drawToolTip = function (e) {
    // Shadow effect (black text offset by 5px to the right and bottom)
	this.context.shadowColor = "black";
	this.context.shadowOffsetX = 2;
	this.context.shadowOffsetY = 2;

    // Tooltip text
    this.context.fillStyle = "#fff"; // Set text color to white
    this.context.font = "13px 'Segoe UI Variable Display', system-ui";
    this.context.fillText(this.getToolTip(), -this.displayWidth / 2 + 10, this.displayHeight / 2 - 10);
};


GraphicDisplay.prototype.drawOrigin = function (cx, cy) {
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

GraphicDisplay.prototype.drawRules = function (e) {
	if (!this.showRules)
		return;

	if (this.gridPointer) {
		this.context.lineWidth = 0.2;
		this.context.globalCompositeOperation='source-atop';
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

	// TODO Show rules!
};

GraphicDisplay.prototype.drawGrid = function (camXoff, camYoff) {
	if (!this.enableLegacyGridStyle) {
		// Modern dot grid style
		// Base grid spacing adjusted by zoom
		const gridSpacingAdjusted = (this.gridSpacing * 2) * this.zoom;
		
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
		const leftBound = -this.displayWidth/2;
		const rightBound = this.displayWidth/2;
		const topBound = -this.displayHeight/2;
		const bottomBound = this.displayHeight/2;

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
		const leftBound = -this.displayWidth/2;
		const rightBound = this.displayWidth/2;
		const topBound = -this.displayHeight/2;
		const bottomBound = this.displayHeight/2;

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

GraphicDisplay.prototype.snapToGrid = function (x, y) {
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
GraphicDisplay.prototype.performAction = async function (e, action) {
	switch (this.mode) {
		case this.MODES.ADDPOINT:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addPoint');
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
			}
			break;
		case this.MODES.ADDLINE:
			if (e.which == 3)

				this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addLine');
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
				}
			}
			break;
		case this.MODES.ADDCIRCLE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addCircle');
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
				}
			}
			break;
		case this.MODES.ADDARC:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addArc');
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
				}
			}
			break;
		case this.MODES.ADDRECTANGLE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addRectangle');
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
				}
			}
			break;
		case this.MODES.ADDMEASURE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addMeasure');
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
				}
			}
			break;
		case this.MODES.ADDLABEL:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addLabel');
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
								text));
							this.saveState()
							this.execute()
							this.setMode(this.MODES.NAVIGATE)
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
			}
			break;
		case this.MODES.ADDPICTURE:
			this.cvn.css('cursor', 'crosshair');
			this.tooltip = await this.getLocal('addPicture');
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
							this.setMode(this.MODES.NAVIGATE)
						}
					})
					.catch(e => { })
			}
			break;
		case this.MODES.NAVIGATE:
			this.cvn.css('cursor', 'default');
			this.tooltip = await this.getLocal('navigate');
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
								this.saveState();
								// Defer form updates to next idle period
								if ('requestIdleCallback' in window) {
									requestIdleCallback(() => {
										sendCurrentEditorState()
										createFormForSelection()
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
					// Find component under cursor
					this.temporarySelectedComponent = this.findIntersectionWith(
						this.getCursorXRaw(),
						this.getCursorYRaw()
					);
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
							case COMPONENT_TYPES.RECTANGLE:
							case COMPONENT_TYPES.CIRCLE:
								if (this.dragHandle === 'start') {
									component.x1 = localX;
									component.y1 = localY;
								} else if (this.dragHandle === 'end') {
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
							this.cvn.css('cursor', 'move');
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
								return;
							}
						}
					}
				}
				
				if (this.temporarySelectedComponent != null) {
					if (this.selectedComponent === this.temporarySelectedComponent) {
						this.unselectComponent();
						clearForm();
					} else {
						this.selectComponent(this.temporarySelectedComponent);
						createFormForSelection();
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
					this.logicDisplay.components[this.temporarySelectedComponent].setActive(false);
				}
				sendCurrentEditorState()
				this.saveState()
				this.execute()
			}
			this.tooltip = await this.getLocal('delete');
			break;
		default:
			this.tooltip = this.tooltipDefault;
	}
};
const handles = []
GraphicDisplay.prototype.getComponentHandles = function(component) {
	if (this.selectedComponent != null || !this.logicDisplay.components[this.selectedComponent].isActive()) {
		switch(component.type) {
			case COMPONENT_TYPES.LINE:
			case COMPONENT_TYPES.RECTANGLE:
			case COMPONENT_TYPES.CIRCLE:
				// Clear any existing handles first
				handles.length = 0;
				
				// Start handle
				handles.push({
					x: component.x1,
					y: component.y1,
					id: 'start',
					cursor: 'nw-resize'
				});
				// End handle 
				handles.push({
					x: component.x2,
					y: component.y2, 
					id: 'end',
					cursor: 'se-resize'
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
		}
	}
	
	return handles;
};
GraphicDisplay.prototype.undo = function () {
	if (this.undoStack.length > 0) {
		// Remove the last state from the undoStack and push it to the redoStack
		const state = this.undoStack.pop();
		this.redoStack.push(state);
		// Get the new last state from the undoStack (if any) to apply to the logicDisplay
		const lastState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;

		if (lastState) {
			this.logicDisplay.components = []
			this.logicDisplay.importJSON(JSON.parse(lastState), this.logicDisplay.components);
		} else
			return

		this.execute(); // Re-render the canvas
	}
};



GraphicDisplay.prototype.redo = function () {
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


GraphicDisplay.prototype.moveComponent = function (index, x, y) {
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

GraphicDisplay.prototype.selectComponent = function (index) {
	if (index != null) {
		this.selectedComponent = index;
		if (this.mode === this.MODES.MOVE) {
			this.previousColor = this.logicDisplay.components[index].color;
			this.previousRadius = this.logicDisplay.components[index].radius;
			this.logicDisplay.components[index].color = this.selectedColor;
			this.logicDisplay.components[index].radius = this.selectedRadius;
		}
	}
};

GraphicDisplay.prototype.unselectComponent = function (e) {
	if (this.selectedComponent != null) {
		if (this.mode === this.MODES.MOVE && this.previousColor) {
			this.logicDisplay.components[this.selectedComponent].color = this.previousColor;
			this.logicDisplay.components[this.selectedComponent].radius = this.previousRadius;
			this.previousColor = null;
			this.previousRadius = null;
		}
		this.selectedComponent = null;
	}
};

GraphicDisplay.prototype.updateCamera = function () {
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
GraphicDisplay.prototype.setModeShape = function (getShape) {
	this.setMode(this.MODES.ADDSHAPE);
	this.temporaryShape = getShape();
};

GraphicDisplay.prototype.setMode = function (mode) {
	if (this.temporarySelectedComponent != null) {
		this.unselectComponent();
		clearForm();
	}
	this.resetMode();

	if (this.readonly)
		this.mode = this.MODES.NAVIGATE;
	else
		this.mode = mode;
};

GraphicDisplay.prototype.resetMode = function (e) {
	this.temporaryComponentType = null;
	this.temporaryShape = null;

	for (var i = 0; i < this.temporaryPoints.length; i++)
		delete this.temporaryPoints[i];

	this.mode = -1;
	this.tooltip = this.tooltipDefault;
};

GraphicDisplay.prototype.setZoom = function (zoomFactor) {
    // Calculate the new zoom based on the current zoom and zoomFactor
    var newZoom = this.zoom * zoomFactor;
    console.log(newZoom);
    // Ensure zoom does not go beyond limits
    if (newZoom <= 0.4 || newZoom >= this.maxZoomFactor) {
		console.log(`[zoom] set zoom to ${newZoom}`);
        return;
    } else {
		console.log('[zoom] ignoring zoom...');
	}
    // Set the target zoom normally
    this.targetZoom = newZoom;
    // Display the zoom level
    document.getElementById('zoom-level').innerText = `${this.targetZoom.toFixed(3)}x`;
};


GraphicDisplay.prototype.zoomIn = function (e) {
	this.setZoom(this.zoomin);
};

GraphicDisplay.prototype.zoomOut = function (e) {
	this.setZoom(this.zoomout);
};

GraphicDisplay.prototype.getCursorXRaw = function (e) {
	return Math.floor(this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
};

GraphicDisplay.prototype.getCursorYRaw = function (e) {
	return Math.floor(this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
};
GraphicDisplay.prototype.getCursorXLocal = function (e) {
    if (this.enableSnap) {
		const adjustedGridSpacing = Math.max(this.gridSpacing, this.gridSpacing * this.zoom / 6);
		const rawXLocal = (this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
		return Math.round(rawXLocal / adjustedGridSpacing) * adjustedGridSpacing;
	} else {
		return (this.mouse.cursorXGlobal - this.offsetX - this.displayWidth / 2) / this.zoom - this.camX;
	}
};

GraphicDisplay.prototype.getCursorYLocal = function (e) {
    if (this.enableSnap) {
		const adjustedGridSpacing = Math.max(this.gridSpacing, this.gridSpacing * this.zoom / 6);
		const rawYLocal = (this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
		return Math.round(rawYLocal / adjustedGridSpacing) * adjustedGridSpacing;
	} else {
		return (this.mouse.cursorYGlobal - this.offsetY - this.displayHeight / 2) / this.zoom - this.camY;
	}
};

GraphicDisplay.prototype.getCursorXInFrame = function () {
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

GraphicDisplay.prototype.getCursorYInFrame = function () {
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
GraphicDisplay.prototype.setToolTip = function (text) {
	this.tooltip = text;
};

GraphicDisplay.prototype.getToolTip = function (e) {
	var text = this.tooltip;
	return text + ` (dx=${Math.floor(this.getCursorXLocal())};dy=${Math.floor(this.getCursorYLocal())}, ${(this.enableSnap ? "snapping" : "not snapping")}, ${fps.toFixed(0)} FPS)`;
};

//TODO: Move in Utils.
GraphicDisplay.prototype.getDistance = function (x1, y1, x2, y2) {
	var distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
	return distance.toFixed(2);
};

// TODO: Move in Utils.
GraphicDisplay.prototype.findIntersectionWith = function (x, y) {
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

GraphicDisplay.prototype.calculateIntersection = function(index, x, y) {
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
		case COMPONENT_TYPES.RECTANGLE:
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
	}
	return null;
};

GraphicDisplay.prototype.getPrioritizedIntersection = function(intersections) {
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

GraphicDisplay.prototype.visualizeColliders = function(index, snapBox) {
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

GraphicDisplay.prototype.drawCollisionBox = function(x, y, size) {
	this.drawRectangle(
		x - size,
		y - size,
		x + size,
		y + size,
		this.colliderColor,
		1
	);
};

GraphicDisplay.prototype.saveComponent = function () {
	console.warn(this.logicDisplay.exportJSON())
}

//TODO: Move in Utils.
/**
 * Return the angle in radiants
 */
GraphicDisplay.prototype.getAngle = function (x1, y1, x2, y2) {
	var PI = Math.PI;
	var dx = x2 - x1;
	var dy = y2 - y1;
	var theta = Math.atan2(dy, dx); // atan2 returns the angle in radians between -PI and PI

	// Scale the angle to the desired range (-6 to 6)
	var scaledAngle = theta * (3.15 / PI);

	return scaledAngle;
};

GraphicDisplay.prototype.createNew = function () {
	this.logicDisplay.components = [];
	this.filePath = '';
	document.title = `New Design 1 - CompassCAD`;
	$('#titlething')[0].innerText = `New Design 1 - CompassCAD`;
	this.undoStack = [];
	this.redoStack = [];
	this.temporaryObjectArray = [];
	this.updateActivity('Starting a new design', 'On New Design 1');
};

GraphicDisplay.prototype.openDesign = function () {
	diag.showOpenDialog({
		title: 'Open CompassCAD file',
		properties: ['openFile'],
		filters: [
			{ name: 'CompassCAD File', extensions: ['ccad'] }
		]
	}).then(res => {
		if (res.filePaths && res.filePaths[0]) {
			const fileName = path.basename(res.filePaths[0]);
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
GraphicDisplay.prototype.isChanged = function () {
	return this.temporaryObjectArray.length != this.logicDisplay.components.length
}
GraphicDisplay.prototype.updateEditor = function (array) {
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
GraphicDisplay.prototype.checkForAnyPeerChanges = function () {
	if (this.isChanged() == true) {
		if (this.logicDisplay.components.length == this.undoStack.length) {
		} else {
			this.saveState()
		}
	}
}
GraphicDisplay.prototype.saveDesign = function () {
	if (this.filePath) {
		fs.writeFileSync(this.filePath, JSON.stringify(this.logicDisplay.components));
		this.setToolTip('Save success')
	} else {
		diag.showSaveDialog({
			title: 'Save CompassCAD file',
			defaultPath: 'New Design 1.ccad',
			filters: [{ name: 'CompassCAD File', extensions: ['ccad'] }]
		}).then(data => {
			if (!data.canceled) {
				this.filePath = data.filePath;
				fs.writeFileSync(this.filePath, JSON.stringify(this.logicDisplay.components));
				this.setToolTip('Save success')
				this.updateActivity(`Working on ${path.basename(this.filePath)}`, `On ${path.basename(this.filePath)}`);
			}
		});
	}
};

GraphicDisplay.prototype.saveDesignAs = function () {
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
			document.title = `${data.filePath[0].replace(/\\/g, '/')} - CompassCAD`
			$('#titlething')[0].innerText = `${data.filePath[0].replace(/\\/g, '/')} - CompassCAD`
		}
	}).catch(err => {
		console.error('Error during save:', err);
	});
}
GraphicDisplay.prototype.exportDesign = function () {
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
	gd.init();

	// Bind keyboard events
	$(document).keyup(function (e) {
		if (document.querySelector("modal:not(.hidden)") == null)
			gd.keyboard.onKeyUp(e);
		else
			return
	});

	$(document).keydown(function (e) {
		if (document.querySelector("modal:not(.hidden)") == null)
			gd.keyboard.onKeyDown(e);
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

	// Bind mouse events
	gd.cvn.mousemove(function (e) {
		gd.mouse.onMouseMove(e);

		if (!gd.gridPointer)
			gd.gridPointer = true;

		gd.performAction(e, gd.MOUSEACTION.MOVE);
	});

	gd.cvn.mouseout(function (e) {
		gd.gridPointer = false;
	});

	gd.cvn.mousedown(function (e) {
		gd.mouse.onMouseDown(e);
		gd.performAction(e, gd.MOUSEACTION.DOWN);
	});

	gd.cvn.mouseup(function (e) {
		gd.mouse.onMouseUp(e);
		gd.performAction(e, gd.MOUSEACTION.UP);
	});
	gd.cvn.on('wheel', (event) => {
		let zoomFactor = 1
		if (event.originalEvent.deltaY < 0) {
			gd.zoomIn()
		} else {
			gd.zoomOut()
		}
		console.log(`Zoom factor: ${zoomFactor}`);
		event.preventDefault();
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
		}
	}, isWindowFocused ? 250 : 1000);
};

