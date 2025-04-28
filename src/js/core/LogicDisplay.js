
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
LogicDisplay.prototype.customSyntax = function (command) {
    if (!command.startsWith('\\')) {
        return command;
    }

    let result = [...this.components]; // make a copy of the data to manipulate
    const commands = command.split(';');

    commands.forEach(cmd => {
        const [action, param] = cmd.split('=');

        if (action.startsWith('\\')) {
            const parts = action.slice(1).split('.');
            let index = parseInt(parts[0], 10);
            let property = parts[1];

            if (!isNaN(index) && index < result.length) {
                if (param !== undefined && property) {
                    // Handle property assignment, e.g. \0.name.replaceTo="Hans"
                    let [prop, method] = property.split('.');

                    if (method === "replaceTo") {
                        let value = param.replace(/\"/g, ""); // remove the quotes
                        result[index][prop] = value;
                    }
                } else if (property) {
                    // Handle property access, e.g. \0.name
                    result = result[index][property];
                }
            }
        } else {
            console.log('arithmetic detected')
            const match = action.match(/\\(\d+)\.(\w+)([\+\-\*\/])(\d+)\.(\w+)/);
            if (match) {
                const index1 = parseInt(match[1], 10);
                const prop1 = match[2];
                const operator = match[3];
                const index2 = parseInt(match[4], 10);
                const prop2 = match[5];

                if (!isNaN(index1) && index1 < result.length && !isNaN(index2) && index2 < result.length) {
                    const value1 = parseFloat(result[index1][prop1]);
                    const value2 = parseFloat(result[index2][prop2]);
					console.log(`1:${value1};2:${value2}`)

                    if (!isNaN(value1) && !isNaN(value2)) {
                        switch (operator) {
                            case '+':
                                result = value1 + value2;
                                break;
                            case '-':
                                result = value1 - value2;
                                break;
                            case '*':
                                result = value1 * value2;
                                break;
                            case '/':
                                result = value1 / value2;
                                break;
                        }
                    }
                }
            } else if (action.startsWith('\\obj.find')) {
                // Handle search functionality
                let searchValue = param.replace(/\"/g, ""); // remove the quotes
                result = result.filter(obj => obj.type === searchValue);
            }
        }
    });

	if (result == undefined) {
		result = 'ERR5 (undefined result)'
	}

    return JSON.stringify(result);
};

LogicDisplay.prototype.hood_irony_type_shit = function() {
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
	
	this.components.push(new Label(300, -200, "dis is a fucking \"label\"", 50));
	
	this.components.push(new Arc(-400, -200, -500, -200, -300, -200));
	
	var s = new Shape(300, -400);
	s.addComponent(new Rectangle(0,0,100,100));
	s.addComponent(new Arc(100,50,100,0,100,100));
	s.addComponent(new Arc(0,50,0,100,0,0));
	this.components.push(s);
	
	this.components.push(new Circle(-500, 500, -500, 600));
	
	this.components.push(new Rectangle(200, 600, 500, 700));
	this.components.push(new Picture(-350, 500, 'https://media.discordapp.net/attachments/821609322676355092/1358735340164087980/20250407_162053.jpg?ex=67f4ec65&is=67f39ae5&hm=b32a4004b494375c12a4f3bc3dbefa82682327648293850bc9a186a14b8f9244&=&format=webp&width=446&height=794'));
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
				parent.push(new Point(arrJSON[i].x, arrJSON[i].y, arrJSON[i].name));
				break;
			case COMPONENT_TYPES.LINE:
				parent.push(new Line(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].radius,
						arrJSON[i].color,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.RECTANGLE:
				parent.push(new Rectangle(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].radius,
						arrJSON[i].color,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.CIRCLE:
				parent.push(new Circle(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].radius,
						arrJSON[i].color,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.ARC:
				parent.push(new Arc(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].x3,
						arrJSON[i].y3,
						arrJSON[i].radius,
						arrJSON[i].color,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.MEASURE:
				parent.push(new Measure(
						arrJSON[i].x1,
						arrJSON[i].y1,
						arrJSON[i].x2,
						arrJSON[i].y2,
						arrJSON[i].color,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.LABEL:
				parent.push(new Label(
						arrJSON[i].x,
						arrJSON[i].y,
						arrJSON[i].text,
						arrJSON[i].fontSize,
						arrJSON[i].name));
				break;
			case COMPONENT_TYPES.SHAPE:
				var s = new Shape(arrJSON[i].x, arrJSON[i].y, arrJSON[i].name);
				this.importJSON(arrJSON[i].components, s.components);
				parent.push(s);
				break;
			case COMPONENT_TYPES.PICTURE:
				parent.push(new Picture(
					arrJSON[i].x,
					arrJSON[i].y,
					arrJSON[i].pictureSource,
					arrJSON[i].name));
				break;
		}
	}
	refreshHierarchy();
};