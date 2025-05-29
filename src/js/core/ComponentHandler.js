var COMPONENT_TYPES = {
    POINT : 1,
    LINE : 2,
    CIRCLE : 3,
    RECTANGLE : 4,
    ARC : 5,
    MEASURE : 6,
    LABEL : 7,
    SHAPE : 8, // TODO
    PICTURE: 9
};

/**
* Abstract class Component used to derive
* all other concrete item classes
*/
function Component() {
    this.active = true;
    this.type = 0; 
    this.color = "#ffffff";
    this.name = "Component"; // Adjustable names for the designer's convenience
    this.radius = 2;
    this.opacity = 100;
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
function Point(x, y, name, opacity) {
    Component.call(this);

    this.radius = 5;
    this.type = COMPONENT_TYPES.POINT;
    this.name = name || "Point";
    this.x = 0;
    this.y = 0;
    this.opacity = opacity !== undefined ? opacity : 100;

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
function Line(x1, y1, x2, y2, radius, color, name, opacity) {
    Component.call(this);

    this.type = COMPONENT_TYPES.LINE;
    this.name = name || "Line";
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;

    if (radius != undefined) {
        this.radius = radius
    } else {
        this.radius = 2
    }

    if (color != undefined) {
        this.color = color
    }

    this.opacity = opacity !== undefined ? opacity : 100;

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
function Circle(x1, y1, x2, y2, radius, color, name, opacity) {
    Line.call(this, x1, y1, x2, y2, radius, color, name, opacity);
    this.radius = radius !== undefined ? radius : 2;
    this.color = color !== undefined ? color : this.color;
    this.name = name || "Circle";
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
function Rectangle(x1, y1, x2, y2, radius, color, name, opacity) {
    Line.call(this, x1, y1, x2, y2, radius, color, name, opacity);
    this.name = name || "Rectangle";
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
function Measure(x1, y1, x2, y2, color, name, opacity) {
    Line.call(this, x1, y1, x2, y2, 2, color, name, opacity);
    this.name = name || "Measure";
    this.type = COMPONENT_TYPES.MEASURE;
    this.color = "#ffff33";
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
function Label(x, y, text, fontSize, name, opacity) {
    Point.call(this, x, y, name, opacity);

    this.type = COMPONENT_TYPES.LABEL;
    this.name = name || "Label";
    this.color = "#eeeeee";
    this.text = text;
    this.fontSize = fontSize;
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
function Arc(x1, y1, x2, y2, x3, y3, radius, color, name, opacity) {
    Component.call(this);

    this.type = COMPONENT_TYPES.ARC;
    this.name = name || "Arc";
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    this.x3 = 0;
    this.y3 = 0;

    if (radius != undefined) {
        this.radius = radius
    } else {
        this.radius = 2
    }
    this.opacity = opacity !== undefined ? opacity : 100;

    if (color != undefined) {
        this.color = color
    }

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
function Shape(x, y, name) {
    Component.call(this);

    this.type = COMPONENT_TYPES.SHAPE;
    this.name = name || "Shape";
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

function Picture(x, y, basedURL, name, opacity) {
    Component.call(this);
    
    this.type = COMPONENT_TYPES.PICTURE;
    this.name = name || "Picture";
    this.x = 0;
    this.y = 0;
    this.opacity = opacity !== undefined ? opacity : 100;
    this.pictureSource = ''
    if ( x != undefined && y != undefined && basedURL != undefined) {
        this.x = x;
        this.y = y;
        this.pictureSource = basedURL
    }
}
Picture.prototype = new Component();
Picture.prototype.constructor = Picture;

/**
* Add a component to a shape
* @param component
*/
Shape.prototype.addComponent = function(component) {
    this.components.push(component);
};