// Imports: ignore why the imports will be too big :)
import { useRef, useEffect, useState, Fragment } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
import { getDeviceType, DeviceType } from "../components/GetDevice";
import { Component } from "../engine/ComponentHandler";
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

export interface HistoryEntry {
    name: string;
    date: string;
    type: string;
    preview: string;
    data: string;
}

const Editor = () => {
    const { id } = useParams<{id: string}>();
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    const virtualCanvas = useRef<HTMLCanvasElement>(null);
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [designName, setDesignName] = useState<string>('New Design');
    const nameInput = useRef<HTMLInputElement>(null);
    const [tooltip, setTooltip] = useState('');
    const [isLoading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        if (canvas.current && !renderer.current) {
            setDevice(getDeviceType());
            document.body.style.overflowY = 'hidden';
            renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth, window.innerHeight);
            InitializeInstance(renderer.current);
            renderer.current.setMode(renderer.current.modes.Navigate);
            setLoading(false);
        }
    }, [])
    enum DesignType {
        CCAD = 'ccad',
        QROCAD = 'qrocad',
        UNKNOWN = 'unknown'
    }
    const takeSnapshot = async (data: Component[], name: string, type: DesignType): Promise<void> => {
        if (!id) return;
        if (!virtualCanvas.current) {
            console.log(`[editor] snapshot taken with metadata name: ${name}, type ${type}`)
            virtualCanvas.current = document.createElement('canvas');
            virtualCanvas!.current.width = 960;
            virtualCanvas!.current.height = 480;
            const virtualRenderer = new GraphicsRenderer(virtualCanvas.current, 960, 480);
            virtualRenderer.start();
            virtualRenderer.update();
            virtualRenderer.logicDisplay?.importJSON(data, virtualRenderer.logicDisplay!.components);
            virtualRenderer.update();
            const thumbnail = virtualCanvas.current?.toDataURL('image/png');
            const entry: HistoryEntry = {
                name: name.replace(/\.[^/.]+$/, ''),
                date: new Date().toLocaleDateString('en-US',{ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                type: type,
                preview: thumbnail,
                data: LZString.compressToEncodedURIComponent(JSON.stringify(data))
            }
            let history: HistoryEntry[] = JSON.parse(localStorage.getItem('history') || '[]');
            history.unshift(entry);
            if (history.length > 20) history.pop();
            localStorage.setItem('history', JSON.stringify(history));
            // Return promise that resolves when everything is done
            return Promise.resolve();
        }
    }
    window.onunload = async (e) => {
        e.preventDefault();
        await takeSnapshot(
            renderer.current!.logicDisplay!.components,
            designName,
            DesignType.CCAD
        );
        return undefined;
    }
    const hasRun = useRef(false);
    useEffect(() => {
        if (!renderer.current || !id) return;

        if (id.length > 0) {
            console.log('[editor] ID is not null and len is > 0');
            let params: string[] = [];
            let data = id;

            if (id.includes(';')) {
                const parts = id.split(';');
                params = parts[0].split(',');
                data = parts.slice(1).join(';');
            }

            // Handle parameters
            if (params.length > 0) {
                console.log('[editor] params len is > 0')
                params.forEach(param => {
                    if (param.startsWith('designname=')) {
                        const name = param.substring(11).replace(/^"|"$/g, '');
                        setDesignName(name);
                        nameInput.current!.value = name;
                        console.log('[editor] design name:', name);
                        console.log('[editor] opening up URI-encoded design');
                        renderer.current!.logicDisplay?.importJSON(
                            JSON.parse(
                            LZString.decompressFromEncodedURIComponent(data) || '[]'
                            ),
                            renderer.current!.logicDisplay.components
                        );
                        setLoading(false);
                    }
                    if (param.startsWith('action=')) {
                        const actions = param.substring(7).split(',');
                        if (actions.includes('debug')) {
                            console.log('[editor] Debug mode enabled');
                        }
                        if (actions.includes('new')) {
                            console.log('[editor] New design requested');
                            renderer.current?.start();
                            renderer.current!.logicDisplay?.importJSON([], renderer.current!.logicDisplay.components);
                            setLoading(false);
                            return; // Skip data import for new designs
                        }
                    }
                });
            } else {
                try {
                    console.log('[editor] opening up URI-encoded design');
                    renderer.current.logicDisplay?.importJSON(
                        JSON.parse(
                        LZString.decompressFromEncodedURIComponent(data) || '[]'
                        ),
                        renderer.current.logicDisplay.components
                    );
                    setLoading(false);
                } catch (e) {
                    console.error('[editor] failed to open: ', e);
                }
            }
        }
        else {
            console.log('[editor] ID len is 0, unsafe to proceed');
        }
    }, [id, designName]);
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
        {isLoading == true && (
            <div className={styles.loader}>
                <div className={styles.spinner}></div>
                <br></br>
                <h2>Loading CompassCAD...</h2>
                <p>Just wait, you'll be ready in a sec.</p>
            </div>
        )}
        <div className={`${styles.header} ${device === 'mobile' ? styles.mobile : ''}`}>
            {device == 'mobile' && (
                <Fragment>
                    <HeaderButton 
                        svgImage={Back}
                        title='Go back home'
                        func={() => window.location.href = '/editor'}
                    />
                    <input 
                        className={styles['design-name']} 
                        type='text'
                        style={{textAlign: 'center'}}
                        ref={nameInput}
                        defaultValue={designName}
                        onInput={(e) => {
                            setDesignName(e.currentTarget.value)
                        }}
                        placeholder='Design name'
                    />
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
                        ref={nameInput}
                        defaultValue={designName}
                        onInput={(e) => {
                            console.log('[editor] internal: oninput fired')
                            setDesignName(e.currentTarget.value)
                        }}
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