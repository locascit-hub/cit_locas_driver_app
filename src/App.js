import React, { useMemo, useEffect,useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SocketContext } from './contexts';
import { UserContext } from './contexts';
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
 
  const socket = useMemo(() => io('https://transport-3d8k.onrender.com', { transports: ['websocket'] }), []);

  useEffect(() => {
    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {

    
    if (Notification.permission !== "granted") {
      Notification.requestPermission()
        .then(permission => {
          if (permission === "granted") {
            console.log("Notification permission granted");
          } else {
            console.log("Notification permission denied");
          }
        });
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
