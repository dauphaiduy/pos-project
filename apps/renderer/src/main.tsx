import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Inject in-memory mock when running outside Electron (plain browser)
if (!window.electronAPI) {
  const { electronAPIMock } = await import('./mocks/electronAPI.mock');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electronAPI = electronAPIMock;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
