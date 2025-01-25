const canvas2svg = require('canvas-to-svg')
  
function SVGExporter(renderComp) {
    this.c2s = new canvas2svg(1920, 1080)
	this.rendererComponent = renderComp
    // hijack the rendererComponent's logic display so we can get that shit there
    this.logicDisplay = this.rendererComponent.logicDisplay
    console.log(`rendererComponent coutx: ${this.rendererComponent.cOutX},rendererComponent couty: ${this.rendererComponent.cOutY}`)
}

SVGExporter.prototype.calculateOrigin = function(components) {
    var minX = Infinity;
    var minY = Infinity;

    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        if (!component.isActive()) continue;

        switch (component.type) {
            case COMPONENT_TYPES.POINT:
                minX = Math.min(minX, component.x);
                minY = Math.min(minY, component.y);
                break;
            case COMPONENT_TYPES.LINE:
                minX = Math.min(minX, component.x1, component.x2);
                minY = Math.min(minY, component.y1, component.y2);
                break;
            case COMPONENT_TYPES.CIRCLE:
                minX = Math.min(minX, component.x1);
                minY = Math.min(minY, component.y1);
                break;
            case COMPONENT_TYPES.RECTANGLE:
                minX = Math.min(minX, component.x1, component.x2);
                minY = Math.min(minY, component.y1, component.y2);
                break;
            case COMPONENT_TYPES.MEASURE:
                minX = Math.min(minX, component.x1, component.x2);
                minY = Math.min(minY, component.y1, component.y2);
                break;
            case COMPONENT_TYPES.LABEL:
                minX = Math.min(minX, component.x);
                minY = Math.min(minY, component.y);
                break;
            case COMPONENT_TYPES.ARC:
                minX = Math.min(minX, component.x1, component.x2, component.x3);
                minY = Math.min(minY, component.y1, component.y2, component.y3);
                break;
            case COMPONENT_TYPES.SHAPE:
                minX = Math.min(minX, component.x);
                minY = Math.min(minY, component.y);
                break;
        }
    }

    if (minX === Infinity || minY === Infinity) {
        console.log("No active components found. Defaulting to (0, 0).");
        return { x: 0, y: 0 };
    }

    console.log({x: minX, y: minY});
    return { x: minX, y: minY };  // Return the lowest x and y as the origin
};
SVGExporter.prototype.calculateDimensions = function(components) {
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;

    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        if (!component.isActive()) continue;
		if (component.type === COMPONENT_TYPES.SHAPE) {
            for (var j = 0; j < component.components.length; j++) {
                var shapeComponent = component.components[j];
                shapeComponent.x += component.x;
                shapeComponent.y += component.y;
            }
            this.calculateDimensions(component.components);
        }
        switch (component.type) {
            case COMPONENT_TYPES.POINT:
            case COMPONENT_TYPES.LABEL:
            case COMPONENT_TYPES.SHAPE:
                minX = Math.min(minX, component.x);
                maxX = Math.max(maxX, component.x);
                minY = Math.min(minY, component.y);
                maxY = Math.max(maxY, component.y);
                break;
            case COMPONENT_TYPES.LINE:
            case COMPONENT_TYPES.RECTANGLE:
                minX = Math.min(minX, component.x1, component.x2);
                maxX = Math.max(maxX, component.x1, component.x2);
                minY = Math.min(minY, component.y1, component.y2);
                maxY = Math.max(maxY, component.y1, component.y2);
                break;
            case COMPONENT_TYPES.CIRCLE:
                minX = Math.min(minX, component.x1 - component.radius); // Account for circle radius
                maxX = Math.max(maxX, component.x1 + component.radius);
                minY = Math.min(minY, component.y1 - component.radius);
                maxY = Math.max(maxY, component.y1 + component.radius);
                break;
            case COMPONENT_TYPES.ARC:
                minX = Math.min(minX, component.x1, component.x2, component.x3);
                maxX = Math.max(maxX, component.x1, component.x2, component.x3);
                minY = Math.min(minY, component.y1, component.y2, component.y3);
                maxY = Math.max(maxY, component.y1, component.y2, component.y3);
                break;
            case COMPONENT_TYPES.MEASURE:
                minX = Math.min(minX, component.x1, component.x2);
                maxX = Math.max(maxX, component.x1, component.x2);
                minY = Math.min(minY, component.y1, component.y2);
                maxY = Math.max(maxY, component.y1, component.y2);
                break;
        }
    }

    // Calculate the width and height of the canvas
    var width = maxX - minX;
    var height = maxY - minY;

    console.log({ minX, maxX, minY, maxY, width, height });

    // Return dimensions and the calculated origin point (minX, minY)
    return { width, height, origin: { x: minX, y: minY } };
};

