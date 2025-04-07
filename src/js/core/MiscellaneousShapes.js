const CreateVerticalBarrel = () => {
    const shape = new Shape()
    shape.addComponent(new Line(0,0,0,100));
	shape.addComponent(new Line(0,0,25,50));
	shape.addComponent(new Line(0,0,-25,50));
	shape.addComponent(new Line(-25,50,0,50))
	shape.addComponent(new Line(25,50,0,50));
	shape.addComponent(new Label(0,0,'North', 18));
    return shape
}

const PlantATree = () => {
    const shape = new Shape(0,0);
	shape.addComponent(new Circle(0,0,20,0));
	shape.addComponent(new Line(-5,-5,5,5));
	shape.addComponent(new Line(-5,5,5,-5));
	//s.addComponent(new Line(400,0,0,400));
	shape.addComponent(new Label(50,40,"TREE"));
	
	return shape;
}