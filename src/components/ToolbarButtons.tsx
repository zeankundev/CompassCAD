import style from '../styles/editor.module.css'

interface HeaderButton {
    svgImage: string;
    title: string;
    keyCode?: number;
    func?: () => void;
}
const ToolbarButton = (props: HeaderButton) => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.which === props.keyCode && props.func) {
            props.func();
        }
    })
    return (
        <div 
            className={style['toolbar-button']}
            onClick={props.func}
            title={props.title}
        >
            <img 
                src={props.svgImage} 
                width={18}
                height={18}
            />
        </div>
    )
}
export default ToolbarButton;