SVGExporter.prototype.drawAllComponents = function(components, moveByX, moveByY) {
    var dimensions = this.calculateDimensions(components);
    var width = dimensions.width;
    var height = dimensions.height;
    var origin = dimensions.origin;

    // Adjust canvas size dynamically based on the design width and height + padding
    var padding = 45;
    this.c2s = new canvas2svg(width + 2 * padding, height + 2 * padding);

    // Refine the origin and apply padding
    var refinedX = -origin.x + padding;  // Shift origin to right with padding
    var refinedY = -origin.y + padding;  // Shift origin down with padding

    console.log(`Adjusted canvas size: ${width + 2 * padding}x${height + 2 * padding}`);
    console.log(`Origin x:${origin.x}, origin y:${origin.y}`);
    console.log(`Refined x: ${refinedX}, Refined y: ${refinedY}`);

    for (var i = 0; i < components.length; i++) {
        if (!components[i].isActive()) continue;

        // Apply the calculated offset and the moveByX/moveByY factors
        this.drawComponent(components[i], refinedX + moveByX, refinedY + moveByY);
    }
};

SVGExporter.prototype.renderElementExclusiveForShape = function (components, offsetX, offsetY) {
	console.log(components)
	for (var i = 0; i < components.length; i++) {
		if (!components[i].isActive())
			continue;

		this.drawComponent(components[i], offsetX, offsetY)
	}
}

