import { useRef, useEffect } from "react";
import { GraphicDisplay, IntializeInstance } from "./engine/GraphicDisplay";

function Editor() {
    const editor = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (editor.current) {
            console.log("Canvas element:", editor?.current);
            const gd = new GraphicDisplay(editor?.current, 800, 600);
            IntializeInstance(gd);
        }
    }, []);
    console.log(editor.current?.getContext("2d"))

    return (
        <div className="react-editor">
            <canvas ref={editor} width={800} height={600}></canvas>
        </div>
    );
}

export default Editor;