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

class Component {
    active: boolean
    type: number
    color: string
    radius: number
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