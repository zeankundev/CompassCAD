const canvas2svg = require('canvas-to-svg')

function SVGExporter() {
    this.c2s = new canvas2svg(renderer.displayWidth, renderer.displayHeight)
    // hijack the renderer's logic display so we can get that shit there
    this.logicDisplay = renderer.logicDisplay
}

SVGExporter.prototype.drawAllComponents = function(components, moveByX, moveByY) {
	for (var i = 0; i < components.length; i++) {
		if ( !components[i].isActive() )
			continue;
		
		this.drawComponent(components[i], Math.min(1, (moveByX * 30)), Math.min(1, (moveByY * 30)));
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
			this.drawShapeSvg(component);
			break;
	} 
};
SVGExporter.prototype.drawPointSvg = function(x, y, color, radius) {
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			(x + renderer.cOutX) * renderer.zoom, 
		    (y + renderer.cOutY) * renderer.zoom, 
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
			(x1 + renderer.cOutX) * renderer.zoom,
			(y1 + renderer.cOutY) * renderer.zoom);
	this.c2s.lineTo(
			(x2 + renderer.cOutX) * renderer.zoom,
			(y2 + renderer.cOutY) * renderer.zoom);
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
			(x1 + renderer.cOutX) * renderer.zoom, 
		    (y1 + renderer.cOutY) * renderer.zoom, 
		    renderer.getDistance(x1, y1, x2, y2) * renderer.zoom,
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
	var distance = renderer.getDistance(x1, y1, x2, y2) * renderer.unitFactor * renderer.unitConversionFactor;
	
	var localZoom = renderer.zoom;
	var localDiff = 0;
	
	if ( renderer.zoom <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
	}

	this.drawLineSvg(x1, y1, x2, y2, color, radius);
	
	this.c2s.fillStyle = "#000000";
	this.c2s.font = (renderer.fontSize * localZoom) + "px Consolas, monospace";
	this.c2s.fillText(
			distance.toFixed(2) + "" + renderer.unitMeasure,
			(renderer.cOutX + x2 - 120) * renderer.zoom,
			(renderer.cOutY + y2 + 30 + localDiff) * renderer.zoom);
};

SVGExporter.prototype.drawLabelSvg = function(x, y, text, color, radius) {
	this.drawPointSvg(x, y, '#0ff', 2);
	
	var localZoom = renderer.zoom;
	var localDiff = 0;
	
	if ( renderer.zoom <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
		y += localDiff;
	}
	
	this.c2s.fillStyle = "#000000";
	this.c2s.font =  (renderer.fontSize * localZoom) + "px Consolas, monospace";
	
	var maxLength = 24; // 24 Characters per row
	var tmpLength = 0;
	var tmpText = "";
	var arrText = renderer.logicDisplay.customSyntax(text).split(" ");
	
	for (var i = 0; i < arrText.length; i++) {
		tmpLength += arrText[i].length + 1;
		tmpText += " " + arrText[i];
		
		if ( tmpLength > maxLength ) {
			this.c2s.fillText(
					tmpText,
					(renderer.cOutX + x - 150) * renderer.zoom,
					(renderer.cOutY + y + 30) * renderer.zoom);
			y += 25 + localDiff;
			tmpLength = 0;
			tmpText = "";
		}
	}
	
	// Print the remainig text
	this.c2s.fillText(
			tmpText,
			(renderer.cOutX + x - 150) * renderer.zoom,
			(renderer.cOutY + y + 30) * renderer.zoom);
};

SVGExporter.prototype.drawArcSvg = function(x1, y1, x2, y2, x3, y3, color, radius) {
	var firstAngle = this.getAngle(x1, y1, x2, y2);
	var secondAngle = this.getAngle(x1, y1, x3, y3);
	
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			(x1 + renderer.cOutX) * renderer.zoom, 
		    (y1 + renderer.cOutY) * renderer.zoom, 
		    this.getDistance(x1, y1, x2, y2) * renderer.zoom,
		    firstAngle, secondAngle, false);
	this.c2s.stroke();
	
	this.drawPointSvg(x1, y1, color, radius);
	this.drawPointSvg(x2, y2, color, radius);
	this.drawPointSvg(x3, y3, color, radius);
};

SVGExporter.prototype.drawShapeSvg = function(shape) {
	this.drawAllComponents(shape.components, shape.x, shape.y);
	this.drawPointSvg(shape.x, shape.y, shape.color, shape.radius);
};
SVGExporter.prototype.exportSVG = function() {
    // will return the SVG
    this.drawAllComponents(renderer.logicDisplay.components, 0, 0);
    // test first
    console.log(this.c2s.getSerializedSvg(true))
}