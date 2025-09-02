import React, { useMemo, useEffect, useState,useContext  } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import decryptJWT from './utils/decrypt';

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
import { UserProvider, UserContext } from './contexts'; // import context
import InchargeLoginScreen from './pages/InchargeLogin';

// Utility: Detect iOS Safari/Chrome (all use WebKit)
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Root wrapper
function AppShell({ installPrompt, handleInstallClick }) {


  async function purgeIndexedDB(dbname) {
  if (!('indexedDB' in window)) {
    console.warn("This browser doesn't support IndexedDB.");
    return;
  }

  if (indexedDB.databases) {
    // Modern browsers (Chrome, Edge, some Firefox)
    indexedDB.deleteDatabase(dbname);
  } else {
    console.warn("indexedDB.databases() not supported in this browser. You must know the DB names to delete them.");
  }
}

//version purge
  useEffect(() => {
    const version=localStorage.getItem('__v');
    if(version!=='1.0.0'){
      //purge idb
      purgeIndexedDB('notifications-db');
      localStorage.removeItem('recentBuses');
      localStorage.setItem('__v','1.0.0');
    }
  },[]);


  // remote logout
  useEffect(() => {

    // Listen for push events forwarded from service worker
    if ('serviceWorker' in navigator) {
      const handler = async (event) => {
        if (event.data?.type === 'LOG_OUT') {
              purgeIndexedDB('notifications-db');
              localStorage.clear();
              location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);



  const location = useLocation();
  const hideNavOn = ['/','/incharge-cit-login-xyz', '/login', '/register','/incharge-cit-xyz'];
  const showNav = !hideNavOn.includes(location.pathname.toLowerCase());
  const { token, userData } = useContext(UserContext);
   const isLoggedIn = !!token;

  return (
    <>
    
      <Routes>
        
        <Route path="/" element={isLoggedIn ? <Navigate to="/home" /> : <WelcomeScreen installPrompt={installPrompt} handleInstallClick={handleInstallClick} />} />
        <Route path="/incharge-cit-login-xyz" element={isLoggedIn ? <Navigate to="/home" /> : <InchargeLoginScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/tracking" element={<TrackingScreen />} />
        <Route path="/notifications" element={<NotificationScreen />} />
        <Route path="/profile" element={<ProfileScreen userData={userData} />} />
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
  }, []);



  useEffect(() => {
  const handleAppInstalled = () => {
    alert("App installed successfully! Now you can see the app in your menu.");
  };

  window.addEventListener("appinstalled", handleAppInstalled);

  return () => {
    window.removeEventListener("appinstalled", handleAppInstalled);
  };
}, []);


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
        <UserProvider>
        <Router>
          <AppShell installPrompt={showInstallButton} handleInstallClick={handleInstallClick}  />
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </UserProvider>
  );
}
