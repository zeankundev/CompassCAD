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
}

export class Component {
    active: boolean;
    type: number;
    color: string;
    radius: number;
    opacity: number;
    constructor() {
        this.active = true;
        this.type = 0;
        this.color = '#ffffff';
        this.radius = 2;
        this.opacity = 100;
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
    constructor(x: number, y: number, opacity?: number) {
        super();
        this.radius = 5;
        this.type = componentTypes.point;
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
        this.opacity = opacity != undefined ? opacity : 100;
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
    ) {
        super(x1, y1, x2, y2, radius, color, opacity);
        this.type = componentTypes.circle;
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
    ) {
        super(x1, y1, x2, y2, radius, color, opacity);
        this.type = componentTypes.rectangle;
    }
}

export class Measure extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        opacity?: number
    ) {
        super(x1, y1, x2, y2, radius, '#ff3', opacity);
        this.type = componentTypes.measure;
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
        opacity?: number
    ) {
        super(x, y);
        this.type = componentTypes.label;
        this.color = '#eee';
        this.text = text != undefined ? text : 'Sample text';
        this.fontSize = fontSize != undefined ? fontSize : 18;
        this.opacity = opacity != undefined ? opacity : 100;
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
        opacity?: number
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
    }
}

export class Shape extends Component {
    x: number;
    y: number;
    components: Array<Component>;

    constructor(
        x: number,
        y: number
    ) {
        super();
        this.type = componentTypes.shape;
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
        this.components = new Array();
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
        opacity?: number
    ) {
        super(x, y);
        this.type = componentTypes.picture;
        this.pictureSource = pictureSource != undefined ? pictureSource : '';
        this.opacity = opacity != undefined ? opacity : 100;
    }
}
interface VectorType {
    x: number;
    y: number;
}
export class Polygon extends Component {
    vectors: VectorType[];
    color: string;
    strokeColor: string;
    enableStroke: boolean;
    constructor(vectors: VectorType[], fillColor?: string, strokeColor?: string, opacity?: number, enableStroke?: boolean) {
        super();
        this.type = componentTypes.polygon;
        this.color = fillColor || "#ffffff";
        this.strokeColor = strokeColor || "#000000";
        this.vectors = vectors || [];
        this.enableStroke = enableStroke || true;
        this.opacity = opacity != undefined ? opacity : 100;
    }
}