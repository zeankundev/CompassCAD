// We'll skip the keyboard stuff: nobody uses them
// in the mobile app. 
class MouseHandler {
    cursorXGlobal: number;
    cursorYGlobal: number;
    cLMB: boolean;
    cRMB: boolean;
    pLMB: boolean;
    pRMB: boolean;
    constructor() {
        this.cursorXGlobal = 0;
        this.cursorYGlobal = 0;
        this.cLMB = false;
        this.cRMB = false;
        this.pLMB = false;
        this.pRMB = false;
    }
    updateCoords(x: number, y: number) {
        this.cursorXGlobal = x;
        this.cursorYGlobal = y;
    }
    onMouseMove(e: MouseEvent) {
        this.updateCoords(e.pageX, e.pageY);
    }
    onMouseDown(e: MouseEvent) {
        switch (e.which) {
            case 1:
                this.cLMB = true;
                this.cRMB = false;
                break;
            case 3:
                this.cLMB = false;
                this.cRMB = true;
                break;
        }
    }
    onMouseUp(e: MouseEvent) {
        switch (e.which) {
            case 1:
                this.cLMB = false;
                break;
            case 3:
                this.cRMB = false;
                break;
        }
    }
}