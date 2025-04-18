import { DeviceType, getDeviceType } from '../components/GetDevice';
import styles from '../styles/editor.module.css'
import { Fragment, useState } from 'react';
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
    const [device, setDevice] = useState<DeviceType>('desktop')

    return (
        <Fragment>
            {device === 'desktop' && (
                <div className={styles['editor-home']}>
                    <h2>{greeting}</h2>
                </div>
            )}
        </Fragment>
    )
}
export default EditorHome;