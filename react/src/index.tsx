import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Assuming App.tsx is the main app component

// Assuming we are using React 18 or newer
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}
