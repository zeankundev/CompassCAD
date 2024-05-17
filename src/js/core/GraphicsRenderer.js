const $ = require('jquery')
const diag = require('@electron/remote').dialog
const fs = require('fs')
const prompt = require('electron-prompt')
function GraphicDisplay(displayName, width, height) {
	// Enumerate all available modes
	this.MODES = {
			ADDPOINT : 1,
			ADDLINE : 2,
			ADDCIRCLE : 3,
			ADDRECTANGLE : 4,
			ADDARC : 5,
			ADDMEASURE : 6,
			ADDLABEL : 7,
			ADDSHAPE : 8,
			DELETE : 20,
			TRIM : 21,
			NAVIGATE : 22,
			MOVE : 23,
			EDIT : 24
	};
	
	// Enumerate all type of action
	this.MOUSEACTION = {
			MOVE : 0,
			DOWN : 1,
			UP : 2
	};
	
	// Draw read only
	this.readonly = false;
	
	// By default the mode is NAVIGATE
	this.mode = this.MODES.NAVIGATE;
	
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
	
	this.displayWidth = width;
	this.displayHeight = height;
	this.offsetX = 0;
	this.offsetY = 0;
	
	// Camera
	this.camX = 0;
	this.camY = 0;
	this.zoom = 1;
	this.zoomin = 2;
	this.zoomout = 0.5;
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
	this.unitConversionFactor = 1/100;
	
	// Snapping setting
	this.snap = true;
	this.snapTolerance = 10;
	
	this.fontSize = 24;
	
	this.displayName = displayName;
	this.cvn = 0; // Canvas HTML element
	this.context; // Canvas object
	
	this.tooltipDefault = "CompassCAD"
	this.tooltip = this.tooltipDefault;
	
	this.keyboard = null;
	this.mouse = null;
}

GraphicDisplay.prototype.init = function(e) {
	/*
	 * INITIALIZE THE LOGIC
	 */ 
	this.logicDisplay = new LogicDisplay();
	this.logicDisplay.init();
	this.zoom = 1;
	
	/*
	 * INITIALIZE INPUT HANDLER 
	 */
	this.keyboard = new KeyboardHandler();
	this.mouse = new MouseHandler();
	
	this.cvn = $('#' + this.displayName);
	this.cvn.css('cursor','crosshair');
	this.context = this.cvn[0].getContext('2d');
	this.execute()
};

GraphicDisplay.prototype.execute = function(e) {
	this.offsetX = this.cvn.offset().left;
	this.offsetY = this.cvn.offset().top;
	
	this.updateCamera();
	
	this.clearGrid();
	
	// Draw basic grid
	if (this.showGrid)
		this.drawGrid(this.cOutX, this.cOutY);
	
	if (this.showOrigin)
		this.drawOrigin(this.cOutX, this.cOutY);
	
	this.drawRules();
	
	// Draw all components
	this.drawAllComponents(this.logicDisplay.components, 0, 0);
	
	// Draw temporary component
	if ( this.temporaryComponentType != null )
		this.drawTemporaryComponent();
	
	// Draw to tooltip
	this.drawToolTip();
};

GraphicDisplay.prototype.saveState = function() {
    this.undoStack.push(JSON.stringify(this.logicDisplay.components));
	console.log(this.undoStack)
    if (this.undoStack.length > 50) { // Limit the undo stack size to 50
        this.undoStack.shift();
    }
    // Clear the redo stack when a new action is performed
    this.redoStack = [];
};

GraphicDisplay.prototype.clearGrid = function(e) {
	this.context.restore();
	this.context.fillStyle = "#202020";
	this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
	this.context.save();
	
	this.context.translate(this.displayWidth/2, this.displayHeight/2);
	this.context.strokeStyle = "#666";
	this.context.lineWidth = 0.15;
};

GraphicDisplay.prototype.drawAllComponents = function(components, moveByX, moveByY) {
	for (var i = 0; i < components.length; i++) {
		if ( !components[i].isActive() )
			continue;
		
		this.drawComponent(components[i], moveByX, moveByY);
	}
};

