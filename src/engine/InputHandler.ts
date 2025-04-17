interface KeyboardEventModifiers {
    ctrl: boolean
}
export class KeyboardEventCore {
    keyDown: boolean;
    key: number;
    fx: () => void;
    modifiers: KeyboardEventModifiers;

    constructor(
        keyDown: boolean, 
        key: number,
        fx: () => void,
        modifiers: KeyboardEventModifiers
    ) {
        this.keyDown = keyDown;
        this.key = key;
        this.fx = fx;
        this.modifiers = modifiers || {};
    }
}

interface KeyDefinitions {
    [key: string]: number | ((n: number) => number);
}

export class KeyboardHandler {
    keys: KeyDefinitions;
    lastKey: number;
    currentKeyBuffer: boolean[];
    defaultPreventionList: number[];
    keyEvents: KeyboardEventCore[];
    ctrlPressed: boolean;

    constructor() {
        this.keys = {
            SHIFT: 16,
            CONTROL: 17,
            ALT: 18,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            CAPSLOCK: 20,
            ENTER: 13,
            SLASH: 220,
            EQUALS: 187,
            FORWARDSLASH: 191,
            LESSTHAN: 188,
            GREATERTHAN: 190,
            SEMICOLON: 59,
            APOSTROPHE: 222,
            OPENBRACKET: 219,
            CLOSEBRACKET: 221,
            BACKSPACE: 8,
            TAB: 9,
            SPACE: 32,
            A: 65,
            B: 66,
            C: 67,
            D: 68,
            E: 69,
            F: 70,
            G: 71,
            H: 72,
            I: 73,
            J: 74,
            K: 75,
            L: 76,
            M: 77,
            N: 78,
            O: 79,
            P: 80,
            Q: 81,
            R: 82,
            S: 83,
            T: 84,
            U: 85,
            V: 86,
            W: 87,
            X: 88,
            Y: 89,
            Z: 90,
            ESC: 27,
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            PRINTSCREEN: 44,
            SCROLLLOCK: 145,
            BREAKK: 19,
            DASH: 109,
            PLUS: 107,
            TILDE: 192,
            NUMPADSLASH: 111,
            NUMPADASTERISK: 106,
            NUMPADPERIOD: 110,
            INSERT: 45,
            DEL: 46,
            PAGEUP: 33,
            PAGEDOWN: 34,
            END: 35,
            HOME: 36,
            NUM: function (n: number) { return n + 48; },
            NUMPAD: function (n: number) { return n + 96; }
        }
        this.lastKey = 0;
        this.currentKeyBuffer = [false, false];
        this.defaultPreventionList = [];
        this.keyEvents = [];
        this.ctrlPressed = false;
    }
    setLastKey(key: number) {
        this.lastKey = key;
    }
    defaultKeyDown(key: number) {
        this.lastKey = key;
    }
    addKeyEvent(
        keyDown: boolean, 
        key: number,
        fx: () => void,
        modifiers: KeyboardEventModifiers
    ) {
        let keyEvent = new KeyboardEventCore(keyDown, key, fx, modifiers);
        this.keyEvents.push(keyEvent);
    }
    onKeyUp(e: KeyboardEvent) {
        if (e.which === this.keys.CONTROL) {
            this.ctrlPressed = false;
        }
        for (let k = this.keyEvents.length - 1; k >= 0; k--) {
            if (this.keyEvents[k].key === e.which && !this.keyEvents[k].keyDown) {
                if (this.keyEvents[k].modifiers && this.keyEvents[k].modifiers.ctrl && !this.ctrlPressed)
                    continue;
                this.keyEvents[k].fx();
            }
        }
    }
    onKeyDown(e: KeyboardEvent) {
        if (e.which === this.keys.CONTROL) {
            this.ctrlPressed = true;
        }
        for (let k = 0; k < this.defaultPreventionList.length; k++) {
            if (this.defaultPreventionList[k] === e.which)
                e.preventDefault();
        }

        this.defaultKeyDown(e.which);

        for (let k = this.keyEvents.length - 1; k >= 0; k--) {
            if (this.keyEvents[k].key === e.which && this.keyEvents[k].keyDown) {
                if (this.keyEvents[k].modifiers && this.keyEvents[k].modifiers.ctrl && !this.ctrlPressed) continue;
                this.keyEvents[k].fx();
            }
        }
    }
    setKeyEnabled(key: number, enabled: boolean) {
        let found = -1;
        for (let i = 0; i < this.defaultPreventionList.length; i++) {
            if (this.defaultPreventionList[i] === key) {
                found = i;
                break;
            }
            if (found !== -1 && enabled) 
                delete this.defaultPreventionList[i];
    
            if (found === -1 && !enabled)
                this.defaultPreventionList.push(key);
        }
    }
}

export class MouseHandler {
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