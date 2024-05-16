
function LogicDisplay() {
	// Array of all components used inside CAD
	this.components = new Array();
}

LogicDisplay.prototype.init = function() {
	// this.test(); // This create a list of basic components
	// this.importJSON(JSON.parse(this.exportJSON()), this.components);
};

LogicDisplay.prototype.addComponent = function(component) {
	this.components.push(component);
};

LogicDisplay.prototype.jettIsMyWaifu = function() {
	this.components.push(new Point(-100, -100));
	this.components.push(new Point(100, -100));
	
	var p = new Point(100, 100);
	p.setActive(false);
	this.components.push(p);
	
	this.components.push(new Measure(-100, 100, -200, 300));
	
	this.components.push(new Circle(400, 400, 500, 400));
	
	this.components.push(new Rectangle(200, 100, 300, 200));
	
	this.components.push(new Rectangle(300, 200, 400, 100));
	
	this.components.push(new Rectangle(-200, 200, -300, 100));
	
	this.components.push(new Rectangle(-300, 100, -400, 200));
	
	this.components.push(new Measure(200, 250, 400, 250));
	
	this.components.push(new Label(300, -200, "dis is a fucking \"label\""));
	
	this.components.push(new Arc(-400, -200, -500, -200, -300, -200));
	
	var s = new Shape(300, -400);
	s.addComponent(new Rectangle(0,0,100,100));
	s.addComponent(new Arc(100,50,100,0,100,100));
	s.addComponent(new Arc(0,50,0,100,0,0));
	this.components.push(s);
	
	this.components.push(new Circle(-500, 500, -500, 600));
	
	this.components.push(new Rectangle(200, 600, 500, 700));
};

LogicDisplay.prototype.exportJSON = function() {
	return JSON.stringify(this.components);
};

LogicDisplay.prototype.importJSON = function(arrJSON, parent) {
	for ( var i = 0; i < arrJSON.length; i++ ) {
		if ( !arrJSON[i].active )
			continue;
		
		switch (arrJSON[i].type) {
			case COMPONENT_TYPES.POINT:
				parent.push(new Point(arrJSON[i].x, arrJSON[i].y));
				break;
			case COMPONENT_TYPES.LINE:
				parent.push(new Line(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2));
				break;
			case COMPONENT_TYPES.RECTANGLE:
				parent.push(new Rectangle(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2));
				break;
			case COMPONENT_TYPES.CIRCLE:
				parent.push(new Circle(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2));
				break;
			case COMPONENT_TYPES.ARC:
				parent.push(new Arc(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].x3,
						arrJSON[i].y3));
				break;
			case COMPONENT_TYPES.MEASURE:
				parent.push(new Measure(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2));
				break;
			case COMPONENT_TYPES.LABEL:
				parent.push(new Label(
						arrJSON[i].x,
						arrJSON[i].y,
						arrJSON[i].text));
				break;
			case COMPONENT_TYPES.SHAPE:
				var s = new Shape(arrJSON[i].x, arrJSON[i].y);
				this.importJSON(arrJSON[i].components, s.components);
				parent.push(s);
				break;
		}
	}
};