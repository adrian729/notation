import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ornaments.css';
import { OrnamentsPage } from './OrnamentsPage.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OrnamentsPage />
  </StrictMode>,
);
