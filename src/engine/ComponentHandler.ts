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
    picture: 9
}

export class Component {
    active: boolean;
    type: number;
    color: string;
    radius: number;
    constructor() {
        this.active = true;
        this.type = 0;
        this.color = '#ffffff';
        this.radius = 2;
    }
    setActive(state: boolean) {
        this.active = state;
    }
    isActive() {
        return this.active;
    }
}

export class Point extends Component {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        super();
        this.radius = 5;
        this.type = componentTypes.point;
        this.x = x != undefined ? x : 0;
        this.y = y != undefined ? y : 0;
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
        color?: string
    ) {
        super();
        this.radius = radius != undefined ? radius : 2;
        this.type = componentTypes.line;
        this.color = color != undefined ? color : '#ffffff';
        this.x1 = x1 != undefined ? x1 : 0;
        this.x2 = x2 != undefined ? x2 : 0;
        this.y1 = y1 != undefined ? y1 : 0;
        this.y2 = y2 != undefined ? y2 : 0;
    }
}

export class Circle extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number,
        color?: string
    ) {
        super(x1, y1, x2, y2, radius, color);
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
        color?: string
    ) {
        super(x1, y1, x2, y2, radius, color);
        this.type = componentTypes.rectangle;
    }
}

export class Measure extends Line {
    constructor(
        x1: number, 
        y1: number, 
        x2: number, 
        y2: number,
        radius?: number
    ) {
        super(x1, y1, x2, y2, radius, '#ff3');
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
        fontSize?: number
    ) {
        super(x, y);
        this.type = componentTypes.label;
        this.color = '#eee';
        this.text = text != undefined ? text : 'Sample text';
        this.fontSize = fontSize != undefined ? fontSize : 18;
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
        x2: number,
        y1: number,
        y2: number,
        x3: number,
        y3: number,
        radius?: number,
        color?: string
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
        pictureSource?: string
    ) {
        super(x, y);
        this.type = componentTypes.picture;
        this.pictureSource = pictureSource != undefined ? pictureSource : '';
    }
}