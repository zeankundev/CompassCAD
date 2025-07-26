import { DeviceType, getDeviceType } from '../components/GetDevice';
import YesNoDialog from '../components/YesNoDialog';
import styles from '../styles/editor.module.css'
import CompassCADLogo from '../assets/logo.svg'
import { Fragment, useEffect, useState } from 'react';
import { HistoryEntry } from './Editor';
import NewSymbol from '../assets/newLogic.svg'
import OpenSymbol from '../assets/openLogic.svg'
import TrashSymbol from '../assets/trash.svg'
import BluePrintSymbol from '../assets/blueprint.svg'
import SendSymbol from '../assets/send.svg'
import BluePrintIsFuckingSleeping from '../assets/idle.svg'
import { LZString } from '../components/LZString';
import ReusableFooter from '../components/ReusableFooter';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { getLocaleKey } from '../components/LanguageHandler';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface MiniButtonClickableProps {
    icon: string,
    children: React.ReactNode,
    onPress?: () => void
}

interface YesNoProp {
    title: string,
    onYes: () => void,
    onNo: () => void,
    children: React.ReactNode
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
        let period: typeof timeMessages[number]['time'] = 'morning';
        if (hour >= 6 && hour < 10) period = 'morning';
        else if (hour >= 10 && hour < 15) period = 'noon';
        else if (hour >= 15 && hour < 18) period = 'afternoon';
        else if (hour >= 18 && hour < 20) period = 'evening';
        else if (hour >= 20 || hour < 3) period = 'night';
        else if (hour >= 3 && hour < 6) period = 'dawn';

        const keys = ['one', 'two', 'three'] as const;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        // getLocaleKey expects a string key, e.g. 'randomMesg.morning.one'
        return getLocaleKey(`editor.home.randomMesg.${period}.${randomKey}`);
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
    const [isBluePrintMode, setIsBluePrintMode] = useState(false);
    const [device, setDevice] = useState<DeviceType>('desktop');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [dialog, setDialog] = useState<YesNoProp | null>(null);
    const [showDialog, setshowDialog] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    console.log(`[home] api key: ${process.env.REACT_APP_BLUEPRINT_API_KEY || 'not set'}`);

    const genAI = new GoogleGenAI({apiKey: process.env.REACT_APP_BLUEPRINT_API_KEY || ''});

