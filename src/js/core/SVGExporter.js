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
    var maxY = -Infinity;

    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        if (!component.isActive()) continue;

        switch (component.type) {
            case COMPONENT_TYPES.POINT:
                minX = Math.min(minX, component.x);
                maxY = Math.max(maxY, component.y);
                break;
            case COMPONENT_TYPES.LINE:
                minX = Math.min(minX, Math.min(component.x1, component.x2));
                maxY = Math.max(maxY, Math.max(component.y1, component.y2));
                break;
            case COMPONENT_TYPES.CIRCLE:
                minX = Math.min(minX, component.x1);
                maxY = Math.max(maxY, component.y1);
                break;
            case COMPONENT_TYPES.RECTANGLE:
                minX = Math.min(minX, Math.min(component.x1, component.x2));
                maxY = Math.max(maxY, Math.max(component.y1, component.y2));
                break;
            case COMPONENT_TYPES.MEASURE:
                minX = Math.min(minX, Math.min(component.x1, component.x2));
                maxY = Math.max(maxY, Math.max(component.y1, component.y2));
                break;
            case COMPONENT_TYPES.LABEL:
                minX = Math.min(minX, component.x);
                maxY = Math.max(maxY, component.y);
                break;
            case COMPONENT_TYPES.ARC:
                minX = Math.min(minX, Math.min(component.x1, Math.min(component.x2, component.x3)));
                maxY = Math.max(maxY, Math.max(component.y1, Math.max(component.y2, component.y3)));
                break;
			case COMPONENT_TYPES.SHAPE:
				minX = Math.min(minX, component.x);
                maxY = Math.max(maxY, component.y);
                break;
        }
    }
    console.log({x: minX, y: maxY})
    return { x: minX, y: maxY };
};

SVGExporter.prototype.drawAllComponents = function(components, moveByX, moveByY) {
    var origin = this.calculateOrigin(components);
	var refinedX = 0;
	var refinedY = 0;

	if (origin.x < -500) {
		refinedX = origin.x / 14
	} else if (origin.x < -300) {
		refinedX = origin.x / 7
	} else if (origin.x < 0) {
		refinedX = origin.x / 2
	} else if (origin.x > 0) {
		refinedX = origin.x / 100
	} else if (origin.x > 300) {
		refinedX = origin.x / 80
	} else if (origin.x > 500) {
		refinedX = origin.x / 2
	}
	if (origin.y > 800) {
		refinedY = origin.y / 11
	} else if (origin.y > 400) {
		refinedY = origin.y / 4.5
	} else if (origin.y > 250) {
		refinedY = origin.y / 3
	} else {
		refinedY = origin.y / 1.9
	}
	console.log(`refined x:${refinedX}, refined y:${refinedY}`)
	console.log(`abs refined x:${Math.abs(refinedX)}, abs refined y:${Math.abs(refinedY)}`)
	console.log(`final x:${Math.abs(refinedX) * moveByX}, final y:${Math.abs(refinedY) * moveByY}`)
    for (var i = 0; i < components.length; i++) {
        if (!components[i].isActive()) continue;

        this.drawComponent(components[i], Math.abs(refinedX) * moveByX, Math.abs(refinedY) * moveByY);
    }
};
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
			this.drawLabelSvg(
				component.x + moveByX,
				component.y + moveByY,
				'Shape',
				component.color,
				component.radius);
			break;
	} 
};
SVGExporter.prototype.drawPointSvg = function(x, y, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			x, 
		    y, 
		    2, 0, 3.14159*2, false);
	this.c2s.closePath();
	this.c2s.stroke();
};

SVGExporter.prototype.drawLineSvg = function(x1, y1, x2, y2, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.moveTo(
			x1,
			y1 );
	this.c2s.lineTo(
			x2,
			y2);
	this.c2s.closePath();
	this.c2s.stroke();
	
	this.drawPointSvg(x1, y1, color, radius);
	this.drawPointSvg(x2, y2, color, radius);
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
	
	this.drawPointSvg(x1, y1, color, radius);
};

