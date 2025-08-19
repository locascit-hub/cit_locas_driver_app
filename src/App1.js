import React, { useEffect, useState } from 'react';
import getEndpoint from './utils/loadbalancer';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;


function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {

    socket.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
      if (document.visibilityState === "hidden") {
        // This client-side notification is not what you need for PWA push
        // A push notification will be sent from the server via a Service Worker event
        // This is a common point of confusion.
        // showNotification("Socket Event", event.data);
      }
    };




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


const [deferredPrompt, setDeferredPrompt] = useState(null);
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

        const response = await fetch(`${getEndpoint()}/subscribe`, {
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
    <div className="App">
      <h1>PWA + WebSocket + Push</h1>
      <p>Check your browser console for debugging messages.</p>
      <ul>
        {messages.map((msg, index) => <li key={index}>{msg}</li>)}
      </ul>
          <div>
      {showInstallButton && (
        <button onClick={handleInstallClick}>Install App</button>
      )}
    </div>
    </div>
  );
}

export default App;