class LogicDisplay {
    constructor() {
        this.components = new Array()
    }
    init() {}
    addComponent(component) {
        this.components.push(component)
    }
    // who needs this function anyways
    jettIsMyWaifu() {
        this.components.push(new Point(-100, -100));
        this.components.push(new Point(100, -100));
        
        var p = new Point(100, 100);
        p.setActive(false);
        this.components.push(p);
        
        this.components.push(new Ruler(-100, 100, -200, 300));
        
        this.components.push(new Circle(400, 400, 500, 400));
        
        this.components.push(new Rectangle(200, 100, 300, 200));
        
        this.components.push(new Rectangle(300, 200, 400, 100));
        
        this.components.push(new Rectangle(-200, 200, -300, 100));
        
        this.components.push(new Rectangle(-300, 100, -400, 200));
        
        this.components.push(new Ruler(200, 250, 400, 250));
        
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
    exportToJSON() {
        return JSON.stringify(this.components)
    }
    importJSON(array, parent) {
        for (let i = 0; i< array.length; i++) {
            if ( !arrJSON[i].active )
                continue;
            
            switch (arrJSON[i].type) {
                case componentTypes.point:
                    parent.push(new Point(arrJSON[i].x, arrJSON[i].y));
                    break;
                case componentTypes.line:
                    parent.push(new Line(
                            arrJSON[i].x1,
                            arrJSON[i].y1,
                            arrJSON[i].x2,
                            arrJSON[i].y2));
                    break;
                case componentTypes.rectangle:
                    parent.push(new Rectangle(
                            arrJSON[i].x1,
                            arrJSON[i].y1,
                            arrJSON[i].x2,
                            arrJSON[i].y2));
                    break;
                case componentTypes.circle:
                    parent.push(new Circle(
                            arrJSON[i].x1,
                            arrJSON[i].y1,
                            arrJSON[i].x2,
                            arrJSON[i].y2));
                    break;
                case componentTypes.arc:
                    parent.push(new Arc(
                            arrJSON[i].x1,
                            arrJSON[i].y1,
                            arrJSON[i].x2,
                            arrJSON[i].y2,
                            arrJSON[i].x3,
                            arrJSON[i].y3));
                    break;
                case componentTypes.ruler:
                    parent.push(new Ruler(
                            arrJSON[i].x1,
                            arrJSON[i].y1,
                            arrJSON[i].x2,
                            arrJSON[i].y2));
                    break;
                case componentTypes.label:
                    parent.push(new Label(
                            arrJSON[i].x,
                            arrJSON[i].y,
                            arrJSON[i].text));
                    break;
                case componentTypes.shape:
                    var s = new Shape(arrJSON[i].x, arrJSON[i].y);
                    this.importJSON(arrJSON[i].components, s.components);
                    parent.push(s);
                    break;
            }
        }
    }
}