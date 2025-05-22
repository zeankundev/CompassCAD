import style from '../styles/editor.module.css'

interface HeaderButton {
    svgImage: string;
    title: string;
    keyCode?: number;
    mobile?: boolean;
    isActive?: boolean;
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
            className={`${style['toolbar-button']} ${props.mobile ? style.mobile : ''} ${props.isActive ? style.active : ''}`}
            onClick={props.func}
            title={props.title}
        >
            <img 
                src={props.svgImage} 
            />
        </div>
    )
}
export default ToolbarButton;