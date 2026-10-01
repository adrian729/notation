import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@polyhymnia/notation-react/styles.css';
import './app.css';
import { App } from './App.js';
import { GlyphStyleProvider } from './font.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlyphStyleProvider>
      <App />
    </GlyphStyleProvider>
  </StrictMode>,
);
