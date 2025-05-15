function KeyboardHandler() {
    // Enumerate all keyboard keys
    this.KEYS = {
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
        FORWARDSLASH: 191,
        LESSTHAN: 188,
        GREATERTHAN: 190,
        SEMICOLON: 59,
        SEMICOLON_CHROME: 186,
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
        NUM: function (n) { return n + 48; },
        NUMPAD: function (n) { return n + 96; }
    };

    this.lastKey = 0;
    this.currentKeyBuffer = [false, false];
    this.defaultPreventionList = [];
    this.keyEvents = [];
    this.ctrlPressed = false;

    // Add tracking of currently pressed keys
    this.pressedKeys = new Set();
    this.keyToString = {
        16: 'Shift',
        17: 'Ctrl',
        18: 'Alt',
        27: 'Esc',
        32: 'Space',
        37: '←',
        38: '↑',
        39: '→',
        40: '↓',
        46: 'Del',
        8: 'Bksp',
        9: 'Tab',
        13: 'Enter',
        36: 'Home',
        35: 'End',
        45: 'Ins',
        112: 'F1',
        113: 'F2',
        114: 'F3',
        115: 'F4',
        116: 'F5',
        117: 'F6',
        118: 'F7',
        119: 'F8',
        120: 'F9',
        121: 'F10',
        122: 'F11',
        123: 'F12',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        48: '0',
        225: 'AltGr'
    };
}

KeyboardHandler.prototype.setLastKey = function (k) {
    this.lastKey = k;
};

KeyboardHandler.prototype.getDisplayText = function() {
    if (this.pressedKeys.size === 0) return '';
    
    const keyNames = Array.from(this.pressedKeys).map(keyCode => {
        // For letter keys, use the character
        if (keyCode >= 65 && keyCode <= 90) {
            return String.fromCharCode(keyCode);
        }
        // For known special keys, use the mapping
        return this.keyToString[keyCode] || keyCode;
    });
    
    return keyNames.join('+');
};

KeyboardHandler.prototype.defaultKeyDownAction = function (key) {
    this.lastKey = key;
};

KeyboardHandler.prototype.addKeyEvent = function (keyDown, key, fx, modifiers) {
    var keyEvent = new KeyboardEvent(keyDown, key, fx, modifiers);
    this.keyEvents.push(keyEvent);
};

KeyboardHandler.prototype.onKeyUp = function (e) {
    this.pressedKeys.delete(e.which);
    if (e.which === this.KEYS.CONTROL) {
        this.ctrlPressed = false;
    }
    for (var k = this.keyEvents.length - 1; k >= 0; k--) {
        if (this.keyEvents[k].key === e.which && !this.keyEvents[k].keyDown) {
            if (this.keyEvents[k].modifiers && this.keyEvents[k].modifiers.ctrl && !this.ctrlPressed) continue;
            this.keyEvents[k].fx();
        }
    }
};

KeyboardHandler.prototype.onKeyDown = function (e) {
    this.pressedKeys.add(e.which);
    if (e.which === this.KEYS.CONTROL) {
        this.ctrlPressed = true;
    }
    for (var k = 0; k < this.defaultPreventionList.length; k++)
        if (this.defaultPreventionList[k] === e.which)
            e.preventDefault();

    this.defaultKeyDownAction(e.which);

    for (var k = this.keyEvents.length - 1; k >= 0; k--) {
        if (this.keyEvents[k].key === e.which && this.keyEvents[k].keyDown) {
            if (this.keyEvents[k].modifiers && this.keyEvents[k].modifiers.ctrl && !this.ctrlPressed) continue;
            this.keyEvents[k].fx();
        }
    }
};

KeyboardHandler.prototype.setKeyEnabled = function (key, enabled) {
    var found = -1;
    for (var i = 0; i < this.defaultPreventionList.length; i++) {
        if (this.defaultPreventionList[i] === key) {
            found = i;
            break;
        }
    }

    if (found !== -1 && enabled)
        delete this.defaultPreventionList[i];

    if (found === -1 && !enabled)
        this.defaultPreventionList.push(key);
};

function KeyboardEvent(keyDown, key, fx, modifiers) {
    this.keyDown = keyDown;
    this.key = key;
    this.fx = fx;
    this.modifiers = modifiers || {};
}

/**
 * Class that handles mouse input
 */
function MouseHandler() {
	// Global cursor coordinates
	this.cursorXGlobal = 0;
	this.cursorYGlobal = 0;
	
	// Mouse click state
	this.cLMB = false;
	this.cRMB = false;
	this.pLMB = false;
	this.pRMB = false;
}

MouseHandler.prototype.updateCoords = function(x, y) {
	this.cursorXGlobal = x;
	this.cursorYGlobal = y;
};

MouseHandler.prototype.onMouseMove = function(e) {
	this.updateCoords(e.pageX, e.pageY);
};

MouseHandler.prototype.onMouseDown = function(e) {
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

MouseHandler.prototype.onMouseUp = function(e) {
	switch (e.which) {
		case 1:
			this.cLMB = false;
			break;
		case 3:
			this.cRMB = false;
			break;
	}
};
MouseHandler.prototype.onMouseLeave = function(e) {
    this.updateCoords(0, 0);
}