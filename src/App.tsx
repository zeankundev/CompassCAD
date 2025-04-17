import React, { JSX, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './styles/theme.css'
import styles from './App.module.css';
import { GraphicsRenderer, InitializeInstance } from './engine/GraphicsRenderer';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Editor from './pages/Editor';

function App() {
    return (
      <div className={styles.app}>
          <Router>
                <Switch>
                  <Route exact path='/' component={Home} />
                  <Route path='/editor/:id' component={Editor} />
                  <Route path='/editor' component={Editor} />
                </Switch>
          </Router>
      </div>
    )
}

export default App;
