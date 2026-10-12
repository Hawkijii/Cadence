import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/base.css';
import App from './App.jsx';
import { applyTheme, loadTheme } from './lib/theme.js';

// Apply the saved theme before the first render so the page never flashes the default palette.
applyTheme(loadTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
