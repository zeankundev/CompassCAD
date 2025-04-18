import { useRef, useEffect, useState, Fragment } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
import { getDeviceType, DeviceType } from "../components/GetDevice";
import HeaderButton from "../components/HeaderButtons";
import Back from '../assets/back.svg'
import MenuImg from '../assets/menu.svg'
const Editor = () => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    const [device, setDevice] = useState<DeviceType>('desktop');
    useEffect(() => {
      if (canvas.current && !renderer.current) {
        setDevice(getDeviceType());
        renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
        InitializeInstance(renderer.current);
        renderer.current.setMode(renderer.current.modes.Navigate);
      }
    }, [canvas.current, renderer.current]);
    window.addEventListener('resize', () => {
        renderer.current!.displayWidth = window.innerWidth * window.devicePixelRatio;
        renderer.current!.displayHeight = window.innerHeight * window.devicePixelRatio;
        canvas.current!.width = window.innerWidth;
        canvas.current!.height = window.innerHeight;
        setDevice(getDeviceType());
    })
    return (
      <div className={styles.editor}>
        <div className={`${styles.header} ${device === 'mobile' ? styles.mobile : ''}`}>
            {device == 'mobile' && (
                <Fragment>
                    <HeaderButton 
                        svgImage={Back}
                        title='Go back home'
                    />
                    <div
                        className={styles['design-name']}
                        contentEditable={true}
                    >
                        New Design
                    </div>
                    <HeaderButton 
                        svgImage={MenuImg}
                        title='Menu'
                    />
                </Fragment>
            )}
            {device == 'desktop' && (
                <Fragment>
                    <HeaderButton 
                        svgImage={Back}
                        title='Go back home'
                    />
                    <div
                        className={styles['design-name']}
                        contentEditable={true}
                    >
                        New Design
                    </div>
                </Fragment>
            )}
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