import { useRef, useEffect } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
const Editor = () => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    useEffect(() => {
      if (canvas.current && !renderer.current) {
        renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
        InitializeInstance(renderer.current);
        renderer.current.setMode(renderer.current.modes.Navigate);
      }
    }, []);
    return (
      <div className={styles.editor}>
        <div className={styles.header}>
            <p>1234567890</p>
        </div>
        <canvas
          width={window.innerWidth}
          height={window.innerHeight}
          ref={canvas}
        />
      </div>
    );
}
export default Editor;