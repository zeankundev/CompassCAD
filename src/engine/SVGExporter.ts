import CanvasToSvg from 'canvas-to-svg'
import { _num2hex, GraphicsRenderer, VectorType } from './GraphicsRenderer'
import { 
    componentTypes, 
    Component, 
    Point,
    Line,
    Circle,
    Rectangle,
    Measure,
    Label,
    Arc,
    Polygon,
    BoundBox
} from './ComponentHandler';

export interface SVGExporterSettings {
    padding: number,
    monochrome: boolean,
    signature: string,
    font: string,
    advanced?: {
        defaultArrowLength?: number,
        arrowOffset?: number,
        baseArrowPadding?: number,
        maxLength?: number
    }
}

export class SVGExporter {
    context: CanvasToSvg
    renderer: GraphicsRenderer;
    settings: SVGExporterSettings

    constructor(renderer: GraphicsRenderer, settings?: SVGExporterSettings) {
        this.context = new CanvasToSvg(1920, 1080);
        this.renderer = renderer;
        this.settings = settings || {
            padding: 60,
            monochrome: true,
            signature: '',
            font: 'monospace',
            advanced: {
                defaultArrowLength: 25,
                arrowOffset: 25,
                baseArrowPadding: 20,
                maxLength: 24
            }
        }
    }
    _calculateOrigin(components: Component[]): VectorType {
        let minX: number = Infinity, minY: number = Infinity;
        components.forEach((component) => {
            if (!component.active) return;
            switch (component.type) {
                case componentTypes.point:
                    const point = component as Point;
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    break;
                case componentTypes.line:
                    const line = component as Line;
                    minX = Math.min(minX, line.x1, line.x2);
                    minY = Math.min(minY, line.y1, line.y2);
                    break;
                case componentTypes.circle:
                    const circle = component as Circle;
                    minX = Math.min(minX, circle.x1, circle.x2);
                    minY = Math.min(minY, circle.y1, circle.y2);
                    break;
                case componentTypes.rectangle:
                    const rect = component as Rectangle;
                    minX = Math.min(minX, rect.x1, rect.x2);
                    minY = Math.min(minY, rect.y1, rect.y2);
                    break;
                case componentTypes.measure:
                    const measure = component as Measure;
                    minX = Math.min(minX, measure.x1, measure.x2);
                    minY = Math.min(minY, measure.y1, measure.y2);
                    break;
                case componentTypes.label:
                    const label = component as Label;
                    minX = Math.min(minX, label.x);
                    minY = Math.min(minY, label.y);
                    break;
                case componentTypes.arc:
                    const arc = component as Arc;
                    minX = Math.min(minX, arc.x1, arc.x2, arc.x3);
                    minY = Math.min(minY, arc.y1, arc.y2, arc.y3);
                    break;
                case componentTypes.polygon:
                    const poly = component as Polygon;
                    poly.vectors.forEach(vector => {
                        minX = Math.min(minX, vector.x);
                        minY = Math.min(minY, vector.y);
                    });
                    break;
                case componentTypes.boundBox:
                    const boundbox = component as BoundBox;
                    minX = Math.min(minX, boundbox.x1, boundbox.x2);
                    minY = Math.min(minY, boundbox.y1, boundbox.y2);
                    break;
            }
        })
        if (minX === Infinity || minY === Infinity) {
            return {x: 0, y: 0};
        }
        console.log('[export] minimal vectorx: ' + minX + ',vectory: ' + minY);
        return {x: minX, y: minY};
    }
    _calculateDimensions(components: Component[]) : {width: number, height: number, origin: VectorType} {
        let minX: number = Infinity, minY: number = Infinity;
        let maxX: number = -Infinity, maxY: number = -Infinity;
        components.forEach((component) => {
            if (!component.active) return;
            switch (component.type) {
                case componentTypes.point:
                case componentTypes.label:
                    const point = component as Point
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                    break;
                case componentTypes.line:
                case componentTypes.rectangle:
                case componentTypes.measure:
                case componentTypes.boundBox:
                    const line = component as Line;
                    minX = Math.min(minX, line.x1, line.x2);
                    minY = Math.min(minY, line.y1, line.y2);
                    maxX = Math.max(maxX, line.x1, line.x2);
                    maxY = Math.max(maxY, line.y1, line.y2);
                    break;
                case componentTypes.circle:
                    const circle = component as Circle;
                    minX = Math.min(minX, circle.x1 - component.radius);
                    minY = Math.min(minY, circle.y1 - component.radius);
                    maxX = Math.max(maxX, circle.x1 + component.radius);
                    maxY = Math.max(maxY, circle.y1 + component.radius);
                    break;
                case componentTypes.arc:
                    const arc = component as Arc;
                    minX = Math.min(minX, arc.x1, arc.x2, arc.x3);
                    minY = Math.min(minY, arc.y1, arc.y2, arc.y3);
                    maxX = Math.max(maxX, arc.x1, arc.x2, arc.x3);
                    maxY = Math.max(maxY, arc.y1, arc.y2, arc.y3);
                    break;
                case componentTypes.polygon:
                    const poly = component as Polygon;
                    poly.vectors.forEach((vector) => {
                        minX = Math.min(minX, vector.x);
                        minY = Math.min(minY, vector.y);
                        maxX = Math.max(maxX, vector.x);
                        maxY = Math.max(maxX, vector.y)
                    });
                    break;
            }
        });
        let width: number = maxX - minX;
        let height: number = maxY - minY;
        return {width: width, height: height, origin: {x: minX, y: minY}};
    }
    _drawAllComponents(components: Component[], offset: VectorType) {
        const origin: VectorType = this._calculateOrigin(components);
        const dimensions = this._calculateDimensions(components);
        const { width, height } = dimensions;
        const padding: number = this.settings.padding || 60;
        const newWidth = width + 2 * padding;
        const newHeight = height + 2 * padding;
        this.context = new CanvasToSvg(newWidth, newHeight);
        const offsetThingie: VectorType = { x: -origin.x + padding, y: -origin.y + padding };
        components.forEach((component) => {
            if (!component.active) return;
            this._drawComponent(component, offsetThingie)
        })
    }
    _drawComponent(component: Component, offset: VectorType) {
        switch (component.type) {
            case componentTypes.point:
                const p = component as Point;
                this.drawPoint(
                    p.x + offset.x,
                    p.y + offset.y,
                    p.color,
                    p.radius,
                    p.opacity
                )
                break;
            case componentTypes.line:
                const line = component as Line;
                this.drawLine(
                    line.x1 + offset.x,
                    line.y1 + offset.y,
                    line.x2 + offset.x,
                    line.y2 + offset.y,
                    line.color,
                    line.radius,
                    line.opacity
                );
                break;
            case componentTypes.circle:
                const circle = component as Circle;
                this.drawCircle(
                    circle.x1 + offset.x,
                    circle.y1 + offset.y,
                    circle.x2 + offset.x,
                    circle.y2 + offset.y,
                    circle.color,
                    circle.radius,
                    circle.opacity
                );
                break;
            case componentTypes.rectangle:
                const rect = component as Rectangle;
                this.drawRectangle(
                    rect.x1 + offset.x,
                    rect.y1 + offset.y,
                    rect.x2 + offset.x,
                    rect.y2 + offset.y,
                    rect.color,
                    rect.radius,
                    rect.opacity
                );
                break;
            case componentTypes.measure:
                const measure = component as Measure;
                this.drawMeasure(
                    measure.x1 + offset.x,
                    measure.y1 + offset.y,
                    measure.x2 + offset.x,
                    measure.y2 + offset.y,
                    measure.color,
                    measure.radius,
                    measure.opacity
                );
                break;
            case componentTypes.label:
                const label = component as Label;
                this.drawLabel(
                    label.x + offset.x,
                    label.y + offset.y,
                    label.text,
                    label.color,
                    label.radius,
                    label.fontSize,
                    label.opacity
                )
                break;
            case componentTypes.arc:
                const arc = component as Arc;
                this.drawArc(
                    arc.x1 + offset.x,
                    arc.y1 + offset.y,
                    arc.x2 + offset.x,
                    arc.y2 + offset.y,
                    arc.x3 + offset.x,
                    arc.y3 + offset.y,
                    arc.color,
                    arc.radius,
                    arc.opacity
                );
                break;
            case componentTypes.polygon:
                const poly = component as Polygon;
                this.drawPolygon(
                    poly.vectors,
                    offset,
                    poly.color,
                    poly.strokeColor,
                    poly.radius,
                    poly.opacity,
                    poly.enableStroke
                )
                break;
            default:
                break;
        }
    }
    drawPoint(x: number, y: number, color: string, radius: number, opacity: number) {
        this.context.lineWidth = radius;
        this.context.strokeStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.beginPath();
        this.context.arc(
            x, 
            y,
            2, 0, Math.PI * 2, false
        );
        this.context.closePath();
        this.context.stroke();
    }
    drawLine(x1: number, y1: number, x2: number, y2: number, color: string, radius: number, opacity: number) {
        this.context.lineWidth = radius;
        this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.strokeStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.lineCap = 'round';
        this.context.beginPath();
        this.context.moveTo(
            x1,
            y1
        );
        this.context.lineTo(
            x2,
            y2
        );
        this.context.stroke();
    }
    drawCircle(x1: number, y1: number, x2: number, y2: number, color: string, radius: number, opacity: number) {
        this.context.lineWidth = radius;
        this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.strokeStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.beginPath();
        this.context.arc(
            x1,
            y1,
            this.renderer.getDistance(x1, y1, x2, y2),
            0, Math.PI * 2, false
        );
        this.context.closePath();
        this.context.stroke();
    }
    drawRectangle(x1: number, y1: number, x2: number, y2: number, color: string, radius: number, opacity: number) {
        this.drawLine(x1, y1, x2, y1, color, radius, opacity);
        this.drawLine(x2, y1, x2, y2, color, radius, opacity);
        this.drawLine(x2, y2, x1, y2, color, radius, opacity);
        this.drawLine(x1, y2, x1, y1, color, radius, opacity);
    }
    drawMeasure(x1: number, y1: number, x2: number, y2: number, color: string, radius: number, opacity: number) {
        let distance: number = this.renderer.getDistance(x1, y1, x2, y2) * this.renderer.unitFactor * this.renderer.unitConversionFactor;
        let angle: number = Math.atan2(y2 - y1, x2 - x1);
        const distanceText = distance.toFixed(2) + this.renderer.unitMeasure;
        this.context.save();
        this.context.font = `${this.renderer.fontSize}px ${this.settings.font || 'monospace'}`;
        const textWidth = this.context.measureText(distanceText).width;
        this.context.restore();
        let defaultArrowLength = this.settings.advanced?.defaultArrowLength || 25;
        let arrowOffset = this.settings.advanced?.arrowOffset || 5;
        let arrowLength = defaultArrowLength;
        const minDistanceForFullArrow = defaultArrowLength * 2 / 100;
        if (distance < minDistanceForFullArrow) {
            arrowLength = (distance / minDistanceForFullArrow) * defaultArrowLength;
        }
        const isShortDistance = distance < minDistanceForFullArrow * 2;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const textOffsetY = isShortDistance ? (750/100) : 0;
        if (!isShortDistance) {
            const basePadding: number = this.settings.advanced?.baseArrowPadding || 20;
            const adaptivePadding: number = basePadding;
            const labelGap: number = (textWidth + adaptivePadding);
            const halfGapX: number = (labelGap / 2) * Math.cos(angle);
            const halfGapY: number = (labelGap / 2) * Math.sin(angle);
            this.drawLine(x1, y1, midX - halfGapX, midY - halfGapY, color, radius, opacity);
            this.drawLine(midX + halfGapX, midY + halfGapY, x2, y2, color, radius, opacity);
            const drawArrowhead = (x: number, y: number, angle: number, length: number, offset: number) => {
                const arrowX = x + length * Math.cos(angle);
                const arrowY = y + length * Math.sin(angle);
                const offsetX = offset * Math.cos(angle + Math.PI / 2);
                const offsetY = offset * Math.sin(angle + Math.PI / 2);
                this.drawLine(x, y, arrowX + offsetX, arrowY + offsetY, color, radius, opacity);
                this.drawLine(x, y, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
                this.drawLine(arrowX + offsetX, arrowY + offsetY, arrowX - offsetX, arrowY - offsetY, color, radius, opacity);
            }
            drawArrowhead(x1, y1, angle, arrowLength, arrowOffset);
            drawArrowhead(x2, y2, angle + Math.PI, arrowLength, arrowOffset);
            this.context.save();
            this.context.translate(midX, midY + (textOffsetY + 2));
            this.context.rotate(angle);
            this.context.textAlign = 'center';
            this.context.textBaseline = isShortDistance ? 'top': 'middle';
            this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
            this.context.font = `${this.renderer.fontSize}px ${this.settings.font}`
        }
    }
    drawLabel(x: number, y: number, text: string, color: string, radius: number, fontSize: number, opacity: number) {
        this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.font = `${fontSize}px ${this.settings.font}`;
        let maxLength: number = this.settings.advanced?.maxLength || 24;
        let tempLength: number = 0;
        let tempText: string = "";
        let textArray: string[] = text.split(" ");
        textArray.forEach((text) => {
            tempLength += text.length + 1;
            tempText += " " + text;
            if (tempLength > maxLength) {
                this.context.fillText(
                    tempText,
                    (x - 5),
                    y
                );
                y += 25;
                tempLength = 0;
                tempText = "";
            }
        });
        this.context.fillText(
            tempText,
            (x - 5),
            y
        )
    }
    drawArc(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string, radius: number, opacity: number) {
        let firstAngle: number = this.renderer.getAngle(x1, y1, x2, y2);
        let secondAngle: number = this.renderer.getAngle(x1, y1, x3, y3);
        this.context.lineWidth = radius;
        this.context.fillStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.strokeStyle = this.settings.monochrome ? '#000000' + _num2hex(opacity) : color + _num2hex(opacity);
        this.context.beginPath();
        this.context.arc(
            x1,
            y1,
            this.renderer.getDistance(x1, y1, x2, y2),
            firstAngle, secondAngle, false
        );
        this.context.stroke();
    }
    drawPolygon(vectors: VectorType[], offset: VectorType, color: string, strokeColor: string, radius: number, opacity: number, enableStroke: boolean) {
        if (vectors.length < 2) return;
        this.context.lineWidth = radius;
        this.context.globalAlpha = opacity;
        this.context.fillStyle = this.settings.monochrome ? '#ffffff' : color;
        this.context.strokeStyle = this.settings.monochrome ? '#000000' : strokeColor;
        this.context.beginPath();
        console.log(vectors)
        this.context.moveTo(
            vectors[0].x + offset.x,
            vectors[0].y + offset.y
        );
        vectors.forEach((vector) => {
            this.context.lineTo(
                vector.x + offset.x,
                vector.y + offset.y
            )
        });
        this.context.closePath();
        this.context.fill();
        if (enableStroke) this.context.stroke();
    }
    returnSVG() {
        this._drawAllComponents(this.renderer.logicDisplay!.components, {x:15,y:5});
        return `<!-- ${this.settings.signature || ''} -->` + this.context.getSerializedSvg(true);
    }
}

// A little shorthand for returning SVG
export const exportSVG = (renderer: GraphicsRenderer, settings?: SVGExporterSettings) => {
    const exporter = new SVGExporter(renderer, settings);
    return exporter.returnSVG();
}