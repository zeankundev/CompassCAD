const componentTypes = {
    point: 1,
    line: 2,
    circle: 3,
    rectangle: 4,
    arc: 5,
    ruler: 6,
    label: 7,
    customShape: 8
};

class ComponentHandler {
    constructor() {
        this.active = 0;
        this.type = 0;
        this.foregroundColor = '#e9e9e9';
        this.radius = 1;

        // Using arrow functions as methods
        this.setActive = (state) => {
            this.active = state;
        };

        this.isActive = () => {
            return this.active;
        };
    }
}

class Point extends ComponentHandler {
    constructor(x, y) {
        super();
        this.radius = 5;
        this.type = componentTypes.point;
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
    }
}

class Line extends ComponentHandler {
    constructor(x1, y1, x2, y2) {
        super();
        this.type = componentTypes.line;
        this.x1 = x1 !== undefined ? x1 : 0;
        this.y1 = y1 !== undefined ? y1 : 0;
        this.x2 = x2 !== undefined ? x2 : 0;
        this.y2 = y2 !== undefined ? y2 : 0;
    }
}

class Circle extends Line {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        this.type = componentTypes.circle;
    }
}

class Rectangle extends Line {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        this.type = componentTypes.rectangle;
    }
}

class Ruler extends Line {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        this.type = componentTypes.ruler;
        this.color = '#fcba03';
    }
}

class Label extends Point {
    constructor(x, y, text) {
        super(x, y);
        this.type = componentTypes.label;
        this.color = '#e9e9e9';
        this.text = text;
    }
}

class Arc extends ComponentHandler {
    constructor(x1, y1, x2, y2, x3, y3) {
        super();
        this.type = componentTypes.arc;
        this.x1 = x1 !== undefined ? x1 : 0;
        this.y1 = y1 !== undefined ? y1 : 0;
        this.x2 = x2 !== undefined ? x2 : 0;
        this.y2 = y2 !== undefined ? y2 : 0;
        this.x3 = x3 !== undefined ? x3 : 0;
        this.y3 = y3 !== undefined ? y3 : 0;
    }
}

class Shape extends ComponentHandler {
    constructor(x, y) {
        super();
        this.type = componentTypes.customShape;
        this.x = x !== undefined ? x : 0;
        this.y = y !== undefined ? y : 0;
        this.color = '#004cff';
        this.components = [];
    }

    addComponent(component) {
        this.components.push(component);
    }
}