GraphicDisplay.prototype.drawComponent = function(component, moveByX, moveByY) {
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
	} 
};

/**
 * This method is used to draw current temporary component
 */
GraphicDisplay.prototype.drawTemporaryComponent = function(e) {
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
	} 
};

GraphicDisplay.prototype.drawPoint = function(x, y, color, radius) {
	this.context.lineWidth = radius;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.arc(
			(x + this.cOutX) * this.zoom, 
		    (y + this.cOutY) * this.zoom, 
		    2, 0, 3.14159*2, false);
	this.context.closePath();
	this.context.stroke();
};

GraphicDisplay.prototype.drawLine = function(x1, y1, x2, y2, color, radius) {
	this.context.lineWidth = radius;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.moveTo(
			(x1 + this.cOutX) * this.zoom,
			(y1 + this.cOutY) * this.zoom);
	this.context.lineTo(
			(x2 + this.cOutX) * this.zoom,
			(y2 + this.cOutY) * this.zoom);
	this.context.closePath();
	this.context.stroke();
	
	this.drawPoint(x1, y1, color, radius);
	//this.drawPoint(x2, y2, color, radius);
};

GraphicDisplay.prototype.drawCircle = function(x1, y1, x2, y2, color, radius) {
	this.context.lineWidth = radius;
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
	
	this.drawPoint(x1, y1, color, radius);
};

GraphicDisplay.prototype.drawRectangle = function(x1, y1, x2, y2, color, radius) {
	this.drawLine(x1, y1, x2, y1, color, radius);
	this.drawLine(x2, y1, x2, y2, color, radius);
	this.drawLine(x2, y2, x1, y2, color, radius);
	this.drawLine(x1, y2, x1, y1, color, radius);
};

GraphicDisplay.prototype.drawMeasure = function(x1, y1, x2, y2, color, radius) {
	var distance = this.getDistance(x1, y1, x2, y2) * this.unitFactor * this.unitConversionFactor;
	
	var localZoom = this.zoom;
	var localDiff = 0;
	
	if ( this.zoom <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
	}
	
	this.drawLine(x1, y1, x2, y2, color, radius);
	
	this.context.fillStyle = color;
	this.context.font = (this.fontSize * localZoom) + "px Consolas, monospace";
	this.context.fillText(
			distance.toFixed(2) + "" + this.unitMeasure,
			(this.cOutX + x2 - 120) * this.zoom,
			(this.cOutY + y2 + 30 + localDiff) * this.zoom);
};

GraphicDisplay.prototype.drawLabel = function(x, y, text, color, radius) {
	this.drawPoint(x, y, '#0ff', 2);
	
	var localZoom = this.zoom;
	var localDiff = 0;
	
	if ( this.zoom <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
		y += localDiff;
	}
	
	this.context.fillStyle = color;
	this.context.font =  (this.fontSize * localZoom) + "px Consolas, monospace";
	
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
					(this.cOutX + x - 150) * this.zoom,
					(this.cOutY + y + 30) * this.zoom);
			y += 25 + localDiff;
			tmpLength = 0;
			tmpText = "";
		}
	}
	
	// Print the remainig text
	this.context.fillText(
			tmpText,
			(this.cOutX + x - 150) * this.zoom,
			(this.cOutY + y + 30) * this.zoom);
};

GraphicDisplay.prototype.drawArc = function(x1, y1, x2, y2, x3, y3, color, radius) {
	var firstAngle = this.getAngle(x1, y1, x2, y2);
	var secondAngle = this.getAngle(x1, y1, x3, y3);
	
	this.context.lineWidth = radius;
	this.context.fillStyle = color;
	this.context.strokeStyle = color;
	this.context.beginPath();
	this.context.arc(
			(x1 + this.cOutX) * this.zoom, 
		    (y1 + this.cOutY) * this.zoom, 
		    this.getDistance(x1, y1, x2, y2) * this.zoom,
		    firstAngle, secondAngle, false);
	this.context.stroke();
	
	this.drawPoint(x1, y1, color, radius);
	this.drawPoint(x2, y2, color, radius);
	this.drawPoint(x3, y3, color, radius);
};

