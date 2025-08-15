import { 
    Component, 
    Point, 
    Measure, 
    Circle, 
    Rectangle, 
    Label, 
    Arc, 
    Shape,
    Line,
    Picture,
    componentTypes, 
    Polygon,
    Vector
} from "./ComponentHandler";

export class LogicDisplay {
    components: Array<Component>;
    constructor() {
        this.components = new Array()
    }
    // init skipped: what does it do anw?
    addComponent(component: Component) {
        this.components.push(component)
    }
    uhh_yeah() {
        this.components.push(new Point(-100, -100));
        this.components.push(new Point(100, -100));
        
        var p = new Point(100, 100);
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
    }
    exportJSON() {
        return JSON.stringify(this.components);
    }
    importJSON(arrJSON: Component[], parent: Array<Component>) {
        for ( var i = 0; i < arrJSON.length; i++ ) {
            if ( !arrJSON[i].active )
                continue;
            
            switch (arrJSON[i].type) {
                case componentTypes.point:
                    const point = arrJSON[i] as Point;
                    parent.push(new Point(point.x, point.y, point.opacity, point.name));
                    break;
                case componentTypes.line:
                    const line = arrJSON[i] as Line;
                    parent.push(new Line(
                        line.x1,
                        line.y1,
                        line.x2,
                        line.y2,
                        line.radius,
                        line.color,
                        line.opacity,
                        line.name
                    ));
                    break;
                case componentTypes.rectangle:
                    const rect = arrJSON[i] as Rectangle;
                    parent.push(new Rectangle(
                        rect.x1,
                        rect.y1,
                        rect.x2,
                        rect.y2,
                        rect.radius,
                        rect.color,
                        rect.opacity,
                        rect.name
                    ));
                    break;
                case componentTypes.circle:
                    const circle = arrJSON[i] as Circle;
                    parent.push(new Circle(
                        circle.x1,
                        circle.y1,
                        circle.x2,
                        circle.y2,
                        circle.radius,
                        circle.color,
                        circle.opacity,
                        circle.name
                    ));
                    break;
                case componentTypes.arc:
                    const arc = arrJSON[i] as Arc;
                    parent.push(new Arc(
                        arc.x1,
                        arc.y1,
                        arc.x2,
                        arc.y2,
                        arc.x3,
                        arc.y3,
                        arc.radius,
                        arc.color,
                        arc.opacity,
                        arc.name
                    ));
                    break;
                case componentTypes.measure:
                    const measure = arrJSON[i] as Measure;
                    parent.push(new Measure(
                        measure.x1,
                        measure.y1,
                        measure.x2,
                        measure.y2,
                        measure.radius,
                        measure.opacity,
                        measure.name
                    ));
                    break;
                case componentTypes.label:
                    const label = arrJSON[i] as Label;
                    parent.push(new Label(
                        label.x,
                        label.y,
                        label.text,
                        label.fontSize,
                        label.opacity,
                        label.name
                    ));
                    break;
                case componentTypes.shape:
                    const shape = arrJSON[i] as Shape;
                    var s = new Shape(shape.x, shape.y);
                    this.importJSON(shape.components, s.components);
                    parent.push(s);
                    break;
                case componentTypes.picture:
                    const picture = arrJSON[i] as Picture;
                    parent.push(new Picture(
                        picture.x,
                        picture.y,
                        picture.pictureSource,
                        picture.opacity,
                        picture.name
                    ));
                    break;
                case componentTypes.polygon:
                    const polygon = arrJSON[i] as Polygon;
                    parent.push(new Polygon(
                        polygon.vectors.map(vector => new Vector(vector.x, vector.y)),
                        polygon.color,
                        polygon.strokeColor,
                        polygon.opacity,
                        polygon.enableStroke,
                        polygon.name
                    ))
            }
        }
    }
}