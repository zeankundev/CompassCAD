// Imports: ignore why the imports will be too big :)
import React, { useRef, useEffect, useState, Fragment } from "react";
import styles from '../styles/editor.module.css'
import { GraphicsRenderer, InitializeInstance, VectorType } from "../engine/GraphicsRenderer";
import { getDeviceType, DeviceType } from "../components/GetDevice";
import {
    Component,
    Point,
    Line,
    Circle,
    Rectangle,
    Measure,
    Label,
    Arc,
    Shape,
    Picture,
    Polygon,
    componentTypes,
    BoundBox
} from "../engine/ComponentHandler";
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
import PolySymbol from '../assets/polygon.svg'
import BoundboxSymbol from '../assets/boundbox.svg'
import LabelSymbol from '../assets/text.svg'
import RulerSymbol from '../assets/measure.svg'
import UndoSymbol from '../assets/undo.svg'
import RedoSymbol from '../assets/redo.svg'
import ExportSymbol from '../assets/export.svg'
import CopyLink from '../assets/copylink.svg'
import CollapseRight from '../assets/collapse-right.svg'
import Unselected from '../assets/unselected-state.svg'
import Export from '../assets/export.svg'
import Preview from '../assets/preview.svg'
import Embed from '../assets/embed.svg'
import ExportToCCADIcon from '../assets/ccadfile.svg'
import FeedbackIcon from '../assets/feedback.svg'
import DraggableHandler from '../assets/draggablehandle.svg'
// Just for recoding and not to make the code a whole fucking mess
import RecordIcon from '../assets/record-icon.svg'
import RecordAlt from '../assets/recording/recalt.svg'
import StopRec from '../assets/recording/stoprec.svg'
import MicOn from '../assets/recording/micon.svg'
import MicOff from '../assets/recording/micoff.svg'
import RecStartSound from '../assets/audio/recstart.mp3'
import RecEndSound from '../assets/audio/recend.mp3'
// --------
import { useParams } from "react-router-dom";
import { LZString } from "../components/LZString";
import { toast, ToastContainer } from "../components/Toast";
import { getLocaleKey } from "../components/LanguageHandler";
import { exportSVG, SVGExporterSettings } from "../engine/SVGExporter";

export interface HistoryEntry {
    name: string;
    date: string;
    type: string;
    preview: string;
    data: string;
}

type Filetypes = 'ccad' | 'qcad';

type AnyComponent = Point | Line | Circle | Rectangle | Measure | Label | Arc | Shape | Picture | Polygon;

enum InspectorTabState {
    Inspector,
    Hierarchy
}

interface AlternateTipProps {
    value: string;
    x: number;
    y: number;
}

type ExportPages = 'main' | 'svg' | 'embed';

interface TabButtonProps {
    state: InspectorTabState,
    ref: InspectorTabState,
    children?: React.ReactNode,
    onClick?: () => void
}

const TabButtons = (props: TabButtonProps) => {
    return (
        <>
            <button className={`${styles['tab-button']}${props.ref === props.state ? ' ' + styles['active']: ''}`} onClick={props.onClick}>
                {props.children}
            </button>
        </>
    )
}