GraphicDisplay.prototype.drawShape = function(shape) {
	this.drawAllComponents(shape.components, shape.x, shape.y);
	this.drawPoint(shape.x, shape.y, shape.color, shape.radius);
};

GraphicDisplay.prototype.drawToolTip = function(e) {
	$('#status-stuff')[0].innerText = this.getToolTip()
};

GraphicDisplay.prototype.drawOrigin = function(cx, cy) {
	this.context.lineWidth = 0.5;
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

GraphicDisplay.prototype.drawRules = function(e) {
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
	
	// TODO Show rules!
};

GraphicDisplay.prototype.drawGrid = function(camXoff, camYoff) {
	var naught = (camXoff % this.gridSpacing) * this.zoom - this.displayWidth/2;
	
	for (var i = 0; i < 1 + this.displayWidth / this.gridSpacing / this.zoom; i++){
		this.context.beginPath();
		this.context.moveTo(naught, -this.displayHeight);
		this.context.lineTo(naught, this.displayHeight);
		this.context.closePath();
		this.context.stroke();
		
		naught += this.gridSpacing * this.zoom;
	}
	
	// TODO this is a weird solution. Generalize it for all zoom factor
	if ( this.zoom == 2 )
		naught = (camYoff % this.gridSpacing) * this.zoom - this.displayHeight/2 + this.gridSpacing/2 * this.zoom;
	else
		naught = (camYoff % this.gridSpacing) * this.zoom - this.displayHeight/2;
	
	for (var i = 1 + this.displayHeight / this.gridSpacing / this.zoom; i >= 0; i--){
		this.context.beginPath();
		this.context.moveTo(-this.displayWidth, naught);
		this.context.lineTo(this.displayWidth, naught);
		this.context.closePath();
		this.context.stroke();
		
		naught += this.gridSpacing * this.zoom;
	}
};

/**
 * This method is used to perform a specified action based on the
 * type of mouse action (action) see above MOUSEACTION
 * @param e
 * @param action
 */
GraphicDisplay.prototype.performAction = function(e, action) {
	switch(this.mode) {
		case this.MODES.ADDPOINT:
			this.cvn.css('cursor', 'default');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				}
				this.temporaryPoints[0] = this.getCursorXLocal(); // TODO this.getCursorSnapX();
				this.temporaryPoints[1] = this.getCursorYLocal(); // TODO this.getCursorSnapY();
			} else if ( action == this.MOUSEACTION.DOWN ) {
				this.logicDisplay.addComponent(new Point(
						this.temporaryPoints[0],
						this.temporaryPoints[1]));
				this.saveState()
				this.execute()
			}
			this.tooltip = "Add point (press esc to cancel)";
			break;
		case this.MODES.ADDLINE:
			if (e.which == 3)
			
			this.cvn.css('cursor', 'default');
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
					this.logicDisplay.addComponent(new Line(
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
			this.tooltip = "Add line (press esc to cancel)";
			break;
		case this.MODES.ADDCIRCLE:
			this.cvn.css('cursor', 'default');
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
					this.logicDisplay.addComponent(new Circle(
							this.temporaryPoints[0],
							this.temporaryPoints[1],
							this.temporaryPoints[2],
							this.temporaryPoints[3]));
					this.saveState()
					this.execute()
				}
			}
			this.tooltip = "Add circle (press esc to cancel)";
			break;
		case this.MODES.ADDARC:
			this.cvn.css('cursor', 'default');
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
			this.tooltip = "Add arc (press esc to cancel)";
			break;
		case this.MODES.ADDRECTANGLE:
			this.cvn.css('cursor', 'default');
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
					this.logicDisplay.addComponent(new Rectangle(
							this.temporaryPoints[0],
							this.temporaryPoints[1],
							this.temporaryPoints[2],
							this.temporaryPoints[3]));
					this.saveState()
					this.execute()
				}
			}
			this.tooltip = "Add rectangle (press esc to cancel)";
			break;
		case this.MODES.ADDMEASURE:
			this.cvn.css('cursor', 'default');
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
					this.logicDisplay.addComponent(new Measure(
							this.temporaryPoints[0],
							this.temporaryPoints[1],
							this.temporaryPoints[2],
							this.temporaryPoints[3]));
					this.saveState()
					this.execute()
				}
			}
			this.tooltip = "Add measure (press esc to cancel)";
			break;
		case this.MODES.ADDLABEL:
			this.cvn.css('cursor', 'default');
			if (action == this.MOUSEACTION.MOVE) {
				if (this.temporaryComponentType == null) {
					this.temporaryComponentType = COMPONENT_TYPES.POINT;
				} else if (this.temporaryComponentType == COMPONENT_TYPES.POINT) {
					this.temporaryPoints[0] = this.getCursorXLocal();
					this.temporaryPoints[1] = this.getCursorYLocal();
				}
			} else if ( action == this.MOUSEACTION.DOWN ) {
				callPrompt('Enter text')
				.then(text => {
					if ( text.length > 0 ) {
						this.logicDisplay.addComponent(new Label(
								this.temporaryPoints[0],
								this.temporaryPoints[1],
								text));
						this.saveState()
						this.execute()
						this.setMode(this.MODES.NAVIGATE)
					}
				})
				.catch(e => {})
			}
			this.tooltip = "Add label (press esc to cancel)";
			break;
		case this.MODES.ADDSHAPE:
			this.cvn.css('cursor', 'default');
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
		case this.MODES.NAVIGATE:
			this.cvn.css('cursor', 'move');
			if (action == this.MOUSEACTION.DOWN) {
				this.camMoving = true; 
				this.xCNaught = this.getCursorXLocal();
				this.yCNaught = this.getCursorYLocal();
			} else if (action == this.MOUSEACTION.UP) {
				this.camMoving = false;
				this.camX += this.getCursorXLocal() - this.xCNaught;
				this.camY += this.getCursorYLocal() - this.yCNaught;
			}
			this.tooltip = "Navigate";
			break;
		case this.MODES.MOVE:
			this.cvn.css('cursor', 'default');
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
			this.tooltip = "Move (press esc to cancel)";
			break;
		case this.MODES.EDIT:
			// TODO: In the next release
			this.tooltip = "Edit (press esc to cancel)";
			break;
		case this.MODES.DELETE:
			this.cvn.css('cursor', 'default');
			if (action == this.MOUSEACTION.MOVE) {
				if ( this.selectedComponent == null ) {
					this.temporarySelectedComponent = this.findIntersectionWith(
							this.getCursorXLocal(),
							this.getCursorYLocal());
				}
			} else if ( action == this.MOUSEACTION.DOWN ) {
				if ( this.temporarySelectedComponent != null ) {
					this.logicDisplay.components[this.temporarySelectedComponent].setActive(false);
				}
				this.saveState()
				this.execute()
			}
			this.tooltip = "Delete (press esc to cancel)";
			break;
		default:
			this.tooltip = this.tooltipDefault;
	}
};
GraphicDisplay.prototype.undo = function() {
    if (this.undoStack.length > 0) {
        const state = this.undoStack.pop();
		console.log(state)
        this.redoStack.push(JSON.stringify(this.logicDisplay.components));
        this.logicDisplay.components = JSON.parse(state);
		console.log(this.redoStack)
        this.execute(); // Re-render the canvas
    }
};

