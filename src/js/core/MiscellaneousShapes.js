const CreateVerticalBarrel = () => {
    const shape = new Shape()
    shape.addComponent(new Rectangle(0,0,100,100));
	shape.addComponent(new Circle(50,50,50,100));
	shape.addComponent(new Label(50,100,"V.B."));
    return shape
}

const PlantATree = () => {
    const shape = new Shape(0,0);
	shape.addComponent(new Circle(0,0,20,0));
	shape.addComponent(new Line(-5,-5,5,5));
	shape.addComponent(new Line(-5,5,5,-5));
	//s.addComponent(new Line(400,0,0,400));
	shape.addComponent(new Label(50,40,"A"));
	
	return shape;
}