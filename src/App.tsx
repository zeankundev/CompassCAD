import React, { JSX, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import { GraphicsRenderer, InitializeInstance } from './engine/GraphicsRenderer';

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GraphicsRenderer | null>(null);
  useEffect(() => {
    if (canvas.current && !renderer.current) {
      renderer.current = new GraphicsRenderer(canvas.current, 800, 600);
      InitializeInstance(renderer.current);
      renderer.current.setMode(renderer.current.modes.Navigate);
    }
  }, []);
  return (
    <div className='app'>
      <h1>CompassCAD on React</h1>
      <canvas
        width={800}
        height={600}
        ref={canvas}
      />
    </div>
  );
}

export default App;
