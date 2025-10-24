import style from '../styles/editor.module.css'

interface HeaderButton {
    svgImage: string;
    title: string;
    tabIndex?: number;
    func?: () => void;
}
const HeaderButton = (props: HeaderButton) => {
    return (
        <div 
            className={style['header-button']}
            onClick={props.func}
            title={props.title}
            tabIndex={props.tabIndex}
        >
            <img 
                src={props.svgImage} 
                width={24}
                height={24}
                alt='Header buttons'
            />
        </div>
    )
}
export default HeaderButton;