export const COMPONENT_TYPES = {
    POINT: 1,
    LINE: 2,
    CIRCLE: 3,
    RECTANGLE: 4,
    ARC: 5,
    MEASURE: 6,
    LABEL: 7,
    SHAPE: 8,
    PICTURE: 9
}
export class Component {
    active: boolean;
    type: number;
    color: string;
    radius: number;
    constructor() {
        this.active = true;
        this.type = 0;
        this.color = '#fff';
        this.radius = 1;
    }
    setActive(active: boolean) {
        this.active = active;
    }
    isActive() {
        return this.active;
    }
}
export class Point extends Component {
    x: number;
    y: number;
    constructor(x?: number, y?: number) {
        super();
        this.radius = 5;
        this.type = COMPONENT_TYPES.POINT;
        this.x = 0;
        this.y = 0;
        if (x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
    }
}

export class Line extends Component {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    constructor(x1: number, y1: number, x2: number, y2: number, radius?: number) {
        super();
        this.type = COMPONENT_TYPES.LINE;
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;
        if (
            x1 !== undefined &&
            y1 !== undefined &&
            x2 !== undefined &&
            y2 !== undefined
        ) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
        }
        if (radius !== undefined) {
            this.radius = radius;
        }
    }
}
export class Circle extends Line {
    constructor(x1: number, y1: number, x2: number, y2: number, radius?: number) {
        super(x1, y1, x2, y2, radius);
        this.type = COMPONENT_TYPES.CIRCLE;
    }
}
export class Rectangle extends Line {
    constructor(x1: number, y1: number, x2: number, y2: number, radius?: number) {
        super(x1, y1, x2, y2, radius);
        this.type = COMPONENT_TYPES.RECTANGLE;
    }
}
export class Measure extends Line {
    constructor(x1: number, y1: number, x2: number, y2: number, radius?: number) {
        super(x1, y1, x2, y2, radius);
        this.type = COMPONENT_TYPES.MEASURE;
        this.color = "#ff3";
    }
}
export class Label extends Point {
    text: string;
    constructor(x: number, y: number, text: string) {
        super(x, y);
        this.type = COMPONENT_TYPES.LABEL;
        this.text = text;
    }
}
export class Arc extends Component {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, radius?: number) {
        super();
        this.type = COMPONENT_TYPES.ARC;
        this.x1 = 0;
        this.y1 = 0;
        this.x2 = 0;
        this.y2 = 0;
        this.x3 = 0;
        this.y3 = 0;
        if (
            x1 !== undefined &&
            y1 !== undefined &&
            x2 !== undefined &&
            y2 !== undefined &&
            x3 !== undefined &&
            y3 !== undefined
        ) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.x3 = x3;
            this.y3 = y3;
        }
        if (radius !== undefined) {
            this.radius = radius;
        }
    }
}
export class Shape extends Component {
    x: number;
    y: number;
    components: any[];
    constructor(x: number, y: number) {
        super();
        this.type = COMPONENT_TYPES.SHAPE;
        this.color = '#f0f';
        this.components = new Array();
        this.x = 0;
        this.y = 0;
        if (x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
    }
    addComponent(component: any) {
        this.components.push(component);
    }
}
export class Picture extends Component {
    x: number;
    y: number;
    pictureSource: string;
    constructor(x: number, y: number, pictureSource: string) {
        super();
        this.type = COMPONENT_TYPES.PICTURE;
        this.pictureSource = pictureSource;
        this.x = 0;
        this.y = 0;
        if (x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
    }
}