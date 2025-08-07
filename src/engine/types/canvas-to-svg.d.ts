declare module 'canvas-to-svg' {
    import { CanvasPattern, CanvasGradient } from "canvas-to-svg/dist/shared";
    export default class CanvasToSvg {
        width: number;
        height: number;
        enableMirroring: boolean;
        canvas: CanvasToSvg;
        __document: Document;
        __canvas?: HTMLCanvasElement;
        __ctx: CanvasRenderingContext2D;
        __ids: {
            [key: string]: string;
        };
        __root: SVGSVGElement;
        __defs: SVGElement;
        __currentElement: SVGElement | undefined;
        __groupStack: SVGElement[];
        __currentElementsToStyle: null | {
            element: any;
            children: any[];
        };
        [k: string]: any;
        constructor(width?: number, height?: number);
        __createElement(elementName: string, properties?: any, resetFill?: boolean): SVGElement;
        __setDefaultStyles(): void;
        /**
         * Applies styles on restore
         */
        __applyStyleState(styleState: any): void;
        /**
         * Gets the current style state
         */
        __getStyleState(): any;
        /**
         * Applies the current styles to the current SVG element. On "ctx.fill" or "ctx.stroke"
         */
        __applyStyleToCurrentElement(type: "stroke" | "fill"): void;
        __closestGroupOrSvg(node?: SVGElement | ParentNode | undefined | null): SVGElement | void;
        /**
         * Returns the serialized value of the svg so far
         * @param fixNamedEntities - Standalone SVG doesn't support named entities, which document.createTextNode encodes.
         *                           If true, we attempt to find all named entities and encode it as a numeric entity.
         * @return serialized svg
         */
        getSerializedSvg(fixNamedEntities: boolean): string;
        /**
         * Returns the root svg
         * @return
         */
        getSvg(): SVGSVGElement;
        /**
         * Will generate a group tag.
         */
        save(): void;
        /**
         * Sets current element to parent, or just root if already root
         */
        restore(): void;
        /**
         * Helper method to add transform
         * @private
         */
        __addTransform(t: any): void;
        /**
         *  scales the current element
         */
        scale(x: any, y: any): void;
        /**
         * rotates the current element
         */
        rotate(angle: any): void;
        /**
         * translates the current element
         */
        translate(x: any, y: any): void;
        /**
         * applies a transform to the current element
         */
        transform(a: any, b: any, c: any, d: any, e: any, f: any): void;
        /**
         * Create a new Path Element
         */
        beginPath(): void;
        /**
         * Helper function to apply currentDefaultPath to current path element
         * @private
         */
        __applyCurrentDefaultPath(): void;
        /**
         * Helper function to add path command
         * @private
         */
        __addPathCommand(command: any): void;
        /**
         * Adds the move command to the current path element,
         * if the currentPathElement is not empty create a new path element
         */
        moveTo(x: number, y: number): void;
        /**
         * Closes the current path
         */
        closePath(): void;
        /**
         * Adds a line to command
         */
        lineTo(x: any, y: any): void;
        /**
         * Add a bezier command
         */
        bezierCurveTo(cp1x: any, cp1y: any, cp2x: any, cp2y: any, x: any, y: any): void;
        /**
         * Adds a quadratic curve to command
         */
        quadraticCurveTo(cpx: any, cpy: any, x: any, y: any): void;
        /**
         * Adds the arcTo to the current path
         *
         * @see http://www.w3.org/TR/2015/WD-2dcontext-20150514/#dom-context-2d-arcto
         */
        arcTo(x1: any, y1: any, x2: any, y2: any, radius: any): void;
        /**
         * Sets the stroke property on the current element
         */
        stroke(): void;
        /**
         * Sets fill properties on the current element
         */
        fill(): void;
        /**
         *  Adds a rectangle to the path.
         */
        rect(x: any, y: any, width: any, height: any): void;
        /**
         * adds a rectangle element
         */
        fillRect(x: any, y: any, width: any, height: any): void;
        /**
         * Draws a rectangle with no fill
         * @param x
         * @param y
         * @param width
         * @param height
         */
        strokeRect(x: any, y: any, width: any, height: any): void;
        /**
         * Clear entire canvas:
         * 1. save current transforms
         * 2. remove all the childNodes of the root g element
         */
        __clearCanvas(): void;
        /**
         * "Clears" a canvas by just drawing a white rectangle in the current group.
         */
        clearRect(x: any, y: any, width: any, height: any): void;
        /**
         * Adds a linear gradient to a defs tag.
         * Returns a canvas gradient object that has a reference to it's parent def
         */
        createLinearGradient(x1: any, y1: any, x2: any, y2: any): CanvasGradient;
        /**
         * Adds a radial gradient to a defs tag.
         * Returns a canvas gradient object that has a reference to it's parent def
         */
        createRadialGradient(x0: any, y0: any, r0: any, x1: any, y1: any, r1: any): CanvasGradient;
        /**
         * Parses the font string and returns svg mapping
         * @private
         */
        __parseFont(): {
            style: string;
            size: string;
            family: string;
            weight: string;
            decoration: string;
            href: null;
        } | undefined;
        /**
         * Helper to link text fragments
         * @param font
         * @param element
         * @return {*}
         * @private
         */
        __wrapTextLink(font: any, element: any): any;
        /**
         * Fills or strokes text
         * @param text
         * @param x
         * @param y
         * @param action - stroke or fill
         * @private
         */
        __applyText(text: any, x: any, y: any, action: any): void;
        /**
         * Creates a text element
         * @param text
         * @param x
         * @param y
         */
        fillText(text: any, x: any, y: any): void;
        /**
         * Strokes text
         * @param text
         * @param x
         * @param y
         */
        strokeText(text: any, x: any, y: any): void;
        /**
         * No need to implement this for svg.
         * @param text
         * @return {TextMetrics}
         */
        measureText(text: any): TextMetrics;
        /**
         *  Arc command!: any
         */
        arc(x: any, y: any, radius: any, startAngle: any, endAngle: any, counterClockwise?: any): void;
        /**
         * Generates a ClipPath from the clip command.
         */
        clip(): void;
        /**
         * Draws a canvas, image or mock context to this canvas.
         * Note that all svg dom manipulation uses node.childNodes rather than node.children for IE support.
         * http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
         */
        drawImage(): void;
        /**
         * Generates a pattern tag
         */
        createPattern(image: any, repetition: any): CanvasPattern;
        setLineDash(dashArray: any): void;
    }
    
}