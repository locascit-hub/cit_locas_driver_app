import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiUsers, FiNavigation } from 'react-icons/fi';

export default function WelcomeScreen({ installPrompt, handleInstallClick }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    console.log('hello')
    console.log(window.location.pathname === '/incharge-cit-login-xyz');
    if(window.location.pathname === '/incharge-cit-login-xyz'){
      console.log('ksks')
      navigate('/incharge-cit-xyz');
      return;
    }
    navigate('/login');
  };
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logoContainer}>
          <div style={styles.iconContainer}>
            <img
              src="/cit-logo.png" // Replace with your web image URL
              alt="CIT Logo"
              style={styles.logoImage}
            />
          </div>
          <h1 style={styles.title}>CIT Transport </h1>
          <p style={styles.subtitle}>Smart Transportation System</p>
        </div>

        <div style={styles.featuresContainer}>
          <div style={styles.feature}>
            <FiMapPin size={24} color="#FFFFFF" />
            <span style={styles.featureText}>Live Notifications</span>
          </div>
          <div style={styles.feature}>
            <FiUsers size={24} color="#FFFFFF" />
            <span style={styles.featureText}>Multi-User Support</span>
          </div>
          <div style={styles.feature}>
            <FiNavigation size={24} color="#FFFFFF" />
            <span style={styles.featureText}>Route Management</span>
          </div>
        </div>
        {installPrompt && (
          <button style={styles.getStartedButton} onClick={handleInstallClick}>
            <span style={styles.getStartedText}>Install App</span>
          </button>
        )}
        {!installPrompt && (
                  <button style={styles.getStartedButton} onClick={handleGetStarted}>
          <span style={styles.getStartedText}>Get Started</span>
        </button>
        )}

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(to bottom, #2563EB, #1E40AF, #1E3A8A)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 60,
    display: 'flex',
    flexDirection: 'column',
  },
  logoImage: { width: 80, height: 80 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  featuresContainer: { marginBottom: 60 },
  feature: { 
    display: 'flex', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  featureText: { fontSize: 16, color: '#FFFFFF', marginLeft: 12 },
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    padding: '16px 40px',
    borderRadius: 25,
    border: 'none',
    cursor: 'pointer',
  },
  getStartedText: { fontSize: 18, fontWeight: '600', color: '#2563EB' },
};