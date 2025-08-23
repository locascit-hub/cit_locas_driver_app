// src/contexts/index.js
import React, { createContext, useState, useEffect } from 'react';
import decryptJWT from '../utils/decrypt';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('test') || null);
  const [sno, setSno] = useState(() => localStorage.getItem('sno') || null);
  const [userData, setUserData] = useState(null);

  // When token changes: persist and decode to userData
  useEffect(() => {
    let mounted = true;

    const handleToken = async () => {
      if (!token) {
        localStorage.removeItem('test');
        if (mounted) setUserData(null);
        return;
      }

      // persist token
      localStorage.setItem('test', token);

      try {
        const decoded = await decryptJWT(token);
        if (mounted) setUserData(decoded);
      } catch (err) {
        console.error('Failed to decode token', err);
        if (mounted) {
          setUserData(null);
          setToken(null);
          localStorage.removeItem('test');
        }
      }
    };

    handleToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Keep token and sno in sync across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'test') setToken(e.newValue);
      if (e.key === 'sno') setSno(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // If you want setSno to persist automatically, you can watch sno as well:
  useEffect(() => {
    if (sno) localStorage.setItem('sno', sno);
    else localStorage.removeItem('sno');
  }, [sno]);

  return (
    <UserContext.Provider value={{
      role, setRole,
      token, setToken,
      sno, setSno,
      userData, setUserData
    }}>
      {children}
    </UserContext.Provider>
  );
}
