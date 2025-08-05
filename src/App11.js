import React, { useMemo, useEffect,useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SocketContext } from './contexts';
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

const WS_URL = process.env.REACT_APP_BACKEND_URL;
const BACKEND_SUBSCRIBE_URL = `${process.env.REACT_APP_BACKEND_URL}/subscribe`;
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;


// Root wrapper to decide when to show NavBar
function AppShell({ installPrompt, handleInstallClick }) {
  const location = useLocation();
  const hideNavOn = ['/', '/login', '/register']; // hide nav on splash/auth
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
        <Route path="*" element={<div style={{padding:40}}>Not Found</div>} />
      </Routes>
      {showNav && <NavBar />}
    </>
  );
}

export default function App() {

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // create socket once
  const socket = useMemo(() => io('https://transport-3d8k.onrender.com', { transports: ['websocket'] }), []);

  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_NEW_BUILD_READY') {
        console.log('[SW] New version available — reloading');
        window.location.reload();
      }
    });
  }
}, []);


  useEffect(() => {
    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {

    // Ask for notification permission and subscribe
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          subscribeUserToPush();
        }
      });
    } else {
      subscribeUserToPush();
    }

    return () => socket.close();
  }, []);

    const [showInstallButton, setShowInstallButton] = useState(false);
  
    useEffect(() => {
      const handler = (e) => {
        // Prevent Chrome from automatically showing the prompt
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true); // Show our custom install button
      };
  
      window.addEventListener('beforeinstallprompt', handler);
  
      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }, []);


    const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // Must be called from user gesture

    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

   const subscribeUserToPush = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log("Subscription created successfully:", subscription);
        
        const response = await fetch(BACKEND_SUBSCRIBE_URL, {
          method: "POST",
          body: JSON.stringify(subscription), // THIS IS THE CRUCIAL LINE
          headers: { "Content-Type": "application/json" },
        });
        
        if (response.ok) {
          console.log("Subscription sent to server successfully.");
        } else {
          const errorText = await response.text();
          console.error("Failed to send subscription to server:", response.status, errorText);
        }
      } catch (err) {
        console.error("Push subscription failed", err);
      }
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  };





  return (
    <SocketContext.Provider value={socket}>
      <Router>
        <AppShell installPrompt={showInstallButton} handleInstallClick={handleInstallClick} />
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </SocketContext.Provider>
  );
}