    const sendMessage = async () => {
        if (!currentMessage.trim()) return;
        
        setIsLoading(true);
        const newMessages: Message[] = [...messages, { role: 'user', content: currentMessage }];
        setMessages(newMessages);
        setCurrentMessage('');

        try {
            const config = { responseMimeType: 'text/plain' };
            const contents = [
              {
                role: 'user',
                parts: [
                  {
                    text: `
You are Blueprint, an AI assistant for CompassCAD, a web-based CAD editor.
You are designed to help users with their CAD designs, provide suggestions, and answer questions related to CompassCAD.
You are in a conversation with a user who is using CompassCAD.

When generating designs, output them in code blocks using the ccad language identifier:
\`\`\`ccad
[design elements here]
\`\`\`

The design format is a JSON array of objects where each object represents a component with these types:
- point: {type: 1, x: number, y: number, color: string, radius: number}
- line: {type: 2, x1: number, y1: number, x2: number, y2: number, color: string, radius: number}
- circle: {type: 3, x1: number, y1: number, x2: number, y2: number, color: string, radius: number}
- rectangle: {type: 4, x1: number, y1: number, x2: number, y2: number, color: string, radius: number}
- arc: {type: 5, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string, radius: number}
- measure: {type: 6, x1: number, y1: number, x2: number, y2: number, color: "#ff3", radius: number}
- label: {type: 7, x: number, y: number, text: string, fontSize: number, color: string}
- shape: {type: 8, x: number, y: number, components: Component[]}
- picture: {type: 9, x: number, y: number, pictureSource: string}

Example of a simple design with a point and line:
\`\`\`ccad
[
  {"type": 1, "x": 100, "y": 100, "color": "#ffffff", "radius": 5},
  {"type": 2, "x1": 100, "y1": 100, "x2": 200, "y2": 200, "color": "#ffffff", "radius": 2}
]
\`\`\`

Example of a rectangle with a label:
\`\`\`ccad
[
  {"type": 4, "x1": 50, "y1": 50, "x2": 150, "y2": 150, "color": "#ffffff", "radius": 2},
  {"type": 7, "x": 100, "y": 175, "text": "My Rectangle", "fontSize": 18, "color": "#eee"}
]
\`\`\`
This is not good practice and you will break the JSON parser.
\`\`\`ccad
[
  {"type": 4, "x1": 50, "y1": 50, "x2": 150, "y2": 150, "color": "#ffffff", "radius": 2}, // A comment
  {"type": 7, "x": 100, "y": 175, "text": "My Rectangle", "fontSize": 18, "color": "#eee"} // Another comment
]
\`\`\`
You must do it like this, instead of adding comments:
\`\`\`ccad
[
  {"type": 4, "x1": 50, "y1": 50, "x2": 150, "y2": 150, "color": "#ffffff", "radius": 2},
  {"type": 7, "x": 100, "y": 175, "text": "My Rectangle", "fontSize": 18, "color": "#eee"}
]
\`\`\`
In the JSON data, you are not allowed to provide comments, or else the parser will fail to parse your generated design.
However, outside of the ccad block, you can provide comments and explanations, such as what you have added or what you have changed.
When the user speaks in other languages than English, you must reply to them in that language. For example, a user requests for something in Dutch, you must reply in Dutch, and vice versa
                    `
                  }
                ],
              },
              // Add previous conversation history for context
              ...messages.map((msg) => ({
                role: msg.role,
                parts: [
                  {
                    text: msg.content,
                  },
                ],
              })),
              // Append the current message
              {
                role: 'user',
                parts: [
                  {
                    text: currentMessage,
                  },
                ],
              },
            ];

            // Call the streaming API to load response chunks
            const stream = await genAI.models.generateContentStream({
                model: 'gemini-2.0-flash',
                config,
                contents,
            });

            let assistantContent = '';
            // Add an empty assistant message immediately for live updates
            setMessages([...newMessages, { role: 'assistant', content: '' }]);

            // Process and display streaming chunks as they arrive
            for await (const chunk of stream) {
                // Extract text from the first candidate's content parts
                const newText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                assistantContent += newText;
                console.log(newText);
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    const lastMessageIndex = updatedMessages.length - 1;
                    updatedMessages[lastMessageIndex] = {
                        role: 'assistant',
                        content: assistantContent,
                    };
                    return updatedMessages;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages([...newMessages, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshHistory = () => {
        const storedHistory = localStorage.getItem('history');
        console.log(storedHistory)
        if (storedHistory !== null) {
            setHistory(JSON.parse(storedHistory));
            JSON.parse(storedHistory).forEach((entry: HistoryEntry, index: number) => {
                console.log(`[home] detailed history entry (index num ${index + 1}):
                name: ${entry.name}
                date: ${entry.date}
                type: ${entry.type}
                data: ${LZString.decompressFromEncodedURIComponent(entry.data)}
                `)
            })
        }
    }

    useEffect(() => {
        refreshHistory();
        setDevice(getDeviceType());
    }, [])

    const parseMessageContent = (content: string) => {
        const ccadRegex = /```ccad\n([\s\S]*?)```/g;
        let lastIndex = 0;
        const parts: (string | React.ReactElement)[] = [];
        let match;

        while ((match = ccadRegex.exec(content)) !== null) {
            // Add markdown text before the code block
            if (match.index > lastIndex) {
                const textSegment = content.slice(lastIndex, match.index);
                parts.push(
                    <Markdown key={`text-${lastIndex}`}>
                        {textSegment}
                    </Markdown>
                );
            }
            
            // Handle CCAD code block and provide a link to open the design
            const designData = match[1].trim();
            const encodedData = LZString.compressToEncodedURIComponent(designData);
            const designUrl = `/editor/designname="Blueprint-generated Design";${encodedData}`;
            parts.push(
                <a 
                    key={`ccad-${match.index}`}
                    href={designUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles['blueprint-design-link']}
                >
                    🔗 {getLocaleKey('editor.home.viewInEditor')}
                </a>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add any remaining markdown text content
        if (lastIndex < content.length) {
            const remainingText = content.slice(lastIndex);
            parts.push(
                <Markdown key={`text-${lastIndex}`}>
                    {remainingText}
                </Markdown>
            );
        }

        return parts;
    };

    return (
        <Fragment>
            {device === 'desktop' && (
                <div className={styles['editor-home']}>
                    {showDialog == true && (
                        <YesNoDialog
                        title={dialog?.title}
                        onYes={dialog?.onYes}
                        onNo={dialog?.onNo}
                        >
                            {dialog?.children}
                        </YesNoDialog>
                    )}
                    <div className={styles['editor-home-header']}>
                        <img src={CompassCADLogo} height={24} />
                    </div>
                    <br></br>
                    <div className={styles['editor-home-body']}>
                        <h2>{greeting}</h2>
                        <br></br>
                        <h3>{getLocaleKey('editor.home.quickActions')}</h3>
                        <br></br>
                        <div className={styles['editor-quicktool']}>
                            <MiniButtonClickable 
                                icon={NewSymbol}
                                onPress={() => window.location.href = '/editor/action=new;'}
                            >
                                {getLocaleKey('editor.home.createNew')}
                            </MiniButtonClickable>
                            <MiniButtonClickable 
                                icon={OpenSymbol}
                                onPress={importDesign}
                            >
                                {getLocaleKey('editor.home.importExisting')}
                            </MiniButtonClickable>
                            <MiniButtonClickable 
                                icon={TrashSymbol}
                                onPress={() => {
                                    setDialog(
                                        {
                                            title: getLocaleKey('editor.home.clearHistoryModal'), 
                                            onYes: () => {
                                                localStorage.setItem('history', '[]');
                                                refreshHistory();
                                                setshowDialog(false);
                                            },
                                            onNo: () => setshowDialog(false),
                                            children: <p>{getLocaleKey('editor.home.text1Sure')} <b>{getLocaleKey('editor.home.boldTextWarning')}</b></p>
                                        }
                                    );
                                    setshowDialog(true);}}
                            >
                                {getLocaleKey('editor.home.clearEntireHistory')}
                            </MiniButtonClickable>
                            <MiniButtonClickable 
                                icon={BluePrintSymbol}
                                onPress={() => {setIsBluePrintMode(isBluePrintMode ? false : true)}}
                            >
                                {getLocaleKey('editor.home.askBlueprint')}
                            </MiniButtonClickable>
                        </div>
                        <br></br>
                        {isBluePrintMode && (
                            <>
                                <div className={styles['blueprint-container']}>
                                    {messages.length > 0 && (
                                        <div className={styles['blueprint-messages']}>
                                            {messages.map((message, index) => (
                                                <div key={index} className={`${styles.message} ${message.role === 'user' ? styles.user : ''}`}>
                                                    <img 
                                                        src={message.role === 'user' ? BluePrintIsFuckingSleeping : BluePrintSymbol} 
                                                        alt={message.role}
                                                    />
                                                    <div className={styles['message-content']}>
                                                        {parseMessageContent(message.content)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {messages.length > 0 && <br></br>}
                                    <div className={styles['blueprint-childcontainer']}>
                                        <img src={BluePrintSymbol} width={24} style={{display: 'flex', alignSelf: 'flex-start'}}/>
                                        <div className={styles['blueprint-textarea']}>
                                            <textarea
                                                placeholder={getLocaleKey('editor.home.blueprintPlaceholder')}
                                                value={currentMessage}
                                                onChange={(e) => setCurrentMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        sendMessage();
                                                    }
                                                }}
                                            ></textarea>
                                            <small>{getLocaleKey('editor.home.blueprintWarning')}</small>
                                        </div>
                                        <div className={styles['blueprint-button']} onClick={sendMessage}>
                                            {isLoading ? <span className={styles['spinner2']}></span> : <img src={SendSymbol} width={24} />}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        <br></br>
                        <div className={styles['editor-recents']}>
                            <h3>{getLocaleKey('editor.home.recents')}</h3>
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
                                                    <h4>{data.name.length > 16 ? data.name.substring(0, 16) + '...' : data.name}</h4>
                                                    <span>{data.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles['editor-recents-none']}>
                                    <img src={BluePrintIsFuckingSleeping} width={256}/>
                                    <p>{getLocaleKey('editor.home.nothingInHistory')}</p>
                                </div>
                            )}
                            </div>
                    </div>
                    <ReusableFooter />
                </div>
            )}
            {device == 'mobile' && (
                <div className={styles['editor-home']}>
                    <span>mobile in wip, sorry.</span>
                    <h2>now what to do?</h2>
                    <ul>
                        <li>switch your phone to landscape mode</li>
                        <li>use desktop mode if portrait (I am not sure lol)</li>
                        <li>use your desktop :)</li>
                    </ul>
                    <span>if you did either that (except num 3), <b>refresh the page</b></span>
                </div>
            )}
        </Fragment>
    )
}
export default EditorHome;
