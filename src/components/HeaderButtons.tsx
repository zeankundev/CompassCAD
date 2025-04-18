import style from '../styles/buttons.module.css'

interface HeaderButton {
    svgImage: string;
    title: string;
    func?: () => void;
}
const HeaderButton = (props: HeaderButton) => {
    return (
        <div 
            className={style['header-button']}
            onClick={props.func}
            title={props.title}
        >
            <img 
                src={props.svgImage} 
                width={24}
                height={24}
            />
        </div>
    )
}
export default HeaderButton;