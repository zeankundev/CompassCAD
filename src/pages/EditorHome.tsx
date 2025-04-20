import { DeviceType, getDeviceType } from '../components/GetDevice';
import styles from '../styles/editor.module.css'
import CompassCADLogo from '../assets/logo.svg'
import { Fragment, useEffect, useState } from 'react';
import { HistoryEntry } from './Editor';
import NewSymbol from '../assets/newLogic.svg'
import OpenSymbol from '../assets/openLogic.svg'

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

    const [greeting, setGreeting] = useState(getCurrentTimeMessage());
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        const storedHistory = localStorage.getItem('history');
        if (storedHistory !== null) {
            setHistory(JSON.parse(storedHistory));
        }
    }, [])

    return (
        <Fragment>
            {device === 'desktop' && (
                <div className={styles['editor-home']}>
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
                            >
                                Import existing
                            </MiniButtonClickable>
                        </div>
                        <br></br>
                        <div className={styles['editor-recents']}>
                            <h3>Recents</h3>
                            <br></br>
                            <div className={styles['editor-recents-container']}>
                                {history.map((data: HistoryEntry, index: number) => (
                                    <div 
                                        className={styles['editor-recents-entry']}
                                        key={index}
                                        onClick={() => window.location.href = `/editor/designname="${data.name}";${data.data}`}
                                    >
                                        <img src={data.preview} />
                                        <div className={styles['editor-recents-details']}>
                                            <div className={styles['recents-details-title']}>
                                                <h4>{data.name}</h4>
                                                <span>{data.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Fragment>
    )
}
export default EditorHome;
