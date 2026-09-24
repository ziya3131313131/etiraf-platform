import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Dark mode ilkin yükləmə
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
document.documentElement.setAttribute('data-theme', savedDarkMode ? 'dark' : 'light');

// Tema ilkin yükləmə
const savedTema = localStorage.getItem('tema') || 'default';
const temalar = {
  default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  ocean: 'linear-gradient(135deg, #2e3192 0%, #1bffff 100%)',
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  forest: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  galaxy: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  purple: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
  mint: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)'
};
document.body.style.background = temalar[savedTema] || temalar.default;

// Browser Notification icazəsi istə
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// PWA Service Worker qeydiyyatı
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker qeydiyyatdan keçdi:', registration);
      })
      .catch((error) => {
        console.log('❌ Service Worker qeydiyyatı uğursuz:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