SVGExporter.prototype.drawComponent = function(component, moveByX, moveByY) {
	switch (component.type) {
		case COMPONENT_TYPES.POINT:
			this.drawPointSvg(
					component.x + moveByX,
					component.y + moveByY,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.LINE:
			this.drawLineSvg(
					component.x1 + moveByX,
					component.y1 + moveByY,
					component.x2 + moveByX,
					component.y2 + moveByY,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.CIRCLE:
			this.drawCircleSvg(
					component.x1 + moveByX,
					component.y1 + moveByY,
					component.x2 + moveByX,
					component.y2 + moveByY,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.RECTANGLE:
			this.drawRectangleSvg(
					component.x1 + moveByX,
					component.y1 + moveByY,
					component.x2 + moveByX,
					component.y2 + moveByY,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.MEASURE:
			this.drawMeasureSvg(
					component.x1 + moveByX,
					component.y1 + moveByY,
					component.x2 + moveByX,
					component.y2 + moveByY,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.LABEL:
			this.drawLabelSvg(
					component.x + moveByX,
					component.y + moveByY,
					component.text,
					component.color,
					component.radius);
			break;
		case COMPONENT_TYPES.ARC:
			this.drawArcSvg(
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
			this.drawShapeSvg(component)
			break;
	} 
};
SVGExporter.prototype.drawPointSvg = function(x, y, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	console.log(`svg point x:${x}, svg point y:${y}`)
	this.c2s.arc(
			x, 
		    y, 
		    2, 0, Math.PI * 2, false);
	this.c2s.closePath();
	this.c2s.stroke();
};

SVGExporter.prototype.drawLineSvg = function(x1, y1, x2, y2, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.lineCap = "round"
	this.c2s.beginPath();
	this.c2s.moveTo(
			x1,
			y1 );
	this.c2s.lineTo(
			x2,
			y2);
	this.c2s.stroke();
};

SVGExporter.prototype.drawCircleSvg = function(x1, y1, x2, y2, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			x1, 
		    y1, 
		    this.rendererComponent.getDistance(x1, y1, x2, y2) * 1,
		    0, 3.14159*2, false);
	this.c2s.closePath();
	this.c2s.stroke();
};

SVGExporter.prototype.drawRectangleSvg = function(x1, y1, x2, y2, color, radius) {
	this.drawLineSvg(x1, y1, x2, y1, color, radius);
	this.drawLineSvg(x2, y1, x2, y2, color, radius);
	this.drawLineSvg(x2, y2, x1, y2, color, radius);
	this.drawLineSvg(x1, y2, x1, y1, color, radius);
};

SVGExporter.prototype.drawMeasureSvg = function(x1, y1, x2, y2, color, radius) {
	// Calculate the distance between the two points
	var distance = this.rendererComponent.pcbEditorMode
		? (this.rendererComponent.getDistance(x1, y1, x2, y2) * this.rendererComponent.unitFactor * (this.rendererComponent.unitConversionFactor / 0.37)) * 10
		: this.rendererComponent.getDistance(x1, y1, x2, y2) * this.rendererComponent.unitFactor * this.rendererComponent.unitConversionFactor;

	// Calculate the angle of the line in radians
	var angle = Math.atan2(y2 - y1, x2 - x1);

	// Adjust zoom levels
	var localZoom = 1;
	var localDiff = 0;
	if (localZoom <= 0.25) {
		localZoom = 0.5;
		localDiff = 20;
	}

	// Format the distance text
	const distanceText = distance.toFixed(2) + this.rendererComponent.unitMeasure;

	// Measure text width for adaptive gap creation
	this.c2s.save();
	this.c2s.font = (this.rendererComponent.fontSize * localZoom) + "px Consolas, monospace";
	const textWidth = this.c2s.measureText(distanceText).width;
	this.c2s.restore();

	// Default length and offset for the arrowhead lines
	var defaultArrowLength = 25;
	var arrowOffset = 5;
	let arrowLength = defaultArrowLength;

	// Minimum distance for displaying the full arrow
	const minDistanceForFullArrow = defaultArrowLength * 2 / 100;
	if (distance < minDistanceForFullArrow) {
		arrowLength = (distance / minDistanceForFullArrow) * defaultArrowLength;
	}
	const isShortDistance = distance < minDistanceForFullArrow * 2;

	// Calculate the midpoint for placing the label
	const midX = (x1 + x2) / 2;
	const midY = (y1 + y2) / 2;

	// Offset text position above midpoint if distance is short
	const textOffsetY = isShortDistance ? (750 / 100) : 0;

	// Draw line segments only if distance is above threshold
	if (!isShortDistance) {
		const basePadding = 20;
		const adaptivePadding = basePadding;
		const labelGap = (textWidth + adaptivePadding);

		const halfGapX = (labelGap / 2) * Math.cos(angle);
		const halfGapY = (labelGap / 2) * Math.sin(angle);

		this.drawLineSvg(x1, y1, midX - halfGapX, midY - halfGapY, color, radius);
		this.drawLineSvg(midX + halfGapX, midY + halfGapY, x2, y2, color, radius);
	}

	// Draw the arrowheads at both ends
	const drawArrowhead = (x, y, angle, length, offset) => {
		const arrowX = x + length * Math.cos(angle);
		const arrowY = y + length * Math.sin(angle);
		const offsetX = offset * Math.cos(angle + Math.PI / 2);
		const offsetY = offset * Math.sin(angle + Math.PI / 2);

		this.drawLineSvg(x, y, arrowX + offsetX, arrowY + offsetY, color, radius);
		this.drawLineSvg(x, y, arrowX - offsetX, arrowY - offsetY, color, radius);
		this.drawLineSvg(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius);
	};

	// Draw the arrowheads at the start and end points
	drawArrowhead(x1, y1, angle, arrowLength, arrowOffset);
	drawArrowhead(x2, y2, angle + Math.PI, arrowLength, arrowOffset);

	// Draw the distance label with rotation and alignment
	this.c2s.save();
	this.c2s.translate((midX * this.rendererComponent.zoom) + this.rendererComponent.cOutX * this.rendererComponent.zoom, ((midY * this.rendererComponent.zoom) + (textOffsetY * 2)) + this.rendererComponent.cOutY * this.rendererComponent.zoom);
	this.c2s.rotate(angle);
	this.c2s.textAlign = 'center';
	this.c2s.textBaseline = isShortDistance ? 'top' : 'middle';
	this.c2s.fillStyle = "#000000";
	this.c2s.font = (this.rendererComponent.fontSize * localZoom) + "px Consolas, monospace";
	this.c2s.fillText(distanceText, 0, localDiff);
	this.c2s.restore();
};

SVGExporter.prototype.drawLabelSvg = function(x, y, text, color, radius) {	
	var localZoom = 1;
	var localDiff = 0;
	
	if ( 1 <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
		y += localDiff;
	}
	
	this.c2s.fillStyle = "#000000";
	this.c2s.font =  (this.rendererComponent.fontSize * localZoom) + "px Consolas, monospace";
	
	var maxLength = 24; // 24 Characters per row
	var tmpLength = 0;
	var tmpText = "";
	var arrText = this.rendererComponent.logicDisplay.customSyntax(text).split(" ");
	
	for (var i = 0; i < arrText.length; i++) {
		tmpLength += arrText[i].length + 1;
		tmpText += " " + arrText[i];
		
		if ( tmpLength > maxLength ) {
			this.c2s.fillText(
					tmpText,
					(x + 10),
					y);
			y += 25 + localDiff;
			tmpLength = 0;
			tmpText = "";
		}
	}
	
	// Print the remainig text
	this.c2s.fillText(
			tmpText,
			(x + 10),
			y);
};

SVGExporter.prototype.drawArcSvg = function(x1, y1, x2, y2, x3, y3, color, radius) {
	var firstAngle = this.rendererComponent.getAngle(x1, y1, x2, y2);
	var secondAngle = this.rendererComponent.getAngle(x1, y1, x3, y3);
	
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			x1, 
		    y1, 
		    this.rendererComponent.getDistance(x1, y1, x2, y2) * 1,
		    firstAngle, secondAngle, false);
	this.c2s.stroke();
};
SVGExporter.prototype.drawShapeSvg = function (shape) {
    for (var i = 0; i < shape.components.length; i++) {
        var component = shape.components[i];
        component.x += shape.x;
        component.y += shape.y;
    }
    this.renderElementExclusiveForShape(shape.components, shape.x, shape.y);
}
SVGExporter.prototype.exportSVG = function () {
    // will return the SVG
    this.drawAllComponents(this.rendererComponent.logicDisplay.components, 15, 5);
    // test first
	console.log(this.c2s.getSerializedSvg(true))
    return this.c2s.getSerializedSvg(true)
}