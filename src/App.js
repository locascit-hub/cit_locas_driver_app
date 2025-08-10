import React, { useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SocketContext, UserContext } from './contexts';
import NavBar from './components/NavBar';

// Pages
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import HomeScreen from './pages/HomeScreen';
import SearchScreen from './pages/SearchScreen';
import TrackingScreen from './pages/TrackingScreen';
import NotificationScreen from './pages/NotificationScreen';
import ProfileScreen from './pages/ProfileScreen';
import RouteDetailScreen from './pages/RouteDetailScreen';

const WS_URL = 'https://transport-3d8k.onrender.com'; // Keep WSS/HTTPS in production

// Utility: Detect iOS Safari/Chrome (all use WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Root wrapper
function AppShell({ installPrompt, handleInstallClick }) {
  const location = useLocation();
  const hideNavOn = ['/', '/login', '/register'];
  const showNav = !hideNavOn.includes(location.pathname.toLowerCase());

  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomeScreen installPrompt={installPrompt} handleInstallClick={handleInstallClick} />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/tracking" element={<TrackingScreen />} />
        <Route path="/notifications" element={<NotificationScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/route-detail" element={<RouteDetailScreen />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {showNav && <NavBar />}
    </>
  );
}

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [role, setRole] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // WebSocket init
  const socket = useMemo(() => io(WS_URL, { transports: ['websocket'] }), []);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    // Optionally verify token with backend
    console.log('User is already logged in');
  }
}, []);

  useEffect(() => {
    return () => socket.disconnect();
  }, [socket]);

  // Notification permission handling
  useEffect(() => {
    if (!isIOS() && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission()
          .then((permission) => {
            console.log(`Notification permission: ${permission}`);
          })
          .catch((err) => {
            console.warn('Notification request failed:', err);
          });
      }
    } else {
      console.log('Notifications not supported on this device/browser.');
    }

    return () => socket.close();
  }, [socket]);

  // Install prompt handler
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log(`User ${choiceResult.outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  return (
    <SocketContext.Provider value={socket}>
      <UserContext.Provider value={{ role, setRole }}>
        <Router>
          <AppShell installPrompt={showInstallButton} handleInstallClick={handleInstallClick} />
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </UserContext.Provider>
    </SocketContext.Provider>
  );
}
