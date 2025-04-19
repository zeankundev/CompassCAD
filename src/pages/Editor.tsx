// Imports: ignore why the imports will be too big :)
import { useRef, useEffect, useState, Fragment } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
import { getDeviceType, DeviceType } from "../components/GetDevice";
import RendererTypes from '../components/RendererTypes'
import HeaderButton from "../components/HeaderButtons";
import Back from '../assets/back.svg'
import MenuImg from '../assets/menu.svg'
import ToolbarButton from "../components/ToolbarButtons";
import Navigate from '../assets/navigate.svg'
import MoveSymbol from '../assets/move.svg'
import DeleteSymbol from '../assets/delete.svg'
import PointSymbol from '../assets/point.svg'
import LineSymbol from '../assets/line.svg'
import CircleSymbol from '../assets/circle.svg'
import ArcSymbol from '../assets/arc.svg'
import RectSymbol from '../assets/rectangle.svg'
import PicSymbol from '../assets/image.svg'
import LabelSymbol from '../assets/text.svg'
import RulerSymbol from '../assets/measure.svg'
import UndoSymbol from '../assets/undo.svg'
import RedoSymbol from '../assets/redo.svg'
import { useParams } from "react-router-dom";
import { LZString } from "../components/LZString";

const Editor = () => {
    const { id } = useParams<{id: string}>();
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [tooltip, setTooltip] = useState('');
    useEffect(() => {
      if (canvas.current && !renderer.current) {
        setDevice(getDeviceType());
        renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth, window.innerHeight);
        InitializeInstance(renderer.current);
        renderer.current.setMode(renderer.current.modes.Navigate);
      }
    }, [canvas.current, renderer.current]);
    useEffect(() => {
        if (!renderer.current || !id) return;

        if (id === "action=new" || id === undefined) {
            renderer.current.start();
            console.log('[editor] starting a new design');
            renderer.current.logicDisplay?.importJSON([], renderer.current.logicDisplay?.components);
        } else if (id.length > 0) {
            console.log('[editor] ID is not null and len is > 0');
            try {
                console.log('[editor] opening up URI-encoded design');
                renderer.current.logicDisplay?.importJSON(
                    JSON.parse(
                        LZString.decompressFromEncodedURIComponent(id) || '[]'
                    ),
                    renderer.current.logicDisplay.components
                );
            } catch (e) {
                console.error('[editor] failed to open: ', e);
            }
        }
    }, [id]);
    useEffect(() => {
        let animationFrameId: number;
        
        const updateTooltip = () => {
            if (renderer.current?.tooltip != null && renderer.current?.tooltip !== '') {
                setTooltip(renderer.current.getTooltip());
            }
            animationFrameId = requestAnimationFrame(updateTooltip);
        };
        
        animationFrameId = requestAnimationFrame(updateTooltip);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);
    window.addEventListener('resize', () => {
        renderer.current!.displayWidth = window.innerWidth;
        renderer.current!.displayHeight = window.innerHeight;
        canvas.current!.width = window.innerWidth;
        canvas.current!.height = window.innerHeight;
        console.log('[editor] resize is fired')
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
                        func={() => window.location.href = '/editor'}
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
                        func={() => window.location.href = '/editor'}
                    />
                    <input 
                        className={styles['design-name']} 
                        type='text'
                        defaultValue='New Design'
                        placeholder='Design name'
                    />
                    <HeaderButton 
                        svgImage={UndoSymbol}
                        title='Undo'
                        func={() => renderer.current?.undo()}
                    />
                    <HeaderButton 
                        svgImage={RedoSymbol}
                        title='Redo'
                        func={() => renderer.current?.redo()}
                    />
                </Fragment>
            )}
        </div>
        {/* Toolbar */}
        {device == 'desktop' && (
            <div className={styles.toolbar}>
                <ToolbarButton
                    svgImage={Navigate}
                    title="Navigate (q)"
                    keyCode={RendererTypes.KeyCodes.Q}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Navigate)}
                />
                <ToolbarButton
                    svgImage={MoveSymbol}
                    title="Move (e)"
                    keyCode={RendererTypes.KeyCodes.E}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Move)}
                />
                <ToolbarButton
                    svgImage={DeleteSymbol}
                    title="Delete (t)"
                    keyCode={RendererTypes.KeyCodes.T}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Delete)}
                />
                <ToolbarButton
                    svgImage={PointSymbol}
                    title="Add Point (a)"
                    keyCode={RendererTypes.KeyCodes.A}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPoint)}
                />
                <ToolbarButton
                    svgImage={LineSymbol}
                    title="Add Line (s)"
                    keyCode={RendererTypes.KeyCodes.S}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLine)}
                />
                <ToolbarButton
                    svgImage={CircleSymbol}
                    title="Add Circle (d)"
                    keyCode={RendererTypes.KeyCodes.D}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddCircle)}
                />
                <ToolbarButton
                    svgImage={ArcSymbol}
                    title="Add Arc (f)"
                    keyCode={RendererTypes.KeyCodes.F}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddArc)}
                />
                <ToolbarButton
                    svgImage={RectSymbol}
                    title="Add Rectangle (g)"
                    keyCode={RendererTypes.KeyCodes.G}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddRectangle)}
                />
                <ToolbarButton
                    svgImage={PicSymbol}
                    title="Add Image (l)"
                    keyCode={RendererTypes.KeyCodes.L}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPicture)}
                />
                <ToolbarButton
                    svgImage={LabelSymbol}
                    title="Add Text (h)"
                    keyCode={RendererTypes.KeyCodes.H}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLabel)}
                />
                <ToolbarButton
                    svgImage={RulerSymbol}
                    title="Measure (z)"
                    keyCode={RendererTypes.KeyCodes.Z}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddMeasure)}
                />
            </div>
        )}
        {device == 'mobile' && (
            <div className={styles['mobile-toolbar']}>
                <ToolbarButton
                    svgImage={Navigate}
                    mobile={true}
                    title="Navigate (q)"
                    keyCode={RendererTypes.KeyCodes.Q}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Navigate)}
                />
                <ToolbarButton
                    svgImage={MoveSymbol}
                    mobile={true}
                    title="Move (e)"
                    keyCode={RendererTypes.KeyCodes.E}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Move)}
                />
                <ToolbarButton
                    svgImage={DeleteSymbol}
                    mobile={true}
                    title="Delete (t)"
                    keyCode={RendererTypes.KeyCodes.T}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Delete)}
                />
                <ToolbarButton
                    svgImage={PointSymbol}
                    mobile={true}
                    title="Add Point (a)"
                    keyCode={RendererTypes.KeyCodes.A}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPoint)}
                />
                <ToolbarButton
                    svgImage={LineSymbol}
                    mobile={true}
                    title="Add Line (s)"
                    keyCode={RendererTypes.KeyCodes.S}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLine)}
                />
                <ToolbarButton
                    svgImage={CircleSymbol}
                    mobile={true}
                    title="Add Circle (d)"
                    keyCode={RendererTypes.KeyCodes.D}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddCircle)}
                />
                <ToolbarButton
                    svgImage={ArcSymbol}
                    mobile={true}
                    title="Add Arc (f)"
                    keyCode={RendererTypes.KeyCodes.F}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddArc)}
                />
                <ToolbarButton
                    svgImage={RectSymbol}
                    mobile={true}
                    title="Add Rectangle (g)"
                    keyCode={RendererTypes.KeyCodes.G}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddRectangle)}
                />
                <ToolbarButton
                    svgImage={PicSymbol}
                    mobile={true}
                    title="Add Image (l)"
                    keyCode={RendererTypes.KeyCodes.L}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPicture)}
                />
                <ToolbarButton
                    svgImage={LabelSymbol}
                    mobile={true}
                    title="Add Text (h)"
                    keyCode={RendererTypes.KeyCodes.H}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLabel)}
                />
                <ToolbarButton
                    svgImage={RulerSymbol}
                    mobile={true}
                    title="Measure (z)"
                    keyCode={RendererTypes.KeyCodes.Z}
                    func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddMeasure)}
                />
            </div>
        )}
        <canvas
          width={window.innerWidth}
          height={window.innerHeight}
          ref={canvas}
          onContextMenu={(e) => {e.preventDefault()}}
        />
      </div>
    );
}
export default Editor;