import React, { useEffect } from 'react';
import { BsPencil } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen({ userData }) {

    const navigate = useNavigate();
    
  useEffect(() => {
    const storedUserData = localStorage.getItem('test');
    if (!storedUserData) {
      navigate('/');
    }
  }, []);

  const logOut = () => {
    localStorage.removeItem('test');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <p style={styles.message}>🚧 Work is in progress. 🚧</p>
      {userData && (
        <div >
          <p>Email : {userData.email}</p>
        </div>
      )}
      <button onClick={logOut}>Logout</button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    height: '100vh',
    width: '100vw',
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
    padding: 20,
  },
};