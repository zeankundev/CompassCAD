import style from '../styles/editor.module.css'

interface HeaderButton {
    svgImage: string;
    title: string;
    keyCode?: number;
    alternativeKeyCode?: number;
    mobile?: boolean;
    isActive?: boolean;
    func?: () => void;
}
const ToolbarButton = (props: HeaderButton) => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if ((e.which === props.keyCode || e.which === props.alternativeKeyCode) && props.func) {
            if (
                document.activeElement?.tagName == 'INPUT' ||
                document.activeElement?.tagName == 'TEXTAREA'
            ) {
                console.log('[toolbar button] ignoring because textarea or input is focused');
                return;
            } else {
                props.func();
            }
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
                alt='Toolbar button'
            />
        </div>
    )
}
export default ToolbarButton;