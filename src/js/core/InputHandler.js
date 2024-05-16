const keyCodes = {
    shift: 16,
    control: 17,
    alt: 18,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    capsLock: 20,
    enter: 13,
    slash: 220,
    forwardSlash: 191,
    lessThan: 188,
    greaterThan: 190,
    semicolon: 59,
    apostrophe: 222,
    openBracket: 219,
    closeBracket: 221,
    backspace: 8,
    tab: 9,
    space: 32,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    esc: 27,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    printScreen: 44,
    scrollLock: 145,
    breakKey: 19,
    dash: 109,
    plus: 107,
    tilde: 192,
    numpadSlash: 111,
    numpadAsterisk: 106,
    numpadPeriod: 110,
    insert: 45,
    delete: 46,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
    num: n => n + 48,
    numpad: n => n + 96
};

class KeyboardEvent {
    constructor(keyDown, key, fx) {
        this.keyDown = keyDown;
        this.key = key;
        this.fx = fx;
    }
}

class KeyboardHandler {
    constructor() {
        this.keys = keyCodes;
        this.lastKey = 0;
        this.currentKeyBuffer = [false, false];
        this.defaultPreventionList = [];
        this.keyEvents = [];
    }

    setLastKey = (k) => {
        this.lastKey = k;
    };

    defaultKeyDownAction = (key) => {
        this.lastKey = key;
    };

    addKeyEvent = (keyDown, key, fx) => {
        const keyEvent = new KeyboardEvent(keyDown, key, fx);
        this.keyEvents.push(keyEvent);
    };

    onKeyUp = (e) => {
        for (let k = this.keyEvents.length - 1; k >= 0; k--) {
            if (this.keyEvents[k].key === e.which && !this.keyEvents[k].keyDown) {
                this.keyEvents[k].fx();
            }
        }
    };

    onKeyDown = (e) => {
        for (let k = 0; k < this.defaultPreventionList.length; k++) {
            if (this.defaultPreventionList[k] === e.which) {
                e.preventDefault();
            }
        }

        this.defaultKeyDownAction(e.which);

        for (let k = this.keyEvents.length - 1; k >= 0; k--) {
            if (this.keyEvents[k].key === e.which && this.keyEvents[k].keyDown) {
                this.keyEvents[k].fx();
            }
        }
    };

    setKeyEnabled = (key, enabled) => {
        const found = this.defaultPreventionList.indexOf(key);
        if (found !== -1 && enabled) {
            this.defaultPreventionList.splice(found, 1);
        }
        if (found === -1 && !enabled) {
            this.defaultPreventionList.push(key);
        }
    };
}

class MouseHandler {
    constructor() {
        this.cursorXGlobal = 0;
        this.cursorYGlobal = 0;
        this.cLMB = false;
        this.cRMB = false;
        this.pLMB = false;
        this.pRMB = false;
    }

    updateCoords = (x, y) => {
        this.cursorXGlobal = x;
        this.cursorYGlobal = y;
    };

    onMouseMove = (e) => {
        this.updateCoords(e.pageX, e.pageY);
    };

    onMouseDown = (e) => {
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
    };

    onMouseUp = (e) => {
        switch (e.which) {
            case 1:
                this.cLMB = false;
                break;
            case 3:
                this.cRMB = false;
                break;
        }
    };
}
