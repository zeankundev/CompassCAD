import { DeviceType, getDeviceType } from '../components/GetDevice';
import YesNoDialog from '../components/YesNoDialog';
import styles from '../styles/editor.module.css'
import CompassCADLogo from '../assets/logo.svg'
import { Fragment, useEffect, useState } from 'react';
import { HistoryEntry } from './Editor';
import NewSymbol from '../assets/newLogic.svg'
import OpenSymbol from '../assets/openLogic.svg'
import TrashSymbol from '../assets/trash.svg'
import BluePrintIsFuckingSleeping from '../assets/idle.svg'
import { LZString } from '../components/LZString';

interface MiniButtonClickableProps {
    icon: string,
    children: React.ReactNode,
    onPress?: () => void
}

const MiniButtonClickable = (props: MiniButtonClickableProps) => {
    return (
        <Fragment>
            <div className={styles['clickable-button-mini']} onClick={props.onPress}>
                <img src={props.icon} />
                <div className={styles['clickable-button-mini-child']}>
                    {props.children}
                </div>
            </div>
        </Fragment>
    )
}
const EditorHome = () => {
    const timeMessages = [
        {
            time: 'morning',
            range: [6, 10],
            messages: [
                "Hey there? Had some coffee? ☕",
                "Good morning! Ready to start your day? 🌄",
                "Morning! Let's see what you'll brainstorm! 🤩"
            ]
        },
        {
            time: 'noon',
            range: [10, 15],
            messages: [
                "Starting anything at this time? 🧐",
                "Lunch time! Crave something and work here! 😋",
                "I hope you're not sleeping! 😴"
            ]
        },
        {
            time: 'afternoon',
            range: [15, 18],
            messages: [
                "You still up? Let's design! 🗺️",
                "Keep the creativity flowing! ✏️",
                "Perfect time for CAD work! 📐"
            ]
        },
        {
            time: 'evening',
            range: [18, 20],
            messages: [
                "You still working on evenings? 🧐",
                "Got anything last minute? ⌚",
                "Yet you're still strong. Keep it up 💪"
            ]
        },
        {
            time: 'night',
            range: [20, 3],
            messages: [
                "Aren't you supposed to sleep? 🛌",
                "Accidentally brainstormed now? 😵‍💫",
                "Yet, your caffeine never drains. ☕"
            ]
        },
        {
            time: 'dawn',
            range: [3, 6],
            messages: [
                "I'm going to sleep, wait nevermind. 😴",
                "This late and you got any ideas? 😮‍💨",
                "Hope you're not procrastinating! 🥲"
            ]
        }
    ];

    const getCurrentTimeMessage = () => {
        const hour = new Date().getHours();
        const timeSlot = timeMessages.find(({ range }) => 
            range[0] <= hour && (range[1] > range[0] ? hour < range[1] : hour < 24 || hour < range[1])
        );
        if (!timeSlot) return 'Welcome to the editor!';
        const randomIndex = Math.floor(Math.random() * timeSlot.messages.length);
        return timeSlot.messages[randomIndex];
    };

    const importDesign = () => {
        console.log('[home] importing design with dialog')
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ccad';
        input.click();
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result;
                    if (content) {
                        window.location.href = `/editor/designname="${file.name}";${LZString.compressToEncodedURIComponent(content as string)}`;
                    }
                };
                reader.readAsText(file);
            }
        };
    }

    const [greeting, setGreeting] = useState(getCurrentTimeMessage());
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showWipeDialog, setShowWipeDialog] = useState(false);

    const refreshHistory = () => {
        const storedHistory = localStorage.getItem('history');
        if (storedHistory !== null) {
            setHistory(JSON.parse(storedHistory));
        }
    }

    useEffect(() => {
        refreshHistory();
    }, [])

    return (
        <Fragment>
            {device === 'desktop' && (
                <div className={styles['editor-home']}>
                    {showWipeDialog == true && (
                        <YesNoDialog
                        title='Clear History'
                        onYes={() => {
                            localStorage.setItem('history', '[]');
                            refreshHistory();
                            setShowWipeDialog(false);
                        }}
                        onNo={() => setShowWipeDialog(false)}
                        >
                            Are you sure you want to clear your history? This <b>could not be undone</b>!
                        </YesNoDialog>
                    )}
                    <div className={styles['editor-home-header']}>
                        <img src={CompassCADLogo} height={24} />
                    </div>
                    <br></br>
                    <div className={styles['editor-home-body']}>
                        <h2>{greeting}</h2>
                        <br></br>
                        <h3>Quick Actions</h3>
                        <br></br>
                        <div className={styles['editor-quicktool']}>
                            <MiniButtonClickable 
                                icon={NewSymbol}
                                onPress={() => window.location.href = '/editor/action=new;'}
                            >
                                Create New
                            </MiniButtonClickable>
                            <MiniButtonClickable 
                                icon={OpenSymbol}
                                onPress={importDesign}
                            >
                                Import existing
                            </MiniButtonClickable>
                            <MiniButtonClickable 
                                icon={TrashSymbol}
                                onPress={() => setShowWipeDialog(true)}
                            >
                                Clear entire history
                            </MiniButtonClickable>
                        </div>
                        <br></br>
                        <div className={styles['editor-recents']}>
                            <h3>Recents</h3>
                            <br></br>
                            {history.length > 0 ? (
                                <div className={styles['editor-recents-container']}>
                                    {history.map((data: HistoryEntry, index: number) => (
                                        <div 
                                            className={styles['editor-recents-entry']}
                                            key={index}
                                            onClick={() => window.location.href = `/editor/designname="${data.name}";${data.data}`}
                                            title={`${data.name} on ${data.date}`}
                                        >
                                            <img src={data.preview} />
                                            <div className={styles['editor-recents-details']}>
                                                <div className={styles['recents-details-title']}>
                                                    <h4>{data.name.length > 20 ? data.name.substring(0, 20) + '...' : data.name}</h4>
                                                    <span>{data.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles['editor-recents-none']}>
                                    <img src={BluePrintIsFuckingSleeping} width={256}/>
                                    <p>Well, you got nothing on your history list today. Make some drawings and your history will appear here.</p>
                                </div>
                            )}
                            </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
export default EditorHome;
