import React, { JSX, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './styles/theme.css'
import styles from './App.module.css';
import { GraphicsRenderer, InitializeInstance } from './engine/GraphicsRenderer';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';
import EditorHome from './pages/EditorHome';
import DownloadPage from './pages/Download';
import { GetLanguage } from './components/LanguageHandler';
import { CommunitySignIn } from './pages/CommunitySignIn';
import { CommunityHome } from './pages/CommunityHome';

function App() {
    useEffect(() => {
        document.documentElement.lang = GetLanguage();
    }, [])
    return (
        <div className={styles.app}>
            <Router>
                <Switch>
                    <Route exact path='/' component={Home} />
                    <Route path='/download' component={DownloadPage} />
                    <Route path='/editor/:id' component={Editor} />
                    <Route path='/editor' component={EditorHome} />
                    <Route path='/community/signin' component={CommunitySignIn} />
                    <Route exact path='/community' component={CommunityHome} />
                </Switch>
            </Router>
        </div>
    )
}

export default App;
