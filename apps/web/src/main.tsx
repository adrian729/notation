import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@polyhymnia/notation-react/styles.css';
import './app.css';
import { App } from './App.js';
import { FontFamilyProvider } from './font.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FontFamilyProvider>
      <App />
    </FontFamilyProvider>
  </StrictMode>,
);
