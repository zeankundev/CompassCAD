import ReusableHeader from '../components/ReusableHeader'
import styles from '../styles/home.module.css'
import Illustration1 from '../assets/general/architect-dream.svg'
import TryIt from '../assets/general/try.svg'
import InvertedExportButton from '../assets/export.svg'
import '../styles/theme.css'
import { getDeviceType } from '../components/GetDevice'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
interface HomeButtonInterface {
    important?: boolean,
    onInteract?: () => void,
    children: React.ReactNode
}
const isCrammed = () => {
    const minWidthForText = 1000; // adjust this value based on your needs
    return window.innerWidth < minWidthForText;
}
const HomeButton = (props: HomeButtonInterface) => {
    return (
        <button onClick={props.onInteract} className={`${styles['startpage-button']} ${props.important ? styles.important: ''}`}>
            {props.children}
        </button>
    )
}
const Home = () => {
    const [deviceType, setDeviceType] = useState(getDeviceType());
    const [crammed, setCrammed] = useState(isCrammed())
    useEffect(() => {
        const handleResize = () => {
            setDeviceType(getDeviceType());
            setCrammed(isCrammed());
            console.log(crammed)
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return (
        <div className={styles['home-container']}>
        <ReusableHeader />
        <div className={styles['app-content']}>
            <div className={`${styles['hero-biggiewrapper']} ${crammed ? styles.mobile : ''}`}>
                <div className={styles['hero-left']}>
                    <h1>
                    Build your dreams without wasting time to learn complex tools. It's time to simplify your "dream building" design
                    </h1>
                    <p>
                    Imagine if CAD went as simple as the power tools we use today like Notion or even Figma. Except that, we can redefine what "power tools" means for architecture design.
                    </p>
                    <br></br>
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <HomeButton important={true}>
                            <img src={InvertedExportButton} width={24} style={{transform: 'rotate(180deg)'}} />
                            &nbsp;
                            Download for platform
                        </HomeButton>
                        <Link to='/editor'>
                            <HomeButton>
                                <img src={TryIt} width={24}/>
                                &nbsp;
                                Try it out
                            </HomeButton>
                        </Link>
                    </div>
                </div>
                <div className={`${styles['hero-right']} ${crammed ? styles.crammed : ''}`}>
                    <img src={Illustration1} height={crammed ? 360 : 510}/>
                </div>
            </div>
            <div>
                <p aria-label='bullshit'>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at felis velit. Sed id laoreet neque. Suspendisse molestie luctus efficitur. Donec ac justo in tellus finibus condimentum sit amet vel sapien. Praesent dignissim est ac justo sagittis, ut condimentum felis fermentum. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; In aliquet eu mi vel mollis. Mauris in nulla vel felis finibus venenatis. Nulla mattis lectus risus, vitae tempus ante dapibus quis. Integer sed porttitor eros. Maecenas euismod, risus quis ultricies accumsan, magna eros laoreet mauris, sed tincidunt eros sem sit amet elit. Integer arcu metus, eleifend at interdum vitae, tempor et ligula. Sed faucibus tempus arcu. Ut lacinia felis libero, sit amet finibus ante congue sit amet. Duis eget nisl orci. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.

In hac habitasse platea dictumst. Suspendisse consectetur accumsan maximus. Nullam sit amet nisi eros. In vel leo nec ipsum facilisis tempor. Sed quis iaculis tellus. Ut lorem nunc, accumsan vel fringilla et, iaculis vitae ipsum. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nunc erat dolor, dignissim sed arcu vitae, tincidunt varius lectus. Aenean tincidunt velit ac mattis egestas.

Cras sagittis ullamcorper nisi. Suspendisse orci justo, pellentesque non dolor sed, elementum cursus enim. Pellentesque vitae urna vel urna maximus lobortis. Maecenas id magna ac odio egestas lobortis a sed ligula. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; In hac habitasse platea dictumst. Vivamus non justo felis. In finibus ullamcorper libero ut rhoncus.

Donec ultricies ipsum sit amet enim tristique fringilla. Vivamus ullamcorper ullamcorper odio. Nam fringilla purus vel lacus pretium, quis egestas nisl rhoncus. Duis nec nibh tempus lectus tincidunt ullamcorper. Duis non convallis enim. Sed vitae tortor vitae dui dapibus bibendum sed sit amet ipsum. Phasellus nisl dui, ullamcorper vitae odio at, viverra mollis enim. Curabitur urna diam, egestas quis libero in, sagittis volutpat urna. Sed vel commodo velit, at fermentum arcu.

Duis bibendum ex quis egestas fringilla. Mauris scelerisque volutpat mi in tempus. Cras cursus a metus id tincidunt. Curabitur sed nisi lorem. Donec et rutrum dolor, vitae lacinia eros. Etiam rutrum tempor ipsum sed congue. Phasellus est sapien, hendrerit sed ligula ac, mattis consequat enim. Duis non sapien eu nisi ultricies ultrices.

Nulla semper metus eget enim placerat feugiat. Quisque congue arcu et purus scelerisque scelerisque. Sed pharetra pulvinar fringilla. Proin scelerisque elit lectus, in volutpat risus consectetur at. Cras in vulputate sapien. Maecenas erat nunc, sollicitudin in felis fermentum, suscipit elementum diam. Proin accumsan ante ac tristique volutpat. Vestibulum ac leo elementum, pellentesque justo in, luctus lectus. Maecenas eleifend lacus varius risus iaculis laoreet. Aliquam erat volutpat.

Nullam mattis ut lectus non molestie. Donec magna felis, lobortis nec lacus sit amet, sollicitudin finibus lacus. Pellentesque at iaculis elit. Integer laoreet enim ante, vitae tincidunt mauris semper id. Integer sed risus neque. Curabitur enim eros, fermentum vitae turpis quis, maximus maximus nisi. Aenean congue cursus nisi, eget tristique eros sodales non. In hac habitasse platea dictumst. Praesent quis sapien scelerisque, lacinia elit eu, egestas neque. Phasellus feugiat mi sed urna rhoncus, at malesuada arcu scelerisque. Suspendisse potenti. Vivamus sed luctus ante. Praesent at porttitor ipsum, sed faucibus eros.

Etiam mi mi, ultrices eu turpis vel, iaculis mattis leo. Pellentesque ac urna eu risus luctus euismod eu a justo. Sed elementum tincidunt semper. Fusce pulvinar ante mollis quam viverra, in cursus metus tristique. Duis nisi est, viverra nec dolor non, convallis sodales magna. Etiam facilisis tellus at nisl pulvinar faucibus. Nunc massa ligula, pulvinar sit amet augue nec, tristique molestie metus.

Vestibulum cursus, libero et lobortis sodales, magna diam cursus nunc, ut mollis lectus purus nec leo. Vestibulum in imperdiet nunc. Mauris in viverra elit. Proin gravida quam leo, at aliquet urna interdum et. Aenean vestibulum pretium auctor. Sed sit amet venenatis nunc. Aenean vitae tincidunt mi. Praesent massa felis, volutpat vel convallis a, finibus vitae dolor. Aliquam id velit ut erat lobortis tempor. Duis ut laoreet velit. Aenean molestie euismod nisi, maximus pretium diam tempor vel. Aliquam a consequat arcu. Pellentesque sed consequat lectus. Sed interdum imperdiet fermentum. Curabitur sed ex vel enim tincidunt aliquam nec a urna. Ut a ornare magna.

Vestibulum sed vestibulum quam. Sed lacinia consequat nulla sed sodales. Ut non nibh velit. Ut et vehicula nisl. Quisque eget erat vel nibh posuere viverra. Praesent vestibulum tortor dolor. Ut quis quam ornare, rhoncus eros vitae, tincidunt diam. Sed erat quam, sollicitudin quis libero vel, ornare venenatis lectus. Curabitur lorem dolor, lobortis sed dui sed, varius scelerisque neque. Duis dolor lectus, mattis sit amet elit a, aliquet viverra sem. Suspendisse volutpat mauris erat, ut pharetra purus dignissim eget. Vivamus lacinia diam in orci aliquet fringilla. Praesent sodales pretium maximus. Suspendisse potenti. Sed sed ligula nec mi eleifend mollis.

Donec justo nisl, interdum non erat sed, malesuada rhoncus mi. In congue augue et rhoncus imperdiet. Nunc tincidunt sollicitudin sapien, in tristique arcu. Praesent ac lectus lacus. Suspendisse arcu orci, fringilla nec lacus id, iaculis dapibus mauris. Aliquam vel mauris id leo vestibulum tempor. Donec vel ex turpis. Cras sodales est orci, in hendrerit enim suscipit id. Vestibulum egestas libero nunc, ut porta purus sodales vitae. Quisque suscipit urna id ante malesuada, in tempus purus scelerisque.

Aliquam fermentum nisi nunc, quis placerat nisl aliquam eu. Integer eget purus lacus. Praesent scelerisque iaculis lorem at dictum. Morbi semper justo eu rutrum ultrices. Donec sed ullamcorper leo. Vestibulum vulputate risus vitae ornare tempus. Aliquam feugiat ullamcorper justo et ultricies. Ut sit amet accumsan magna, eget vestibulum libero. Nam id semper nunc. Nullam ac auctor quam, non condimentum elit. Mauris finibus, libero feugiat sodales blandit, lacus nisi congue nulla, vitae volutpat orci risus non sem. Suspendisse sed rutrum velit. Vestibulum tempus ante eget malesuada maximus. Cras tellus ipsum, viverra eu nulla a, feugiat molestie odio.

Suspendisse elementum suscipit dui vel elementum. Pellentesque sit amet congue mi, in commodo mauris. Sed mollis volutpat turpis, eget luctus nulla. Nunc sollicitudin erat et lorem elementum lacinia in non eros. Morbi vel pharetra eros, eget suscipit arcu. Integer a massa lacus. Proin non consequat justo. Nulla lacinia sit amet quam ac blandit. Fusce quis dui sed dui gravida venenatis. Mauris quis est ex. Nullam ut massa libero.

Praesent sollicitudin in mi non porta. Nulla facilisi. Nunc non ullamcorper tortor. Curabitur sollicitudin pharetra est, a lacinia tortor porttitor sit amet. Integer viverra id purus quis ullamcorper. Donec venenatis sodales erat, eget efficitur metus egestas sit amet. Aenean ante risus, dictum at euismod quis, egestas at justo. Phasellus ultricies ex est. Pellentesque consectetur nulla justo. Suspendisse vestibulum commodo velit et sagittis.

Aliquam eleifend arcu eget diam tristique mattis. Nunc condimentum placerat ipsum, eget convallis mauris ultrices quis. Integer cursus, nulla nec porttitor imperdiet, lectus felis elementum orci, sed scelerisque purus velit sit amet augue. Integer auctor pulvinar odio sed interdum. Maecenas vehicula pulvinar dignissim. Sed ut neque facilisis mi accumsan egestas at non urna. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac mi arcu. Etiam non porta mauris, porttitor rutrum quam. Sed ut mauris non velit pulvinar vestibulum ac nec risus. Vivamus lacinia est quis condimentum tempor. Donec pellentesque egestas lectus vel tincidunt. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.

Morbi et tincidunt purus. Quisque efficitur dui sed ligula bibendum volutpat. Nam volutpat nunc massa. In sit amet ornare magna, convallis suscipit purus. Aliquam nibh orci, bibendum nec diam ac, tempus lacinia purus. Nunc ornare mauris et enim volutpat pharetra. Quisque molestie tristique orci vitae vulputate. Nunc egestas, ante eget lobortis pellentesque, odio orci rhoncus diam, a bibendum nibh nulla in diam. Phasellus laoreet ligula risus, vitae suscipit enim facilisis id. Aenean in dui lectus. Donec mattis ipsum sit amet euismod pharetra.

Vivamus ante nunc, bibendum vehicula luctus dapibus, varius sit amet mi. Aliquam pharetra dapibus lacinia. Nulla facilisi. Fusce ultricies, tellus eu suscipit faucibus, magna augue porttitor velit, sit amet bibendum nisl lorem eu turpis. Integer tincidunt lorem id sem commodo dictum. Nunc convallis, nulla eget volutpat laoreet, dui ipsum rhoncus nulla, non pretium est lacus porta massa. Praesent ornare at augue nec dictum. In finibus mi nec mattis varius. Nullam ac turpis mi. Phasellus lectus quam, mollis id eros eu, interdum fringilla ex.

Proin ipsum ligula, imperdiet et nisl eget, hendrerit commodo nisl. Maecenas eget consectetur enim. Nullam rutrum cursus faucibus. Maecenas ac magna tortor. Integer vulputate sapien non dui tincidunt mattis. Nulla rhoncus mollis dui a ornare. Proin elementum tincidunt ex, at auctor enim fringilla ac. In aliquet cursus lobortis. Vivamus lobortis, nunc id pulvinar gravida, orci eros interdum erat, id eleifend leo lectus non urna. Sed dui felis, commodo non nisi eu, suscipit aliquam urna. Duis nec nisi sit amet libero varius ornare in id libero.

Suspendisse accumsan malesuada purus, id ultrices tortor auctor at. Suspendisse dui ex, vestibulum id ullamcorper ac, maximus eu nulla. Nulla euismod sit amet magna et gravida. Nunc dui ex, scelerisque at facilisis non, finibus ut eros. Maecenas nec hendrerit ipsum. Pellentesque nunc metus, viverra consequat ligula in, blandit dignissim dui. Vestibulum iaculis eros ipsum, imperdiet commodo turpis tempor ac. Vestibulum dignissim ullamcorper dui. Phasellus venenatis tempus elit, vel malesuada dolor mattis et. Fusce scelerisque quam nibh, nec mollis augue rutrum ut. In cursus suscipit leo. Nullam volutpat magna vitae nisl pulvinar ultricies sit amet a odio. Suspendisse tincidunt ornare arcu, at imperdiet leo sagittis vel. Morbi tempus est orci, in dapibus est luctus eget.

Nunc erat magna, interdum nec molestie sit amet, congue vulputate lacus. Pellentesque in dapibus mi. Nunc id lacus sit amet ante faucibus convallis. Vestibulum molestie ac magna eget tempor. Maecenas fermentum augue est, et tempor nibh convallis vitae. Ut dictum vehicula felis, nec fringilla sem tempus eu. Maecenas feugiat sit amet nulla vel aliquet.
                </p>
            </div>
        </div>
        </div>
    )
}
export default Home