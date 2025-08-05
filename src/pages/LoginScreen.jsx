import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiSmartphone, FiMail, FiLock } from 'react-icons/fi';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [otpPage, setOtpPage] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const BACKEND_SUBSCRIBE_URL = `${process.env.REACT_APP_BACKEND_URL}/subscribe`;
  const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  };

    const subscribeUserToPush = async (userEmail) => {
    if ('serviceWorker' in navigator) {;
      try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log("Subscription created successfully:", subscription);
        
        const response = await fetch(BACKEND_SUBSCRIBE_URL, {
          method: "POST",
          body: JSON.stringify({subscription:subscription,email: userEmail}), // THIS IS THE CRUCIAL LINE
          headers: { "Content-Type": "application/json" },
        });
        
        if (response.ok) {
          console.log("Subscription sent to server successfully.");
        } else {
          const errorText = await response.text();
          console.error("Failed to send subscription to server:", response.status, errorText);
        }
      } catch (err) {
        console.error("Failed to subscribe to push notifications:", err);
      }

    }
    else {
      console.error("Service Worker not supported in this browser.");
    }
  };

  const handleLogin = async () => {
    if (userType === 'student') {
      if (!email) {
        alert('Please enter your email');
        return;
      }
      if(!otpPage) {
      // For student login, we can use the email as the identifier
      //generate otp in server and send it to email
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(`Login Error: ${data.error || 'Failed to send OTP'}`);
        return;
      }
      alert('OTP sent to your email. Please check your inbox.');
      setOtpPage(true);
      // Here you can handle the OTP page navigation or state change
      return;
    }
    else{
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/student/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid OTP or email');
        }
      });

      await subscribeUserToPush(email.trim());
      navigate('/home', { replace: true, state: { role: 'student' } });
    }
    } else if (userType === 'driver') {
        // Driver login logic here, if any
        navigate('/home', { replace: true, state: { role: 'driver', mobile } });
    } else if (userType === 'incharge') {
      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/incharge/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim()
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        navigate('/main', { replace: true, state: { role: 'incharge', email } });
      } catch (err) {
        alert(`Login Error: ${err.message}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <FiTruck size={40} color="#FFFFFF" />
          <h1 style={styles.title}>Welcome Back</h1>
        </div>

        <div style={styles.form}>
          <div style={styles.userTypeContainer}>
            <p style={styles.userTypeLabel}>Select User Type</p>
            <div style={styles.userTypeButtons}>
              {['student', 'driver', 'incharge'].map((type) => (
                <button
                  key={type}
                  style={{
                    ...styles.userTypeButton,
                    ...(userType === type && styles.userTypeButtonActive)
                  }}
                  onClick={() => setUserType(type)}
                >
                  <span style={{
                    ...styles.userTypeButtonText,
                    ...(userType === type && styles.userTypeButtonTextActive)
                  }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {userType === 'driver' && (
            <div style={styles.inputContainer}>
              <FiSmartphone size={20} color="#64748B" />
              <input
                style={styles.input}
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          )}

          {userType === 'incharge' && (
            <>
              <div style={styles.inputContainer}>
                <FiMail size={20} color="#64748B" />
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div style={styles.inputContainer}>
                <FiLock size={20} color="#64748B" />
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {/* student email */}
          {userType === 'student' && (
            <div style={styles.inputContainer}>
              <FiMail size={20} color="#64748B" />
              <input
                style={styles.input}
                type="email"
                placeholder="sample@citchennai.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {/* OTP input for student login */}
          {otpPage && (
            <div style={styles.inputContainer}>
              <FiLock size={20} color="#64748B" />
              <input
                style={styles.input}
                type="text"
                placeholder="Enter OTP" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}
          
          <button style={styles.loginButton} onClick={handleLogin}>
            <span style={styles.loginButtonText}>
               Sign In
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(to bottom, #2563EB, #1E40AF)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter', // Now you can just use the font family name
    fontWeight: '700', // And specify the weight
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  userTypeLabel: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  userTypeButtons: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    padding: '8px 0',
    alignItems: 'center',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  userTypeButtonActive: {
    backgroundColor: '#2563EB',
  },
  userTypeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
  },
  userTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#1F2937',
    border: 'none',
    outline: 'none',
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
    height: 48,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
};