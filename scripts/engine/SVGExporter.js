function SVGExporter() {
    this.c2s = new canvas2svg(1920, 1080)
    // hijack the renderer's logic display so we can get that shit there
    this.logicDisplay = renderer.logicDisplay
    console.log(`renderer coutx: ${renderer.cOutX},renderer couty: ${renderer.cOutY}`)
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
		refinedX = origin.x / 13
	} else if (origin.x < -300) {
		refinedX = origin.x / 7
	} else {
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
		    renderer.getDistance(x1, y1, x2, y2) * 1,
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
	
	var localZoom = 1;
	var localDiff = 0;
	
	if ( 1 <= 0.25 ) {
		localZoom = 0.5;
		localDiff = 20;
	}

	this.drawLineSvg(x1, y1, x2, y2, color, radius);
	
	this.c2s.fillStyle = "#000000";
	this.c2s.font = (renderer.fontSize * localZoom) + "px Consolas, monospace";
	this.c2s.fillText(
			distance.toFixed(2) + "" + renderer.unitMeasure,
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
					(x - 150) * 1,
					(y + 30) * 1);
			y += 25 + localDiff;
			tmpLength = 0;
			tmpText = "";
		}
	}
	
	// Print the remainig text
	this.c2s.fillText(
			tmpText,
			(x - 150) * 1,
			(y + 30) * 1);
};

SVGExporter.prototype.drawArcSvg = function(x1, y1, x2, y2, x3, y3, color, radius) {
	var firstAngle = renderer.getAngle(x1, y1, x2, y2);
	var secondAngle = renderer.getAngle(x1, y1, x3, y3);
	
	this.c2s.lineWidth = radius;
	this.c2s.fillStyle = "#000000";
	this.c2s.strokeStyle = "#000000";
	this.c2s.beginPath();
	this.c2s.arc(
			x1, 
		    y1, 
		    renderer.getDistance(x1, y1, x2, y2) * 1,
		    firstAngle, secondAngle, false);
	this.c2s.stroke();
	
	this.drawPointSvg(x1, y1, color, radius);
	this.drawPointSvg(x2, y2, color, radius);
	this.drawPointSvg(x3, y3, color, radius);
};
SVGExporter.prototype.exportSVG = function() {
    // will return the SVG
    this.drawAllComponents(renderer.logicDisplay.components, 15, 5);
    // test first
	console.log(this.c2s.getSerializedSvg(true))
    return this.c2s.getSerializedSvg(true)
}