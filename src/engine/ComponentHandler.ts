// Just to ease the engine on typing the code :)
export const componentTypes = {
    point: 1,
    line: 2,
    circle: 3,
    rectangle: 4,
    arc: 5,
    measure: 6,
    label: 7,
    shape: 8,
    picture: 9,
    polygon: 10,
    boundBox: 11
}

export class Component {
    active: boolean;
    type: number;
    color: string;
    radius: number;
    opacity: number;
    name: string;
    constructor() {
        this.active = true;
        this.type = 0;
        this.color = '#ffffff';
        this.radius = 2;
        this.opacity = 100;
        this.name = 'Component';
    }
    setActive?(state: boolean) {
        this.active = state;
    }
    isActive?() {
        return this.active;
    }
}

export class Point extends Component {
    x: number;
    y: number;
    constructor(x: number, y: number, opacity?: number, name?: string) {
        super();
        this.radius = 5;
        this.type = componentTypes.point;
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Point';
    }
}

export class Line extends Component {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    radius: number;
    color: string;
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        color?: string,
        opacity?: number, 
        name?: string
    ) {
        super();
        this.radius = radius != undefined ? radius : 2;
        this.type = componentTypes.line;
        this.color = color != undefined ? color : '#ffffff';
        this.x1 = x1 != undefined ? x1 : 0;
        this.x2 = x2 != undefined ? x2 : 0;
        this.y1 = y1 != undefined ? y1 : 0;
        this.y2 = y2 != undefined ? y2 : 0;
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Line';
    }
}

export class Circle extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        color?: string,
        opacity?: number, 
        name?: string
    ) {
        super(x1, y1, x2, y2, radius, color, opacity);
        this.type = componentTypes.circle;
        this.name = name != undefined ? name : 'Circle';
    }
}

export class Rectangle extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        color?: string,
        opacity?: number, 
        name?: string
    ) {
        super(x1, y1, x2, y2, radius, color, opacity);
        this.type = componentTypes.rectangle;
        this.name = name != undefined ? name : 'Rectangle';
    }
}

export class Measure extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        opacity?: number, 
        name?: string
    ) {
        super(x1, y1, x2, y2, radius, '#ffff33', opacity);
        this.type = componentTypes.measure;
        this.name = name != undefined ? name : 'Measure';
    }
}

export class Label extends Point {
    text: string;
    fontSize: number;
    constructor(
        x: number, 
        y: number, 
        text?: string,
        fontSize?: number,
        opacity?: number, 
        name?: string
    ) {
        super(x, y);
        this.type = componentTypes.label;
        this.color = '#eeeeee';
        this.text = text != undefined ? text : 'Sample text';
        this.fontSize = fontSize != undefined ? fontSize : 18;
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Label';
    }
}

export class Arc extends Component {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
    radius: number;
    color: string;

    constructor(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
        radius?: number,
        color?: string,
        opacity?: number, 
        name?: string
    ) {
        super();
        this.radius = radius != undefined ? radius : 2;
        this.type = componentTypes.arc;
        this.color = color != undefined ? color : '#ffffff';
        this.x1 = x1 != undefined ? x1 : 0;
        this.x2 = x2 != undefined ? x2 : 0;
        this.x3 = x3 != undefined ? x3 : 0;
        this.y1 = y1 != undefined ? y1 : 0;
        this.y2 = y2 != undefined ? y2 : 0;
        this.y3 = y3 != undefined ? y3 : 0;
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Arc';
    }
}

export class Shape extends Component {
    x: number;
    y: number;
    components: Array<Component>;

    constructor(
        x: number,
        y: number, 
        name?: string
    ) {
        super();
        this.type = componentTypes.shape;
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
        this.components = new Array();
        this.name = name != undefined ? name : 'Shape';
    }
    addComponent(component: Component) {
        this.components.push(component);
    }
}

export class Picture extends Point {
    pictureSource: string;
    constructor(
        x: number,
        y: number,
        pictureSource?: string,
        opacity?: number, 
        name?: string
    ) {
        super(x, y);
        this.type = componentTypes.picture;
        this.pictureSource = pictureSource != undefined ? pictureSource : '';
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Picture';
    }
}
interface VectorType {
    x: number;
    y: number;
}
export class Vector {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
    }
}
export class Polygon extends Component {
    vectors: VectorType[];
    color: string;
    strokeColor: string;
    enableStroke: boolean;
    constructor(vectors: VectorType[], fillColor?: string, strokeColor?: string, opacity?: number, enableStroke?: boolean, name?: string) {
        super();
        this.type = componentTypes.polygon;
        this.color = fillColor || "#ffffff";
        this.strokeColor = strokeColor || "#000000";
        this.vectors = vectors || [];
        this.enableStroke = enableStroke || true;
        this.opacity = opacity != undefined ? opacity : 100;
        this.name = name != undefined ? name : 'Polygon';
    }
}
export class BoundBox extends Rectangle {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        name?: string
    ) {
        super(x1, y1, x2, y2, 2, '#FFFFFF', 100);
        this.type = componentTypes.boundBox;
        this.name = name != undefined ? name : 'Boundbox';
    }
}