var COMPONENT_TYPES = {
    POINT : 1,
    LINE : 2,
    CIRCLE : 3,
    RECTANGLE : 4,
    ARC : 5,
    MEASURE : 6,
    LABEL : 7,
    SHAPE : 8 // TODO
};

/**
* Abstract class Component used to derive
* all other concrete item classes
*/
function Component() {
    this.active = true;
    this.type = 0; 
    this.color = "#fff";
    this.radius = 2;
}

Component.prototype.setActive = function(active) {
    this.active = active;
};

Component.prototype.isActive = function() {
    return this.active;
};

/**
* Point component class
* Inherits from Component
* @param x
* @param y
*/
function Point(x, y) {
    Component.call(this);

    this.radius = 5;
    this.type = COMPONENT_TYPES.POINT;
    this.x = 0;
    this.y = 0;

    if ( x != undefined && y != undefined) {
        this.x = x;
        this.y = y;
    }
}
Point.prototype = new Component();
Point.prototype.constructor = Point;

/**
* Line component class
* Inherits from Component
* @param x1
* @param y1
* @param x2
* @param y2
*/
function Line(x1, y1, x2, y2) {
    Component.call(this);

    this.type = COMPONENT_TYPES.LINE;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;

    if ( x1 != undefined
        && y1 != undefined
        && x2 != undefined
        && y2 != undefined)
    {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}
Line.prototype = new Component();
Line.prototype.constructor = Line;

/**
* Circle component class
* Inherits from Line
* @param x1
* @param y1
* @param x2
* @param y2
*/
function Circle(x1, y1, x2, y2) {
    Line.call(this, x1, y1, x2, y2);

    this.type = COMPONENT_TYPES.CIRCLE;
}
Circle.prototype = new Line();
Circle.prototype.constructor = Circle;

/**
* Rectangle component class
* Inherits from Line
* @param x1
* @param y1
* @param x2
* @param y2
*/
function Rectangle(x1, y1, x2, y2) {
    Line.call(this, x1, y1, x2, y2);

    this.type = COMPONENT_TYPES.RECTANGLE;
}
Rectangle.prototype = new Line();
Rectangle.prototype.constructor = Rectangle;

/**
* Measure component class
* Inherits from Line
* @param x1
* @param y1
* @param x2
* @param y2
*/
function Measure(x1, y1, x2, y2) {
    Line.call(this, x1, y1, x2, y2);

    this.type = COMPONENT_TYPES.MEASURE;
    this.color = "#ff3";
}
Measure.prototype = new Line();
Measure.prototype.constructor = Measure;

/**
* Measure component class
* Inherits from Point
* @param x
* @param y
* @param text
*/
function Label(x, y, text) {
    Point.call(this, x, y);

    this.type = COMPONENT_TYPES.LABEL;
    this.color = "#eee";
    this.text = text;
}
Label.prototype = new Point();
Label.prototype.constructor = Label;

/**
* Circle component class
* Inherits from Component
* @param x1
* @param y1
* @param x2
* @param y2
* @param x3
* @param y3
*/
function Arc(x1, y1, x2, y2, x3, y3) {
    Component.call(this);

    this.type = COMPONENT_TYPES.ARC;
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.x3 = 0;
    this.y3 = 0;

    if ( x1 != undefined
        && y1 != undefined
        && x2 != undefined
        && y2 != undefined
        && x3 != undefined
        && y3 != undefined)
    {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;
    }
}
Arc.prototype = new Component();
Arc.prototype.constructor = Arc;

/**
* Shape component class
* Inherits from Component
* @param x
* @param y
*/
function Shape(x, y) {
    Component.call(this);

    this.type = COMPONENT_TYPES.SHAPE;
    this.x = 0;
    this.y = 0;
    this.color = "#f0f";
    this.components = new Array();

    if ( x != undefined && y != undefined) {
        this.x = x;
        this.y = y;
    }
}
Shape.prototype = new Component();
Shape.prototype.constructor = Shape;

/**
* Add a component to a shape
* @param component
*/
Shape.prototype.addComponent = function(component) {
    this.components.push(component);
};