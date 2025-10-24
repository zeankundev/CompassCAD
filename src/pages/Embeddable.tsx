import { useParams } from "react-router-dom";
import styles from '../styles/embed.module.css'
import { useEffect, useRef } from "react";
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
import { LZString } from "../components/LZString";
import CompassCADLogo from '../assets/general/logo.svg'

const Embeddable = () => {
    const { id } = useParams<{id: string}>();
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer>(null);
    useEffect(() => {
        renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth, window.innerHeight);
        InitializeInstance(renderer.current);
        if (id != null) {
            const decompressed = LZString.decompressFromEncodedURIComponent(id);
            console.log(decompressed)
            const data = JSON.parse(decompressed || '[]');
            if (Array.isArray(data)) {
                renderer.current.logicDisplay?.importJSON(data, renderer.current.logicDisplay.components)
            }
        }
    }, [id])
    return (
        <div className={styles['embed-container']}>
            <div className={styles['embed-watermark']}>
                <span>made with</span>
                <img src={CompassCADLogo} alt="CompassCAD Logo" width={128} />
            </div>
            <canvas
                ref={canvas}
                width={window.innerWidth}
                height={window.innerHeight}
            />
        </div>
    )
}
export default Embeddable;