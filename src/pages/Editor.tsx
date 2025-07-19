// Imports: ignore why the imports will be too big :)
import React, { useRef, useEffect, useState, Fragment } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance } from "../engine/GraphicsRenderer";
import { getDeviceType, DeviceType } from "../components/GetDevice";
import { Component } from "../engine/ComponentHandler";
import RendererTypes from '../components/RendererTypes'
import HeaderButton from "../components/HeaderButtons";
import Back from '../assets/back.svg'
import MenuImg from '../assets/menu.svg'
import ToolbarButton from "../components/ToolbarButtons";
import Select from '../assets/navigate.svg'
import Navigate from '../assets/pan.svg'
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
import ExportSymbol from '../assets/export.svg'
import CopyLink from '../assets/copylink.svg'
import CollapseRight from '../assets/collapse-right.svg'
import Unselected from '../assets/unselected-state.svg'
import { useParams } from "react-router-dom";
import { LZString } from "../components/LZString";
import { toast, ToastContainer } from "../components/Toast";

export interface HistoryEntry {
    name: string;
    date: string;
    type: string;
    preview: string;
    data: string;
}

enum InspectorTabState {
    Inspector,
    Hierarchy
}

const Editor = () => {
    const { id } = useParams<{id: string}>();
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    const virtualCanvas = useRef<HTMLCanvasElement>(null);
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [tool, setTool] = useState<number>(RendererTypes.NavigationTypes.Navigate);
    const [designName, setDesignName] = useState<string>('New Design');
    const [menu, setMenu] = useState<boolean>(false);
    const nameInput = useRef<HTMLInputElement>(null);
    const [tooltip, setTooltip] = useState('');
    const [component, setComponent] = useState<Component | null>(null);
    const [exportDialog, setExportDialog] = useState(false);
    const [zoom, setZoom] = useState<number>(1);
    const [isLoading, setLoading] = useState<boolean>(true);
    const [showInspector, setShowInspector] = useState<boolean>(true);
    const [inspectorState, setInspectorState] = useState<InspectorTabState>(InspectorTabState.Inspector);
    useEffect(() => {
        if (canvas.current && !renderer.current) {
            setDevice(getDeviceType());
            document.body.style.overflowY = 'hidden';
            renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth, window.innerHeight);
            InitializeInstance(renderer.current);
            renderer.current.setMode(renderer.current.modes.Navigate);
            setLoading(false);
            toast('Hey there! Just a heads up that this editor is still in beta, so expect broken buttons and non-functioning UI')
        }
    }, [])
    useEffect(() => {
        let animationFrameId: number;
        
        const updateZoom = () => {
            if (renderer.current) {
                setZoom(renderer.current.zoom);
            }
            animationFrameId = requestAnimationFrame(updateZoom);
        };
        
        animationFrameId = requestAnimationFrame(updateZoom);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);
    useEffect(() => {
        let animationFrameId: number;

        const checkComponent = () => {
            if (renderer.current?.logicDisplay && renderer.current.selectedComponent !== null) {
                const currentComponent = renderer.current.logicDisplay.components[renderer.current.selectedComponent];
                setComponent(currentComponent || null);
                animationFrameId = requestAnimationFrame(checkComponent);
            } else {
                setComponent(null);
            }
        };

        checkComponent();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [renderer.current?.selectedComponent]);
    enum DesignType {
        CCAD = 'ccad',
        QROCAD = 'qrocad',
        UNKNOWN = 'unknown'
    }
    const takeSnapshot = async (data: Component[], name: string, type: DesignType): Promise<void> => {
        if (!id) return;
        
        console.log(`[editor] snapshot taken with metadata name: ${name}, type ${type}`)
        console.log(`[editor] components data:`, data); // Debug log
        
        // Create a fresh canvas each time
        const canvas = document.createElement('canvas');
        canvas.width = 960;
        canvas.height = 480;
        
        const virtualRenderer = new GraphicsRenderer(canvas, 960, 480);
        virtualRenderer.start();
        virtualRenderer.logicDisplay!.components = data;
        
        // Render multiple times to ensure everything is drawn
        for (let i = 0; i < 10; i++) {
            virtualRenderer.update();
        }
        
        const thumbnail = canvas.toDataURL('image/png');
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
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    window.onunload = async () => {
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
                        let decompressed = LZString.decompressFromEncodedURIComponent(data);
                        console.log('[editor] data:', decompressed);
                        let parsedData: any;
                        if (decompressed && decompressed !== '[]') {
                            console.debug('[editor] Decompressed data:', decompressed);
                            try {
                                parsedData = JSON.parse(decompressed);
                                console.debug('[editor] Initial parsed data:', parsedData);
                                if (Array.isArray(parsedData) && parsedData.length === 0) {
                                    const errorMsg = '[editor] Error: Parsed data is an empty array. Forcing re-parse using trimmed data.';
                                    console.error(errorMsg);
                                    // Force re-parse by trimming the decompressed string and trying again
                                    parsedData = JSON.parse(decompressed.trim());
                                    console.debug('[editor] Parsed data after re-parse:', parsedData);
                                    if (Array.isArray(parsedData) && parsedData.length === 0)
                                        throw new Error('[editor] Error: Re-parsed data is still an empty array.');
                                }
                            } catch (error) {
                                console.error('[editor] Failed to parse decompressed data:', error);
                                throw error;
                            }
                        } else {
                            parsedData = [];
                        }
                        // Insert the components brutally without any mercy
                        renderer.current!.logicDisplay!.components = parsedData;
                        console.log(renderer.current!.logicDisplay!.components);
                        if (renderer.current!.logicDisplay!.components.length === 0) {
                            console.error('[editor] No components found in the design, initializing with an empty array');
                        }

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
                    console.log('[editor] data:', LZString.decompressFromEncodedURIComponent(data));
                    renderer.current.logicDisplay?.importJSON(
                        JSON.parse(
                        LZString.decompressFromEncodedURIComponent(data) || '[]'
                        ),
                        renderer.current!.logicDisplay!.components
                    );
                    console.log(renderer.current!.logicDisplay!.components);
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
    useEffect(() => {
        if (renderer.current) {
            setTool(renderer.current.mode);
        }
    }, [tool, renderer.current?.mode]);
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
        {device === 'desktop' && (
            <div><ToastContainer /></div>
        )}
        {device === 'mobile' && (
            <Fragment>
                {menu === true && (
                    <div className={styles['mobile-menu']}>
                        <div className={styles['mobile-menu-button']} onClick={() => renderer.current?.undo()}>
                            <img src={UndoSymbol}></img>
                            &nbsp;
                            <p>Undo</p>
                        </div>
                        <div className={`${styles['mobile-menu-button']} ${styles.nomargin}`} onClick={() => renderer.current?.redo()}>
                            <img src={RedoSymbol}></img>
                            &nbsp;
                            <p>Redo</p>
                        </div>
                    </div>
                )}
            </Fragment>
        )}
        <div className={`${styles.header} ${device === 'mobile' ? styles.mobile : ''}`}>
            {device == 'mobile' && (
                <Fragment>
                    <HeaderButton 
                        svgImage={Back}
                        title='Go back home'
                        func={() => window.location.href = '/editor'}
                        tabIndex={0}
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
                        func={() => setMenu(menu ? false : true)}
                        tabIndex={2}
                    />
                </Fragment>
            )}
            {device == 'desktop' && (
                <div className={styles['desktop-header']}>
                    <div className={styles['header-left']}>
                        <HeaderButton 
                            svgImage={Back}
                            title='Go back home'
                            func={() => window.location.href = '/editor'}
                            tabIndex={0}
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
                            tabIndex={2}
                        />
                        <HeaderButton 
                            svgImage={RedoSymbol}
                            title='Redo'
                            func={() => renderer.current?.redo()}
                            tabIndex={3}
                        />
                        &nbsp;
                        <p>{zoom.toFixed(3)}x</p>
                    </div>
                    <div className={styles['header-right']}>
                        <div className={styles['share-button']} onClick={() => {setExportDialog(exportDialog ? false : true); console.log(exportDialog)}} tabIndex={4}>
                            <img src={ExportSymbol} width={20} />
                            &nbsp;
                            <p>Share/Export</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {exportDialog && (
            <div className={styles['export-dialog']}>
                <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
                    <h4>Share/Export Design</h4>
                    <p onClick={() => setExportDialog(false)}>&times;</p>
                </div>
                <div>
                    <div className={`${styles['export-option']} ${styles.special}`} onClick={() => {
                        if (renderer.current && renderer.current.logicDisplay) {
                            const url = `/designname="Imported%20Design";${LZString.compressToEncodedURIComponent(JSON.stringify(renderer.current.logicDisplay.components))}`
                            navigator.clipboard.writeText(window.location.href.replace('/action=new;', url));
                        }
                        toast('Copied link to clipboard');
                    }}>
                        <img src={CopyLink} />
                        &nbsp;&nbsp;
                        <p>Copy Link</p>
                    </div>
                </div>
            </div>
        )}
        {/* Toolbar */}
        {device == 'desktop' && (
            <React.Fragment>
                <div className={styles.toolbar}>
                    <ToolbarButton
                        svgImage={Select}
                        title="Select (q)"
                        isActive={tool == RendererTypes.NavigationTypes.Select}
                        keyCode={RendererTypes.KeyCodes.Q}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Select)}
                    />
                    <ToolbarButton
                        svgImage={Navigate}
                        title="Navigate (w)"
                        isActive={tool == RendererTypes.NavigationTypes.Navigate}
                        keyCode={RendererTypes.KeyCodes.W}
                        alternativeKeyCode={RendererTypes.KeyCodes.ESC}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Navigate)}
                    />
                    <ToolbarButton
                        svgImage={MoveSymbol}
                        title="Move (e)"
                        isActive={tool == RendererTypes.NavigationTypes.Move}
                        keyCode={RendererTypes.KeyCodes.E}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Move)}
                    />
                    <ToolbarButton
                        svgImage={DeleteSymbol}
                        title="Delete (t)"
                        isActive={tool == RendererTypes.NavigationTypes.Delete}
                        keyCode={RendererTypes.KeyCodes.T}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Delete)}
                    />
                    <ToolbarButton
                        svgImage={PointSymbol}
                        title="Add Point (a)"
                        isActive={tool == RendererTypes.NavigationTypes.AddPoint}
                        keyCode={RendererTypes.KeyCodes.A}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPoint)}
                    />
                    <ToolbarButton
                        svgImage={LineSymbol}
                        title="Add Line (s)"
                        isActive={tool == RendererTypes.NavigationTypes.AddLine}
                        keyCode={RendererTypes.KeyCodes.S}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLine)}
                    />
                    <ToolbarButton
                        svgImage={CircleSymbol}
                        title="Add Circle (d)"
                        keyCode={RendererTypes.KeyCodes.D}
                        isActive={tool == RendererTypes.NavigationTypes.AddCircle}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddCircle)}
                    />
                    <ToolbarButton
                        svgImage={ArcSymbol}
                        title="Add Arc (f)"
                        isActive={tool == RendererTypes.NavigationTypes.AddArc}
                        keyCode={RendererTypes.KeyCodes.F}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddArc)}
                    />
                    <ToolbarButton
                        svgImage={RectSymbol}
                        title="Add Rectangle (g)"
                        isActive={tool == RendererTypes.NavigationTypes.AddRectangle}
                        keyCode={RendererTypes.KeyCodes.G}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddRectangle)}
                    />
                    <ToolbarButton
                        svgImage={PicSymbol}
                        title="Add Image (l)"
                        isActive={tool == RendererTypes.NavigationTypes.AddPicture}
                        keyCode={RendererTypes.KeyCodes.L}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPicture)}
                    />
                    <ToolbarButton 
                        svgImage={PicSymbol}
                        title="Add Polygon (j)"
                        isActive={tool == RendererTypes.NavigationTypes.AddPolygon}
                        keyCode={RendererTypes.KeyCodes.J}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPolygon)}
                    />
                    <ToolbarButton
                        svgImage={LabelSymbol}
                        title="Add Text (h)"
                        isActive={tool == RendererTypes.NavigationTypes.AddLabel}
                        keyCode={RendererTypes.KeyCodes.H}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLabel)}
                    />
                    <ToolbarButton
                        svgImage={RulerSymbol}
                        title="Measure (z)"
                        isActive={tool == RendererTypes.NavigationTypes.AddMeasure}
                        keyCode={RendererTypes.KeyCodes.Z}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddMeasure)}
                    />
                </div>
                <div className={`${styles.inspector} ${showInspector ? '' : styles.hidden}`}>
                    <div className={styles['inspector-header']}>
                        {showInspector == false && (
                            <button 
                                title="Expand" 
                                onClick={() => setShowInspector(true)}
                            >
                                <img width={20} src={CollapseRight} style={{transform: 'rotate(180deg)'}} />
                            </button>
                        )}
                        <h2>Inspector</h2>
                        <button 
                            title="Collapse to Right" 
                            onClick={() => setShowInspector(false)}
                        >
                            <img width={20} src={CollapseRight} />
                        </button>
                    </div>
                    <div className={styles['inspector-content']}>
                        {inspectorState == InspectorTabState.Inspector && (
                            renderer.current?.selectedComponent == null && (
                                <div className={styles['inspector-nothing']}>
                                    <img src={Unselected} width={64} />
                                    <span>Select a component then your component details should appear here.</span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </React.Fragment>
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