GraphicDisplay.prototype.redo = function() {
    if (this.redoStack.length > 0) {
        const state = this.redoStack.pop();
        this.undoStack.push(JSON.stringify(this.logicDisplay.components));
        this.logicDisplay.components = JSON.parse(state);
        this.execute(); // Re-render the canvas
    }
};

GraphicDisplay.prototype.moveComponent = function(index, x, y) {
	if (index != null) {
		switch ( this.logicDisplay.components[index].type ) {
			case COMPONENT_TYPES.POINT:
			case COMPONENT_TYPES.LABEL:
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

GraphicDisplay.prototype.selectComponent = function(index) {
	if (index != null) {
		this.selectedComponent = index;
		this.previousColor = this.logicDisplay.components[index].color;
		this.previousRadius = this.logicDisplay.components[index].radius;
		this.logicDisplay.components[index].color = this.selectedColor;
		this.logicDisplay.components[index].radius = this.selectedRadius;
	}
};

GraphicDisplay.prototype.unselectComponent = function(e) {
	if ( this.selectedComponent != null ) {
		this.logicDisplay.components[this.selectedComponent].color = this.previousColor;
		this.logicDisplay.components[this.selectedComponent].radius = this.previousRadius;
		this.selectedComponent = null;
	}
};

GraphicDisplay.prototype.updateCamera = function(e) {
	this.cOutX = this.camX;
	this.cOutY = this.camY;
	
	if (this.camMoving) {
		this.cOutX += this.getCursorXLocal() - this.xCNaught;
		this.cOutY += this.getCursorYLocal() - this.yCNaught;
	}
};

/**
 * This method is used to set CAD in SHAPE mode
 * @param getShape : a function that return a shape
 */
GraphicDisplay.prototype.setModeShape = function(getShape) {
	this.setMode(this.MODES.ADDSHAPE);
	this.temporaryShape = getShape();
};

GraphicDisplay.prototype.setMode = function(mode) {
	this.resetMode();
	
	if (this.readonly)
		this.mode = this.MODES.NAVIGATE;
	else
		this.mode = mode;
};

GraphicDisplay.prototype.resetMode = function(e) {
	this.temporaryComponentType = null;
	this.temporaryShape = null;
	
	for (var i = 0; i < this.temporaryPoints.length; i++)
		delete this.temporaryPoints[i];
	
	this.mode = -1;
	this.tooltip = this.tooltipDefault;
};

GraphicDisplay.prototype.setZoom = function(zoomFactor) {
	var newZoom = this.zoom * zoomFactor; 
	console.log(newZoom)
	
	// Zoom interval control
	if ( newZoom <= 0.2 || newZoom >= 4 )
		return;
	
	this.zoom = newZoom;
};

GraphicDisplay.prototype.zoomIn = function(e) {
	this.setZoom(this.zoomin);
};

GraphicDisplay.prototype.zoomOut = function(e) {
	this.setZoom(this.zoomout);
};

GraphicDisplay.prototype.getCursorXLocal = function(e) {
	return (this.mouse.cursorXGlobal - this.offsetX - this.displayWidth/2)/this.zoom - this.camX;
};

GraphicDisplay.prototype.getCursorYLocal = function(e) {
	return (this.mouse.cursorYGlobal - this.offsetY - this.displayHeight/2)/this.zoom - this.camY;
};

GraphicDisplay.prototype.getCursorXInFrame = function(e) {
	return this.mouse.cursorXGlobal - this.offsetX - this.displayWidth/2;
};

GraphicDisplay.prototype.getCursorYInFrame = function(e) {
	return this.mouse.cursorYGlobal - this.offsetY - this.displayHeight/2;
};

GraphicDisplay.prototype.setToolTip = function(text) {
	this.tooltip = text;
};

GraphicDisplay.prototype.getToolTip = function(e) {
	var text = this.tooltip;
	return text;
};

//TODO: Move in Utils.
GraphicDisplay.prototype.getDistance = function(x1, y1, x2, y2) {
	var distance = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
	
	return distance.toFixed(2);
};

// TODO: Move in Utils.
GraphicDisplay.prototype.findIntersectionWith = function(x, y) {
	for ( var i = this.logicDisplay.components.length - 1; i >= 0; i-- ) {
		if (!this.logicDisplay.components[i].isActive())
			continue;
		
		switch (this.logicDisplay.components[i].type) {
			case COMPONENT_TYPES.POINT:
			case COMPONENT_TYPES.LABEL:	
			case COMPONENT_TYPES.SHAPE:
				var delta = this.getDistance(x, y, this.logicDisplay.components[i].x, this.logicDisplay.components[i].y); 
				if ( delta >= 0 && delta <= this.snapTolerance / this.zoom )
					return i;
				break;
			case COMPONENT_TYPES.LINE:
			case COMPONENT_TYPES.CIRCLE:
			case COMPONENT_TYPES.RECTANGLE:
			case COMPONENT_TYPES.MEASURE:
				var delta = this.getDistance(x ,y, this.logicDisplay.components[i].x1, this.logicDisplay.components[i].y1);
				if ( delta >= 0 && delta <= this.snapTolerance / this.zoom )
					return i;
				break;
		}
	}
	
	return null;
};

GraphicDisplay.prototype.saveComponent = function() {
	console.warn(this.logicDisplay.exportJSON())
}

//TODO: Move in Utils.
/**
 * Return the angle in radiants
 */
GraphicDisplay.prototype.getAngle = function(x1, y1, x2, y2) {
	var PI = Math.PI;
	var theta = Math.atan((y2 - y1) / (x2 - y2)) * (PI/180);
	
	if (x2 < x1)
		theta -= PI;
	else if (y2 > y1)
		theta -= PI*2;
	
	if (x2 == x1) {
		theta = PI/2;
		
		if (y2 < y1)
			theta = (PI/2)*3;
	}
	
	return theta;
};

GraphicDisplay.prototype.createNew = function() {
	this.logicDisplay.components = []
	this.execute
}
GraphicDisplay.prototype.openDesign = function() {
	diag.showOpenDialog({
		title: 'Open CompassCAD file',
		properties: ['openFile'],
		filters: [
			{name: 'CompassCAD File', extensions: ['ccad']}
		]
	}).then(res => {
		console.log(res)
		fs.promises.readFile(res.filePaths[0], 'utf-8')
		.then(resp => JSON.parse(resp))
		.then(data => {
			console.log(data)
			this.logicDisplay.components = [];
			this.logicDisplay.importJSON(data, this.logicDisplay.components)
		})
		.catch(error => {
			console.error('Error reading or parsing the file:', error);
		});
		}).catch(e => {
			alert('A Problem Occured! \n'+e)
		})
}
GraphicDisplay.prototype.saveDesign = function() {
	diag.showSaveDialog({
		title: 'Save CompassCAD file',
		filters: [
			{name: 'CompassCAD File', extensions: ['ccad']}
		]
	}).then(data => {
		fs.writeFileSync(data.filePath, JSON.stringify(this.logicDisplay.components))
	})
}

/*
 * Helper function used to initialize the
 * graphic environment and behaviour (mainly input events)
 */
var initCAD = function(gd) {
	gd.init();
	
	// Bind keyboard events
	$(document).keyup(function(e) {
		gd.keyboard.onKeyUp(e);
	});
	
	$(document).keydown(function(e) {
		gd.keyboard.onKeyDown(e);
	});
	
	// Adding keyboard events 
	
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.N, function(e){
		gd.zoomIn();
	});
	
	gd.keyboard.addKeyEvent(true, gd.keyboard.KEYS.M, function(e){
		gd.zoomOut();
	});
	
	// Bind mouse events
	gd.cvn.mousemove(function(e) {
		gd.mouse.onMouseMove(e);
		
		if (!gd.gridPointer)
			gd.gridPointer = true;
		
		gd.performAction(e, gd.MOUSEACTION.MOVE);
	});
	
	gd.cvn.mouseout(function(e) {
		gd.gridPointer = false;
	});
	
	gd.cvn.mousedown(function(e) {
		gd.mouse.onMouseDown(e);
		gd.performAction(e, gd.MOUSEACTION.DOWN);
	});
	
	gd.cvn.mouseup(function(e) {
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
	setInterval(function(e) {
		gd.execute();
	}, 1);
};
