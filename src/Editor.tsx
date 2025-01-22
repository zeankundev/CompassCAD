import { useRef, useEffect } from "react";
import { GraphicDisplay, IntializeInstance } from "./engine/GraphicDisplay";

function Editor() {
    const editor = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let gd: GraphicDisplay | undefined;
        
        if (editor.current) {
            console.log("Canvas element:", editor.current);
            gd = new GraphicDisplay(editor.current, 800, 600);
            IntializeInstance(gd);
        }

        return () => {
            if (gd) {
                // Add cleanup logic if needed
                gd = undefined;
            }
        };
    }, []);

    return (
        <div className="react-editor">
            <canvas ref={editor} width={800} height={600}></canvas>
        </div>
    );
}

export default Editor;