const Editor = () => {
    const componentImages: string[] = [
        '',
        PointSymbol,
        LineSymbol,
        CircleSymbol,
        RectSymbol,
        ArcSymbol,
        RulerSymbol,
        LabelSymbol,
        PicSymbol,
        PicSymbol,
        PolySymbol,
        BoundboxSymbol
    ]
    const { id } = useParams<{id: string}>();
    const ignoredKeys = ['type', 'y1', 'y2', 'x2', 'y3'];
    const canvas = useRef<HTMLCanvasElement>(null);
    const renderer = useRef<GraphicsRenderer | null>(null);
    const virtualCanvas = useRef<HTMLCanvasElement>(null);
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [componentArray, setComponentArray] = useState<Component[]>([]);
    const [tool, setTool] = useState<number>(RendererTypes.NavigationTypes.Select);
    const [designName, setDesignName] = useState<string>(getLocaleKey('editor.main.newDesign'));
    const [menu, setMenu] = useState<boolean>(false);
    const nameInput = useRef<HTMLInputElement>(null);
    const [tooltip, setTooltip] = useState('');
    const [hierarchySearch, setHierarchySearch] = useState<string>('');
    const [searchedComponentArray, setSearchedComponentArray] = useState<Component[]>([]);
    const [alternateTip, setAltTip] = useState<AlternateTipProps | null>();
    const [showAlternateTip, setShowAlternateTip] = useState<boolean>(false);
    const [showRecorderPopup, setShowRecorderPopup] = useState<boolean>(false);
    const [isDraggableDown, setIsDraggableDown] = useState<boolean>(false);
    const [recorderPopupLocation, setRecorderPopUpLocation] = useState<VectorType>({x: 240, y: 120})
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [useMic, setUseMic] = useState<boolean>(false);
    const [recordingTime, setRecordingTime] = useState<number>(0);
    const [component, setComponent] = useState<AnyComponent | null>(null);
    const [exportDialog, setExportDialog] = useState(false);
    const [exportPage, setExportPage] = useState<ExportPages>('main');
    const [previewImage, setPreviewImage] = useState<string>('');
    const [svgExportState, setSvgExportState] = useState<SVGExporterSettings>({
        padding: 60,
        monochrome: true,
        signature: 'Generated using CompassCAD Web (react branch)',
        font: 'monospace',
        advanced: {
            defaultArrowLength: 25,
            arrowOffset: 25,
            baseArrowPadding: 20,
            maxLength: 24
        }
    });
    const [zoom, setZoom] = useState<number>(1);
    const [isLoading, setLoading] = useState<boolean>(true);
    const [showInspector, setShowInspector] = useState<boolean>(true);
    const [inspectorState, setInspectorState] = useState<InspectorTabState>(InspectorTabState.Inspector);
    const [debugMode, setDebugMode] = useState<boolean>(false);
    const [fromBlueprint, setFromBlueprint] = useState<boolean>(false);
    const dragRef = useRef({
        initialMouseX: 0,
        initialMouseY: 0,
        initialPopupX: 0,
        initialPopupY: 0,
    });
    const intervalRef = useRef<NodeJS.Timer | null>(null);
    const mediaRec = useRef<MediaRecorder | null>(null);
    const chunkRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const num2hour = (seconds: number): string => {
        const minute = Math.floor(seconds / 60);
        const sec = seconds % 60;
        const formattedSeconds = sec < 10 ? '0' + sec : sec;
        return `${minute}:${formattedSeconds}`
    }
    const toggleRecordingState = async () => {
        let interval;
        if (!isRecording) {
            try {
                const canv = canvas.current;
                if (!canv) return;
                const canvasStream = canv.captureStream();
                const micStream = useMic ? await navigator.mediaDevices.getUserMedia({ audio: true }) : null;
                const combined = new MediaStream();
                combined.addTrack(canvasStream.getVideoTracks()[0]);
                if (useMic && micStream) 
                    combined.addTrack(micStream?.getAudioTracks()[0]);
                streamRef.current = combined;
                chunkRef.current = [];
                const recorder = new MediaRecorder(combined, { mimeType: 'video/mp4' });
                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunkRef.current.push(e.data)
                    }
                };
                recorder.onstop = () => {
                    const blob = new Blob(chunkRef.current, { type: 'video/mp4' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${designName.replace(' ', '-')}-${new Date().getHours()}-${new Date().getMinutes()}-${new Date().getSeconds()}.mp4`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
                mediaRec.current = recorder;
                renderer.current!.recordingMode = true;
                recorder.start();
                setRecordingTime(0);
                intervalRef.current = setInterval(() => {
                    setRecordingTime(recordingTime => recordingTime + 1);
                }, 1000)
                setIsRecording(true);
                new Audio(RecStartSound).play().catch(e => {});
            } catch (e) {
                console.error(e);
            } 
        } else {
            if (mediaRec.current) {
                mediaRec.current.stop();
                mediaRec.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            renderer.current!.recordingMode = false;
            clearInterval(intervalRef.current!);
            setIsRecording(false);
            new Audio(RecEndSound).play().catch(e => {});
        }
    }
    useEffect(() => {
        if (canvas.current && !renderer.current) {
            setDevice(getDeviceType());
            document.body.style.overflowY = 'hidden';
            renderer.current = new GraphicsRenderer(canvas.current, window.innerWidth, window.innerHeight);
            InitializeInstance(renderer.current);
            renderer.current.setMode(renderer.current.modes.Select);
            setLoading(false);
            toast(getLocaleKey('editor.main.betaWarning'));
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
        // This effect runs when the selected component changes in the renderer.
        const handleSelectionChange = () => {
            if (renderer.current && renderer.current.selectedComponent !== null) {
                const selected = renderer.current.logicDisplay!.components[renderer.current.selectedComponent];
                // Assert `selected` as AnyComponent to satisfy the useState type.
                // TypeScript can't always perfectly infer derived types from a generic array.
                setComponent(selected as AnyComponent);
            } else {
                setComponent(null);
            }
        };

        if (renderer.current) {
            renderer.current.onComponentChangeCallback = handleSelectionChange;
            handleSelectionChange();
        }

        // Cleanup function for the effect
        return () => {
            if (renderer.current) {
                renderer.current.onComponentChangeCallback = null; // Clean up the listener
            }
        };
    }, [renderer.current?.selectedComponent]);
    useEffect(() => {
        if (renderer.current) {
            renderer.current.onComponentArrayChanged = () => {setComponentArray(renderer.current!.logicDisplay!.components); console.log('[editor] useEffect -> renderer.current -> changed array', componentArray);}
        }
    })
    enum DesignType {
        CCAD = 'ccad',
        QROCAD = 'qrocad',
        UNKNOWN = 'unknown'
    }
    const getHandledKeys = (component: AnyComponent): Set<string> => {
        const handled = new Set<string>([
            // Base properties, always explicitly rendered
            'active', 'type', 'color', 'radius', 'opacity'
        ]);

        // Add properties handled by specific instanceof blocks
        if (component instanceof Point || component instanceof Label || component instanceof Picture || component instanceof Shape) {
            // These are handled by the common "Position" block for Point-like objects
            handled.add('x');
            handled.add('y');
        }
        if (component instanceof Line || component instanceof Circle || component instanceof Rectangle || component instanceof Measure || component instanceof Arc) {
            // These are handled by the "Dimensions" block for Line-like objects
            handled.add('x1');
            handled.add('y1');
            handled.add('x2');
            handled.add('y2');
        }
        if (component instanceof Arc) {
            // These are specific to Arc's "Arc Coverage" block
            handled.add('x3');
            handled.add('y3');
        }
        if (component instanceof Label) {
            handled.add('text');
            handled.add('fontSize');
        }
        if (component instanceof Picture) {
            handled.add('pictureSource');
        }
        if (component instanceof Polygon) {
            // Polygon's specific properties
            handled.add('color'); // Handled explicitly as "Fill Color"
            handled.add('strokeColor');
            handled.add('enableStroke');
            handled.add('vectors'); // Vectors array is displayed but not edited generically
        }
        if (component instanceof Shape) {
            handled.add('components'); // Components array is displayed but not edited generically
        }

        // Add any other properties you specifically render and don't want in the generic loop
        // For example, if you dynamically calculate 'width' or 'height' from x1/x2/y1/y2
        // and display them, you might want to exclude x1, y1, x2, y2 from the general loop.

        return handled;
    };
    const handleChange = (key: string, value: string | boolean | number): void => {
        setComponent((prevComponent) => {
            if (!prevComponent) return null;
            const updatedComponent = Object.create(Object.getPrototypeOf(prevComponent));
            Object.assign(updatedComponent, prevComponent);
            (updatedComponent as Record<string, any>)[key] = value;
            const finalComponent = updatedComponent as AnyComponent;
            if (renderer.current && renderer.current.logicDisplay && renderer.current.selectedComponent !== null) {
                renderer.current.logicDisplay.components[renderer.current.selectedComponent] = finalComponent;
                renderer.current.saveState();
                console.log(`[editor] setting key as ${key} with value ${value}`)
                setComponentArray(renderer.current.logicDisplay.components);
            }
            return finalComponent;
        });
    };
    const handlePositionChange = (posKey: 'x' | 'y' | 'x1' | 'y1' | 'x2' | 'y2' | 'x3' | 'y3', value: string): void => {
        setComponent((prevComponent) => {
            if (!prevComponent) return null;
            const updatedComponent = Object.create(Object.getPrototypeOf(prevComponent));
            Object.assign(updatedComponent, prevComponent);
            (updatedComponent as Record<string, any>)[posKey] = parseFloat(value);
            const finalComponent = updatedComponent as AnyComponent;

            if (renderer.current && renderer.current.logicDisplay && renderer.current.selectedComponent !== null) {
                renderer.current.logicDisplay.components[renderer.current.selectedComponent] = finalComponent;
                renderer.current.saveState();
            }
            return finalComponent;
        });
    };
    // handleSizeChange needs adjustment to correctly update x2/y2 based on width/height changes
    const handleSizeChange = (type: 'width' | 'height', value: string): void => {
        setComponent((prevComponent) => {
            if (!prevComponent) return null;
            const updatedComponent = Object.create(Object.getPrototypeOf(prevComponent));
            Object.assign(updatedComponent, prevComponent); // Shallow copy all properties

            const parsedValue = parseFloat(value);

            // This logic is crucial: it modifies x2 or y2 based on width/height
            // This ensures the underlying component properties are correctly updated.
            if ('x1' in updatedComponent && 'y1' in updatedComponent &&
                typeof updatedComponent.x1 === 'number' && typeof updatedComponent.y1 === 'number' &&
                typeof (updatedComponent as any).x2 === 'number' && typeof (updatedComponent as any).y2 === 'number'
            ) {
                if (type === 'width') {
                    (updatedComponent as any).x2 = updatedComponent.x1 + parsedValue;
                } else if (type === 'height') {
                    (updatedComponent as any).y2 = updatedComponent.y1 + parsedValue;
                }
            }

            const finalComponent = updatedComponent as AnyComponent;

            if (renderer.current && renderer.current.logicDisplay && renderer.current.selectedComponent !== null) {
                renderer.current.logicDisplay.components[renderer.current.selectedComponent] = finalComponent;
                renderer.current.saveState();
            }
            return finalComponent;
        });
    };
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
    const previewSVG = () => {
        const svgContext = exportSVG(renderer.current!, svgExportState);
        const b64 = btoa(svgContext);
        if (previewImage.includes(b64)) {
            toast('Chill down, no worries! It\'s still the same as before!')
        } else {
            setPreviewImage(`data:image/svg+xml;base64,${b64}`);
        }
    }
    const saveSVG = () => {
        const svgContext = exportSVG(renderer.current!, svgExportState);
        const blob = new Blob([svgContext], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${designName}.svg`
        a.click();
        URL.revokeObjectURL(url);
    }
    const saveCCAD = (type?: Filetypes) => {
        const content = JSON.stringify(renderer.current!.logicDisplay?.components);
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        switch (type) {
            case 'ccad':
                a.download = `${designName}.ccad`
                break;
            case 'qcad':
                a.download = `${designName}.qrocad`
                break;
            default:
                a.download = `${designName}.ccad`
                break;
        }
        a.click();
        URL.revokeObjectURL(url);
    }
    window.onunload = async () => {
        await takeSnapshot(
            renderer.current!.logicDisplay!.components,
            designName,
            DesignType.CCAD
        );
        return undefined;
    }
    const logOnDebug = (origin: string, message: string) => {
        if (debugMode) {
            console.log(`[DEBUG, origin: ${origin}] ${message}`);
        }
    }
    const lerpToComponentOrigin = (index: number) => {
        setInspectorState(InspectorTabState.Hierarchy);
        const component: Component = renderer.current!.logicDisplay!.components[index];
        let destination: VectorType = {x: 0, y: 0};
        switch (component.type) {
            case componentTypes.point:
            case componentTypes.picture:
            case componentTypes.shape:
            case componentTypes.label:
                const dummyPoint = component as Point;
                destination.x = -dummyPoint.x;
                destination.y = -dummyPoint.y;
                break;
            case componentTypes.rectangle:
            case componentTypes.line:
            case componentTypes.measure:
                const dummyRect = component as Line;
                destination.x = -((dummyRect.x1 + dummyRect.x2) / 2);
                destination.y = -((dummyRect.y1 + dummyRect.y2) / 2);
                break;
            case componentTypes.circle:
            case componentTypes.arc:
                const dummyCircle = component as Circle;
                destination.x = -dummyCircle.x1;
                destination.y = -dummyCircle.y1;
                break;
            case componentTypes.polygon:
                const dummyPolygon = component as Polygon;
                destination.x = -dummyPolygon.vectors[0].x;
                destination.y = -dummyPolygon.vectors[0].y;
                break;
            default:
                break;
        }
        const initialCameraPosition: VectorType = {x: renderer.current!.camX, y: renderer.current!.camY};
        let startTime: number = 0;
        const duration: number = 500;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = 1 - Math.pow(1 - Math.min(elapsed / duration, 1), 2);
            const initialZoom = renderer.current!.targetZoom;
            renderer.current!.camX = initialCameraPosition.x + (destination.x - initialCameraPosition.x) * progress;
            renderer.current!.camY = initialCameraPosition.y + (destination.y - initialCameraPosition.y) * progress;
            renderer.current!.targetZoom = initialZoom + (1 - initialZoom) * progress;
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        requestAnimationFrame(animate);
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
                logOnDebug('editor', `parsed params: ${params}`);
            }

            // Handle parameters
            if (params.length > 0) {
                console.log('[editor] params len is > 0')
                params.forEach(param => {
                    if (param.startsWith('frombp=')) {
                        const frombp = param.substring(7).toLowerCase();
                        if (frombp === 'true') {
                            setFromBlueprint(true);
                            console.log('[editor] frombp is true, setting fromBlueprint to true');
                        } else {
                            setFromBlueprint(false);
                            console.log('[editor] frombp is false, setting fromBlueprint to false');
                        }
                    }
                    if (param.startsWith('action=')) {
                        const actions = param.substring(7).split(',');
                        if (actions.includes('debug')) {
                            console.log('[editor] Debug mode enabled');
                            setDebugMode(true);
                        }
                        if (actions.includes('new')) {
                            console.log('[editor] New design requested');
                            renderer.current?.start();
                            renderer.current!.logicDisplay?.importJSON([], renderer.current!.logicDisplay.components);
                            setLoading(false);
                            return; // Skip data import for new designs
                        }
                    }
                    if (param.startsWith('debugflags=')) {
                        const flags = param.substring(11).split(':');
                        if (flags.includes('recmode')) {
                            renderer.current!.recordingMode = true;
                        }
                        if (flags.includes('fuckingshit')) {
                            console.error('fucking shit')
                        }
                    }
                    if (param.startsWith('designname=') && !hasRun.current) {
                        hasRun.current = true;
                        logOnDebug('editor', `designname param found: ${param}`);
                        const name = param.substring(11).replace(/^"|"$/g, '');
                        setDesignName(name);
                        nameInput.current!.value = name;
                        console.log('[editor] design name:', name);
                        console.log('[editor] opening up URI-encoded design');
                        
                        // First try to decompress if it's compressed
                        let decompressed = LZString.decompressFromEncodedURIComponent(data);
                        logOnDebug('editor', `decompressed data (attempt): ${decompressed}`);
                        
                        // If decompression returns null, try using the raw data
                        if (!decompressed) {
                            logOnDebug('editor', 'Decompression returned null, trying direct parse');
                            try {
                                // Try parsing the raw data directly
                                logOnDebug('editor', 'Attempting direct parse of data');
                                const directParse = JSON.parse(decodeURIComponent(data));
                                if (Array.isArray(directParse)) {
                                    logOnDebug('editor', 'Direct parse successful, using parsed data');
                                    decompressed = JSON.stringify(directParse);
                                }
                            } catch (e) {
                                logOnDebug('editor', `Direct parse failed: ${e}`);
                                const decoded = decodeURIComponent(data);
                                decompressed = LZString.decompressFromEncodedURIComponent(decoded);
                                logOnDebug('editor', `Decompressed from decoded data: ${decompressed}`);
                            }
                        }

                        console.log('[editor] data:', decompressed);
                        let parsedData: any = [];

                        if (decompressed) {
                            console.log('[editor] Decompressed data is valid, parsing JSON');
                            try {
                                console.log('[editor] Parsing decompressed data');
                                if (typeof decompressed === 'string') {
                                    console.log('[editor] Decompressed data is a string, parsing it');
                                    parsedData = JSON.parse(decompressed);
                                    console.log('[editor] typeof parsedData: ', typeof parsedData);
                                    if (typeof parsedData === 'string') {
                                        parsedData = JSON.parse(parsedData);
                                        console.debug('[editor] Parsed data is a string, re-parsed to JSON', parsedData);
                                    }
                                } else {
                                    parsedData = decompressed;
                                }
                                
                                if (!Array.isArray(parsedData)) {
                                    console.error('[editor] Parsed data is not an array, converting to array');
                                    parsedData = [parsedData];
                                }
                                
                                console.debug('[editor] Final parsed data:', parsedData);
                                console.warn('[editor] using method A');
                                if (renderer.current) {
                                    console.log('[editor] reassuring data:', parsedData);
                                    // Ensure parsedData is an array
                                    const finalData = Array.isArray(parsedData) ? parsedData : [];
                                    console.log(`[editor] performing final checks, isarray: ${Array.isArray(finalData)}, finalData: `, finalData);
                                    console.log('[editor] fromBlueprint state:', fromBlueprint);
                                    if (id.includes('frombp=true') || fromBlueprint) {
                                        console.log('[editor] fromBlueprint is true, performing direct assignment');
                                        renderer.current.logicDisplay!.components = Array.isArray(parsedData) ? parsedData : [parsedData];
                                    } else {
                                        console.log('[editor] fromBlueprint is false, using importJSON');
                                        console.log(renderer.current.logicDisplay!.components);
                                        renderer.current.logicDisplay?.importJSON(finalData, renderer.current.logicDisplay.components);
                                        setComponentArray(renderer.current!.logicDisplay!.components)
                                    }
                                    console.log(renderer.current.logicDisplay!.components);
                                    if (renderer.current.logicDisplay!.components.length === 0) {
                                        console.error('[editor] No components found in the design, initializing with an empty array');
                                    }
                                }
                            } catch (error) {
                                console.error('[editor] Failed to parse decompressed data:', error);
                                console.warn('[editor] Attempting to continue with empty array');
                            }
                        }
                        setLoading(false);
                    }
                });
            } else {
                try {
                    console.warn('[editor] using method B');
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
    }, [id, renderer.current]);
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
                <h2>{getLocaleKey('editor.main.loading.heading')}</h2>
                <p>{getLocaleKey('editor.main.loading.subHeading')}</p>
            </div>
        )}
        {device === 'desktop' && (
            <>
                <div><ToastContainer /></div>
                {showAlternateTip && alternateTip && (
                    <div className={styles['alternate-tooltip']} style={{left: alternateTip.x, top: alternateTip.y}}>
                        {alternateTip.value}
                    </div>
                )} 
            </>
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
                        title={getLocaleKey('editor.main.header.goBackHome')}
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
                            title={getLocaleKey('editor.main.header.goBackHome')}
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
                            title={getLocaleKey('editor.main.header.undo')}
                            func={() => renderer.current?.undo()}
                            tabIndex={2}
                        />
                        <HeaderButton 
                            svgImage={RedoSymbol}
                            title={getLocaleKey('editor.main.header.redo')}
                            func={() => renderer.current?.redo()}
                            tabIndex={3}
                        />
                        &nbsp;
                        <p>{zoom.toFixed(3)}x</p>
                        &nbsp;&nbsp;
                        <HeaderButton 
                            svgImage={RecordIcon}
                            title={getLocaleKey('editor.main.header.record')}
                            func={() => setShowRecorderPopup(!showRecorderPopup)}
                            tabIndex={4}
                        />
                        <HeaderButton 
                            svgImage={FeedbackIcon}
                            title={getLocaleKey('editor.main.header.feedback')}
                            func={() => window.open('https://form.typeform.com/to/sbjWyFKu', '_blank')}
                            tabIndex={4}
                        />
                    </div>
                    <div className={styles['header-right']}>
                        <div className={styles['share-button']} onClick={() => {setExportDialog(exportDialog ? false : true); setExportPage('main')}} tabIndex={4}>
                            <img src={ExportSymbol} width={20} />
                            &nbsp;
                            <p>{getLocaleKey('editor.main.header.share')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
        {exportDialog && (
            <div className={styles['export-dialog']}>
                {exportPage == 'main' && (
                    <>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
                            <h4>{getLocaleKey('editor.main.header.shareModal.heading')}</h4>
                            <p onClick={() => setExportDialog(false)} className={styles['export-topactionbutton']}>&times;</p>
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
                                <p>{getLocaleKey('editor.main.header.shareModal.copyLink')}</p>
                            </div>
                            <div className={styles['export-options-parent-container']}>
                                <div className={styles['export-options-container']}>
                                    <div className={styles['export-option-sub']}>
                                        <div className={styles['export-option-sub-button']} onClick={() => setExportPage('svg')}>
                                            <img src={Export} width={24} />
                                        </div>
                                        <span>{getLocaleKey('editor.main.header.shareModal.exportAsSvg')}</span>
                                    </div>
                                </div>
                                <div className={styles['export-options-container']}>
                                    <div className={styles['export-option-sub']}>
                                        <div className={styles['export-option-sub-button']} onClick={() => saveCCAD('ccad')}>
                                            <img src={ExportToCCADIcon} width={24} />
                                        </div>
                                        <span>{getLocaleKey('editor.main.header.shareModal.exportAsCcad')}</span>
                                    </div>
                                </div>
                                <div className={styles['export-options-container']}>
                                    <div className={styles['export-option-sub']}>
                                        <div className={styles['export-option-sub-button']} onClick={() => setExportPage('embed')}>
                                            <img src={Embed} width={24} />
                                        </div>
                                        <span>{getLocaleKey('editor.main.header.shareModal.embedToSite')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {exportPage == 'svg' && (
                    <>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
                            <p onClick={() => setExportPage('main')} className={styles['export-topactionbutton']}>〈</p>
                            <h4>{getLocaleKey('editor.main.header.shareModal.exportAsSvg')}</h4>
                            <p onClick={() => setExportDialog(false)} className={styles['export-topactionbutton']}>&times;</p>
                        </div>
                        <br></br>
                        <h5>{getLocaleKey('editor.main.header.shareModal.preview')}</h5>
                        <div className={styles['export-image-preview']}>
                            {previewImage == '' ? (
                                <div className={styles['export-image-nothing-preview']}>
                                    <span>{getLocaleKey('editor.main.header.shareModal.nothingOnPreview')}</span>
                                </div>
                            ): (
                                <>
                                <img className={styles['image-preview-actual']} src={previewImage} width={768} />
                                </>
                            )}
                        </div>
                        <small className={styles['small-text']}>*{getLocaleKey('editor.main.header.shareModal.previewDifferent')}</small>
                        <br></br>
                        <h5>{getLocaleKey('editor.main.header.shareModal.settings')}</h5>
                        <div className={styles['settings-subfield']}>
                            <span>{getLocaleKey('editor.main.header.shareModal.padding')}</span>
                            <div className={styles['settings-input-field']}>
                                <input 
                                    type="number"
                                    defaultValue={svgExportState.padding}
                                    onChange={(e) => {
                                        setSvgExportState({...svgExportState ,padding: parseInt(e.target.value)});
                                    }} 
                                    style={{width: '20%'}}
                                />
                                <span>px</span>
                            </div>
                        </div>
                        <div className={styles['settings-subfield']}>
                            <span>{getLocaleKey('editor.main.header.shareModal.monochrome')}</span>
                            <div className={styles['settings-input-field']}>
                                <input 
                                    type="checkbox"
                                    defaultChecked={svgExportState.monochrome}
                                    onChange={(e) => {
                                        setSvgExportState({...svgExportState ,monochrome: e.target.checked});
                                    }} 
                                />
                            </div>
                        </div>
                        <div className={styles['settings-subfield']}>
                            <span>{getLocaleKey('editor.main.header.shareModal.font')}</span>
                            <div className={styles['settings-input-field']}>
                                <input 
                                    type="text"
                                    defaultValue={svgExportState.font}
                                    onChange={(e) => {
                                        setSvgExportState({...svgExportState ,font: e.target.value});
                                    }} 
                                    style={{width: '60%', fontFamily: svgExportState.font}}
                                />
                            </div>
                        </div>
                        <div className={styles['export-suboption-bottom']}>
                            <div
                                className={`${styles['export-option-subbutton']}`} 
                                onClick={previewSVG}
                            ><img src={Preview} />&nbsp;{getLocaleKey('editor.main.header.shareModal.preview')}</div>
                            <div
                                className={`${styles['export-option-subbutton']} ${styles.special}`} 
                                onClick={saveSVG}
                            ><img src={Export} />&nbsp;<b>{getLocaleKey('editor.main.header.shareModal.export')}</b></div>
                        </div>
                    </>
                )}
                {exportPage == 'embed' && (
                    <>
                        <div style={{display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
                            <p onClick={() => setExportPage('main')} className={styles['export-topactionbutton']}>〈</p>
                            <h4>{getLocaleKey('editor.main.header.shareModal.embedToSite')}</h4>
                            <p onClick={() => setExportDialog(false)} className={styles['export-topactionbutton']}>&times;</p>
                        </div>
                        <br></br>
                        <span>Copy this and paste it on your website code</span>
                        <textarea readOnly={true} className={styles['export-embed-copiable']}>
                            {`<iframe src="${window.location.origin}/embed/${id.substring(11).split(';')[1].trim()}"></iframe>`}
                        </textarea>
                        <br></br>
                        <h5>{getLocaleKey('editor.main.header.shareModal.preview')}</h5>
                        <iframe 
                            src={`${window.location.origin}/embed/${id.substring(11).split(';')[1].trim()}`}
                            width={246}
                            height={150}
                        />
                    </>
                )}
            </div>
        )}
        {showRecorderPopup && (
            <div className={styles['recorder-popup']} style={{left: recorderPopupLocation.x, top: recorderPopupLocation.y}}>
                <div 
                    className={styles['draggable-modal']}
                    style={{
                        cursor: isDraggableDown ? 'grabbing': 'grab'
                    }}
                    onMouseDown={(e) => {
                        setIsDraggableDown(true);
                        dragRef.current = {
                            initialMouseX: e.clientX,
                            initialMouseY: e.clientY,
                            initialPopupX: recorderPopupLocation.x,
                            initialPopupY: recorderPopupLocation.y
                        }
                    }}
                    onMouseUp={() => setIsDraggableDown(false)}
                    onMouseMove={(e) => {
                        if (isDraggableDown) {
                            const dX = e.clientX - dragRef.current.initialMouseX;
                            const dY = e.clientY - dragRef.current.initialMouseY;
                            setRecorderPopUpLocation({
                                x: dragRef.current.initialPopupX + dX,
                                y: dragRef.current.initialPopupY + dY
                            })
                        }
                    }}
                >
                    <img src={DraggableHandler} />
                </div>
                <div className={styles['recorder-content']}>
                    <div 
                        className={styles['draggable-childbutton']}
                        onClick={toggleRecordingState}
                        title={getLocaleKey(`editor.main.header.recordPopup.${isRecording ? 'stop' : 'start'}Recording`)}
                    >
                        <img src={isRecording ? StopRec : RecordAlt} />
                    </div>
                    <div 
                        className={styles['draggable-childbutton']}
                        onClick={() => setUseMic(!useMic)}
                        title={getLocaleKey(`editor.main.header.recordPopup.mic${useMic ? 'Off' : 'On'}`)}
                    >
                        <img src={useMic ? MicOn : MicOff} />
                    </div>
                    <span>{num2hour(recordingTime)}</span>
                    {isRecording && (
                        <div className={styles['recorder-status-blink']}></div>
                    )}
                </div>
            </div>
        )}
        {/* Toolbar */}
        {device == 'desktop' && (
            <>
                <div className={styles.toolbar}>
                    <ToolbarButton
                        svgImage={Select}
                        title={`${getLocaleKey('editor.main.essential.select')} (q)`}
                        isActive={tool == RendererTypes.NavigationTypes.Select}
                        keyCode={RendererTypes.KeyCodes.Q}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Select)}
                    />
                    <ToolbarButton
                        svgImage={Navigate}
                        title={`${getLocaleKey('editor.main.essential.navigate')} (w)`}
                        isActive={tool == RendererTypes.NavigationTypes.Navigate}
                        keyCode={RendererTypes.KeyCodes.W}
                        alternativeKeyCode={RendererTypes.KeyCodes.ESC}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Navigate)}
                    />
                    <ToolbarButton
                        svgImage={MoveSymbol}
                        title={`${getLocaleKey('editor.main.essential.move')} (e)`}
                        isActive={tool == RendererTypes.NavigationTypes.Move}
                        keyCode={RendererTypes.KeyCodes.E}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Move)}
                    />
                    <ToolbarButton
                        svgImage={DeleteSymbol}
                        title={`${getLocaleKey('editor.main.essential.delete')} (t)`}
                        isActive={tool == RendererTypes.NavigationTypes.Delete}
                        keyCode={RendererTypes.KeyCodes.T}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.Delete)}
                    />
                    <ToolbarButton
                        svgImage={PointSymbol}
                        title={`${getLocaleKey('editor.main.essential.addPoint')} (a)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddPoint}
                        keyCode={RendererTypes.KeyCodes.A}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPoint)}
                    />
                    <ToolbarButton
                        svgImage={LineSymbol}
                        title={`${getLocaleKey('editor.main.essential.addLine')} (s)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddLine}
                        keyCode={RendererTypes.KeyCodes.S}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLine)}
                    />
                    <ToolbarButton
                        svgImage={CircleSymbol}
                        title={`${getLocaleKey('editor.main.essential.addCircle')} (d)`}
                        keyCode={RendererTypes.KeyCodes.D}
                        isActive={tool == RendererTypes.NavigationTypes.AddCircle}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddCircle)}
                    />
                    <ToolbarButton
                        svgImage={ArcSymbol}
                        title={`${getLocaleKey('editor.main.essential.addArc')} (f)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddArc}
                        keyCode={RendererTypes.KeyCodes.F}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddArc)}
                    />
                    <ToolbarButton
                        svgImage={RectSymbol}
                        title={`${getLocaleKey('editor.main.essential.addRectangle')} (g)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddRectangle}
                        keyCode={RendererTypes.KeyCodes.G}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddRectangle)}
                    />
                    <ToolbarButton
                        svgImage={PicSymbol}
                        title={`${getLocaleKey('editor.main.essential.addImage')} (l)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddPicture}
                        keyCode={RendererTypes.KeyCodes.L}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPicture)}
                    />
                    <ToolbarButton 
                        svgImage={PolySymbol}
                        title={`${getLocaleKey('editor.main.essential.addPolygon')} (j)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddPolygon}
                        keyCode={RendererTypes.KeyCodes.J}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddPolygon)}
                    />
                    <ToolbarButton
                        svgImage={BoundboxSymbol}
                        title={`${getLocaleKey('editor.main.essential.addBoundbox')} (x)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddBoundbox}
                        keyCode={RendererTypes.KeyCodes.X}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddBoundbox)}
                    />
                    <ToolbarButton
                        svgImage={LabelSymbol}
                        title={`${getLocaleKey('editor.main.essential.addLabel')} (h)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddLabel}
                        keyCode={RendererTypes.KeyCodes.H}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddLabel)}
                    />
                    <ToolbarButton
                        svgImage={RulerSymbol}
                        title={`${getLocaleKey('editor.main.essential.addMeasure')} (z)`}
                        isActive={tool == RendererTypes.NavigationTypes.AddMeasure}
                        keyCode={RendererTypes.KeyCodes.Z}
                        func={() => renderer.current?.setMode(RendererTypes.NavigationTypes.AddMeasure)}
                    />
                </div>
                <div className={`${styles.inspector} ${showInspector ? '' : styles.hidden}`}>
                    <div className={styles['inspector-header']}>
                        {showInspector == false && (
                            <button 
                                title={getLocaleKey('editor.main.inspector.expand')} 
                                onClick={() => setShowInspector(true)}
                            >
                                <img width={20} src={CollapseRight} style={{transform: 'rotate(180deg)'}} />
                            </button>
                        )}
                        <h2>{getLocaleKey('editor.main.inspector.header')}</h2>
                        <button 
                            title={getLocaleKey('editor.main.inspector.collapseToRight')}
                            onClick={() => setShowInspector(false)}
                        >
                            <img width={20} src={CollapseRight} />
                        </button>
                    </div>
                    <div className={styles['inspector-content']}>
                        {inspectorState == InspectorTabState.Inspector && (
                            component == null ? (
                                <div className={styles['inspector-nothing']}>
                                    <img src={Unselected} width={64} />
                                    <span>{getLocaleKey('editor.main.inspector.nothing')}</span>
                                </div>
                            ) : (
                                <div className={styles['inspector-dynamic-form']}>
                                    {/* Base Properties (Active, Type, Radius, Opacity) - Keep as they are likely fine */}
                                    <div className={styles['input-container']}>
                                        <label>{getLocaleKey('editor.main.inspector.general.active')}</label>
                                        <input
                                            type="checkbox"
                                            checked={component.active}
                                            onChange={(e) => handleChange('active', e.target.checked)}
                                        />
                                    </div>
                                    {'radius' in component && (
                                        <div className={styles['input-container']}>
                                            <label>{getLocaleKey('editor.main.inspector.general.radius')}</label>
                                            <input
                                                type="number"
                                                value={component.radius}
                                                onChange={(e) => handleChange('radius', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    )}
                                    {'name' in component && (
                                        <div className={styles['input-container']}>
                                            <label>{getLocaleKey('editor.main.inspector.general.name')}</label>
                                            <input
                                                type="text"
                                                value={component.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {!(component instanceof Polygon) && (
                                        <div className={styles['input-container']}>
                                            <label>{getLocaleKey('editor.main.inspector.general.color')}</label>
                                            <input
                                                type="color"
                                                value={component.color}
                                                onChange={(e) => handleChange('color', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className={styles['input-container']}>
                                        <label>{getLocaleKey('editor.main.inspector.general.opacity')}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={component.opacity}
                                            onMouseDown={(e: React.MouseEvent<HTMLInputElement>) => {
                                                setShowAlternateTip(true);
                                                setAltTip({
                                                    value: `${component.opacity}%`,
                                                    x: e.clientX - 12.5,
                                                    y: e.currentTarget.getBoundingClientRect().top - 30
                                                })
                                            }}
                                            onMouseMove={(e: React.MouseEvent<HTMLInputElement>) => {
                                                if (showAlternateTip) {
                                                    setAltTip({
                                                        value: `${component.opacity}%`,
                                                        x: e.clientX - 12.5,
                                                        y: e.currentTarget.getBoundingClientRect().top - 30
                                                    });
                                                }
                                            }}
                                            onMouseUp={() => {
                                                setShowAlternateTip(false);
                                                setAltTip({ value: '', x: 0, y: 0 });
                                            }}
                                            onChange={
                                                (e) => {
                                                    handleChange('opacity', parseInt(e.target.value));
                                                }
                                            }
                                        />
                                    </div>

                                    {/* Consolidated Position & Size Inputs */}

                                    {/* Position: For Point, Label, Picture, Shape (just x, y) */}
                                    {(component instanceof Point || component instanceof Label || component instanceof Picture || component instanceof Shape) && (
                                        <div className={styles['input-group-row']}>
                                            <label>{getLocaleKey('editor.main.inspector.general.position')}</label>
                                            <input
                                                type="number"
                                                value={component.x ?? ''}
                                                onChange={(e) => handlePositionChange('x', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                value={component.y ?? ''}
                                                onChange={(e) => handlePositionChange('y', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Position & Size: For Line, Circle, Rectangle, Measure, Arc (x1, y1, width, height) */}
                                    {(component instanceof Line || component instanceof Circle || component instanceof Rectangle || component instanceof Measure || component instanceof BoundBox) && (
                                        <>
                                            <div className={styles['input-group-row']}>
                                                <label>{getLocaleKey('editor.main.inspector.general.position')}</label>
                                                <input
                                                    type="number"
                                                    value={component.x1 ?? ''}
                                                    onChange={(e) => handlePositionChange('x1', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    value={component.y1 ?? ''}
                                                    onChange={(e) => handlePositionChange('y1', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles['input-group-row']}>
                                                <label>{getLocaleKey('editor.main.inspector.general.size')}</label>
                                                <input
                                                    type="number"
                                                    value={(typeof component.x2 === 'number' && typeof component.x1 === 'number') ? (component.x2 - component.x1) : ''}
                                                    onChange={(e) => handleSizeChange('width', e.target.value)}
                                                    placeholder="Width"
                                                />
                                                <input
                                                    type="number"
                                                    value={(typeof component.y2 === 'number' && typeof component.y1 === 'number') ? (component.y2 - component.y1) : ''}
                                                    onChange={(e) => handleSizeChange('height', e.target.value)}
                                                    placeholder="Height"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Arc Coverage: Specific for Arc (x3, y3) */}
                                    {component instanceof Arc && (
                                        <div className={styles['input-group-row']}>
                                            <label>{getLocaleKey('editor.main.inspector.general.coverage')}</label>
                                            <input
                                                type="number"
                                                value={component.x3 ?? ''}
                                                onChange={(e) => handlePositionChange('x3', e.target.value)}
                                            />
                                            <input
                                                type="number"
                                                value={component.y3 ?? ''}
                                                onChange={(e) => handlePositionChange('y3', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Text Properties (Label) */}
                                    {component instanceof Label && (
                                        <>
                                            <h3>{getLocaleKey('editor.main.inspector.text.heading')}</h3> {/* Keep heading for logical grouping */}
                                            <div className={styles['input-container']}> {/* Can be input-group-row if you want font size next to text */}
                                                <label>{getLocaleKey('editor.main.inspector.text.text')}</label>
                                                <input
                                                    type="text"
                                                    value={component.text ?? ''}
                                                    onChange={(e) => handleChange('text', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles['input-container']}>
                                                <label>{getLocaleKey('editor.main.inspector.text.fontSize')}</label>
                                                <input
                                                    type="number"
                                                    value={component.fontSize ?? ''}
                                                    onChange={(e) => handleChange('fontSize', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Picture Properties (Picture) */}
                                    {component instanceof Picture && (
                                        <>
                                            <h3>{getLocaleKey('editor.main.inspector.picture.heading')}</h3>
                                            <div className={styles['input-container']}>
                                                <label>{getLocaleKey('editor.main.inspector.picture.src')}</label>
                                                <input
                                                    type="text"
                                                    value={component.pictureSource ?? ''}
                                                    onChange={(e) => handleChange('pictureSource', e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Polygon Properties (Polygon) */}
                                    {component instanceof Polygon && (
                                        <>
                                            <h3>{getLocaleKey('editor.main.inspector.polygon.heading')}</h3>
                                            <div className={styles['input-container']}>
                                                <label>{getLocaleKey('editor.main.inspector.polygon.fillColor')}</label>
                                                <input
                                                    type="color"
                                                    value={component.color ?? '#ffffff'}
                                                    onChange={(e) => handleChange('color', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles['input-container']}>
                                                <label>{getLocaleKey('editor.main.inspector.polygon.strokeColor')}</label>
                                                <input
                                                    type="color"
                                                    value={component.strokeColor ?? '#000000'}
                                                    onChange={(e) => handleChange('strokeColor', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles['input-container']}>
                                                <label>{getLocaleKey('editor.main.inspector.polygon.enableStroke')}</label>
                                                <input
                                                    type="checkbox"
                                                    checked={component.enableStroke ?? true}
                                                    onChange={(e) => handleChange('enableStroke', e.target.checked)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Shape Properties (Shape) */}
                                    {component instanceof Shape && (
                                        <>
                                            <h3>Shape Group</h3>
                                            <div className={styles['input-container']}>
                                                <label>Child Components</label>
                                                <span>{component.components.length}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        )}
                        {inspectorState == InspectorTabState.Hierarchy && (
                            <div className={styles['hierarchy-flexbox']}>
                                <div className={styles['searchfield-flexbox']}>
                                    <input type="text" defaultValue={hierarchySearch} className={styles['hierarchy-textinput']} onChange={(e) => setHierarchySearch(e.target.value)} placeholder={getLocaleKey('editor.main.inspector.searchInHiearchy')}/>
                                </div>
                                {componentArray.length > 0 ? (
                                    <div className={styles['component-hierarchy-container']}>
                                        {componentArray.filter(filteredComponentArray => filteredComponentArray.name.toLowerCase().includes(hierarchySearch.toLowerCase())).map((comp, index) => (
                                            <div 
                                                key={index} 
                                                onClick={() => {
                                                    renderer.current!.setMode(RendererTypes.NavigationTypes.Select);
                                                    renderer.current!.selectComponent(index);
                                                }} 
                                                onDoubleClick={() => lerpToComponentOrigin(index)} 
                                                className={`${styles['component-hierarchy-child']}${component === componentArray[index] ? ' ' + styles['fkinselected'] : ''}`}
                                            >
                                                <img src={componentImages[comp.type]} />&nbsp;{comp.name}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div>No components found.</div> // Or null, or whatever you want to show
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles['inspector-tabs']}>
                        <TabButtons 
                            state={InspectorTabState.Inspector} 
                            ref={inspectorState}
                            onClick={() => setInspectorState(InspectorTabState.Inspector)}
                        >
                            {getLocaleKey('editor.main.inspector.properties')}
                        </TabButtons>
                        <TabButtons 
                            state={InspectorTabState.Hierarchy} 
                            ref={inspectorState}
                            onClick={() => setInspectorState(InspectorTabState.Hierarchy)}
                        >
                            {getLocaleKey('editor.main.inspector.hierarchy')}
                        </TabButtons>
                    </div>
                </div>
            </>
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