SVGExporter.prototype.drawRectangleSvg = function(x1, y1, x2, y2, color, radius) {
	this.drawLineSvg(x1, y1, x2, y1, color, radius);
	this.drawLineSvg(x2, y1, x2, y2, color, radius);
	this.drawLineSvg(x2, y2, x1, y2, color, radius);
	this.drawLineSvg(x1, y2, x1, y1, color, radius);
};

SVGExporter.prototype.drawMeasureSvg = function(x1, y1, x2, y2, color, radius) {
	// Calculate the distance between the two points
    var distance = this.rendererComponent.getDistance(x1, y1, x2, y2) * this.rendererComponent.unitFactor * this.rendererComponent.unitConversionFactor;

    // Calculate the angle of the line in radians
    var angle = Math.atan2(y2 - y1, x2 - x1);

    // Adjust zoom levels
    var localDiff = 0;
	var localZoom = 1;

    if (1 <= 0.25) {
        localZoom = 0.5;
        localDiff = 20;
    }

    // Draw the main line
    this.drawLineSvg(x1, y1, x2, y2, color, radius);

    // Length and offset for the arrowhead lines
    var arrowLength = 30;
    var arrowOffset = 15;

    // Calculate positions of the arrowhead lines at the start point (x1, y1)
    var arrowX1 = x1 + arrowLength * Math.cos(angle);
    var arrowY1 = y1 + arrowLength * Math.sin(angle);
    var offsetX1 = arrowOffset * Math.cos(angle + Math.PI / 2);
    var offsetY1 = arrowOffset * Math.sin(angle + Math.PI / 2);

    // Draw the rotated arrowhead at the start point
    this.drawLineSvg(x1, y1, arrowX1 + offsetX1, arrowY1 + offsetY1, color, radius);
    this.drawLineSvg(x1, y1, arrowX1 - offsetX1, arrowY1 - offsetY1, color, radius);
    this.drawLineSvg(arrowX1 + offsetX1, arrowY1 + offsetY1, arrowX1 - offsetX1, arrowY1 - offsetY1, color, radius);

    // Calculate positions of the arrowhead lines at the end point (x2, y2)
    var arrowX2 = x2 - arrowLength * Math.cos(angle);
    var arrowY2 = y2 - arrowLength * Math.sin(angle);
    var offsetX2 = arrowOffset * Math.cos(angle + Math.PI / 2);
    var offsetY2 = arrowOffset * Math.sin(angle + Math.PI / 2);

    // Draw the rotated arrowhead at the end point
    this.drawLineSvg(x2, y2, arrowX2 + offsetX2, arrowY2 + offsetY2, color, radius);
    this.drawLineSvg(x2, y2, arrowX2 - offsetX2, arrowY2 - offsetY2, color, radius);
    this.drawLineSvg(arrowX2 + offsetX2, arrowY2 + offsetY2, arrowX2 - offsetX2, arrowY2 - offsetY2, color, radius);

    // Draw the distance label
    this.c2s.fillStyle = "#000000";
	this.c2s.font = (this.rendererComponent.fontSize * localZoom) + "px Consolas, monospace";
	this.c2s.fillText(
			distance.toFixed(2) + "" + this.rendererComponent.unitMeasure,
			(x2 - 120) * 1,
			(y2 + 30 + localDiff) * 1);
};

SVGExporter.prototype.drawLabelSvg = function(x, y, text, color, radius) {
	this.drawPointSvg(x, y, '#0ff', 2);
	
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
	
	this.drawPointSvg(x1, y1, color, radius);
	this.drawPointSvg(x2, y2, color, radius);
	this.drawPointSvg(x3, y3, color, radius);
};
SVGExporter.prototype.exportSVG = function() {
    // will return the SVG
    this.drawAllComponents(this.rendererComponent.logicDisplay.components, 15, 5);
    // test first
	console.log(this.c2s.getSerializedSvg(true))
    return this.c2s.getSerializedSvg(true)
}