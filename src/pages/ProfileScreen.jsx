// src/pages/ProfileScreen.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts';
import getEndpoint from '../utils/loadbalancer';

// Inline SVG icons
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function ProfileScreen({ userData: propUserData }) {
  const navigate = useNavigate();
  const { token, userData: ctxUserData, role, setRole, setToken, setSno } = useContext(UserContext);

  const [userData, setUserData] = useState(propUserData || ctxUserData || null);
  const [shareLink, setShareLink] = useState('');
  const [saving, setSaving] = useState(false);
  // new state for schedule link
  const [scheduleLink, setScheduleLink] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  // Keep local userData in sync: prefer context, then prop, then fallback decode (minimal)
  useEffect(() => {
    if (propUserData) {
      setUserData(propUserData);
      if (propUserData.role) setRole && setRole(propUserData.role);
      return;
    }
    if (ctxUserData) {
      setUserData(ctxUserData);
      return;
    }
    //get token test from globally
    const stored =localStorage.getItem('test');
    if (stored) {
      try {
        const base64Payload = stored.split('.')[1];
        if (base64Payload) {
          const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const email = payload.email || payload.studentId || payload.sub;
          const roleFromToken = payload.role || 'student';
          if (email) {
            const minimal = { email, role: roleFromToken };
            setUserData(minimal);
            setRole && setRole(roleFromToken);
             setToken && setToken(stored);
            return;
          }
        }
      } catch (err) {
        // silent: provider should handle decoding normally
        // console.warn('fallback decode failed', err);
      }
    }

    // if we reach here and no token/context, redirect (redirect effect above will also run)
  }, [propUserData, ctxUserData, setRole]);

  // Parse email into name/department/batch
  const parseEmail = (email) => {
    if (!email) return { name: '', dept: '', batch: '' };
    const [beforeAt] = email.split('@');
    const [name, deptBatch] = (beforeAt || '').split('.');
    const dept = (deptBatch && deptBatch.slice(0, 4).toUpperCase()) || '';
    const year = deptBatch ? parseInt(deptBatch.slice(4, 8), 10) : NaN;
    const batch = !isNaN(year) ? `${year}-${year + 4}` : '';
    const formattedName = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : '';
    return { name: formattedName, dept, batch };
  };

  const logOut = () => {
    // Clear context + persisted data
    if (setToken) setToken(null);
    if (setRole) setRole(null);
    if (setSno) setSno && setSno(null);
    // also clear localStorage for backward compatibility
    localStorage.removeItem('test');
    localStorage.removeItem('sno');
    localStorage.removeItem('userData');
    navigate('/', { replace: true });
  };

  const saveShareLink = async () => {
  if (!shareLink.trim()) return;
  if (!userData?.email) {
    alert('User email not available.');
    return;
  }
  setSaving(true);

  try {
    const activeToken = token || localStorage.getItem('test');

    const resp = await fetch(`${getEndpoint()}/api/save-sharelink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({ shareLink: shareLink.trim(), inchargeEmail: userData.email }),
    });

    // parse json once (defensive)
    const result = await resp.json().catch(() => ({ error: resp.statusText }));

    if (resp.status === 404) {
      alert('Resource not found: ' + (result.error || resp.statusText) + '. Please contact admin.');
      return;
    }

    if (resp.ok) {
      alert('Share link updated successfully ✅');
      setShareLink('');
    } else {
      alert('Failed to save share link: ' + (result.error || resp.statusText));
    }
  } catch (err) {
    console.error('Error saving share link:', err);
    alert('Something went wrong while saving.');
  } finally {
    setSaving(false);
  }
};

const saveScheduleLink = async () => {
  if (!scheduleLink.trim()) return;
  if (!userData?.email) {
    alert('User email not available.');
    return;
  }
  setScheduleSaving(true);

  try {
    const activeToken = token || localStorage.getItem('test');

    const resp = await fetch(`${getEndpoint()}/api/save-schedulelink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({ scheduleLink: scheduleLink.trim(), inchargeEmail: userData.email }),
    });

    // parse json once (defensive)
    const result = await resp.json().catch(() => ({ error: resp.statusText }));

    if (resp.status === 404) {
      alert('Resource not found: ' + (result.error || resp.statusText) + '. Please contact admin.');
      return;
    }

    if (resp.ok) {
      alert('Schedule link saved and route table replacement initiated ✅');
      setScheduleLink('');
    } else {
      alert('Failed to save schedule link: ' + (result.error || resp.statusText));
    }
  } catch (err) {
    console.error('Error saving schedule link:', err);
    alert('Something went wrong while saving the schedule link.');
  } finally {
    setScheduleSaving(false);
  }
};




  // If still loading or no userData yet, you can return a spinner — for now return null
  if (!userData) return null;

  const { name, dept, batch } = parseEmail(userData.email);
  const userInitial = name ? name.charAt(0).toUpperCase() : 'S';
  const shownRole = userData.role || role || 'student';


  return (
    <>
    
      <style>{`
        :root {
          --primary-blue: #1E40AF;
          --light-blue: #3B82F6;
          --background-color: #F3F4F6;
          --card-background: #FFFFFF;
          --text-primary: #1F2937;
          --text-secondary: #6B7280;
          --border-color: #E5E7EB;
        }
        .profile-screen {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: var(--background-color);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: var(--card-background);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .profile-header-title { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
        .notification-btn { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.5rem; border-radius: 50%; }

        .profile-content {
          flex-grow: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .profile-banner {
          background: linear-gradient(135deg, var(--primary-blue), var(--light-blue));
          color: white;
          padding: 1.75rem 1.25rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }
        .profile-avatar {
          width: 100px; height: 100px; border-radius: 50%; border: 4px solid white;
          margin: 0 auto 0.75rem auto; display: inline-flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 700; background: #E0E0E0; color: #333;
        }
        .profile-greeting { margin: 0 0 6px 0; font-size: 1.25rem; font-weight: 700; }
        .profile-email { margin: 0; font-size: 0.95rem; opacity: 0.9; }

        .profile-details-card { background: var(--card-background); border-radius: 12px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .detail-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
        .detail-item:last-child { border-bottom: none; }
        .detail-label { font-size: 0.95rem; color: var(--text-secondary); }
        .detail-value { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }

        .logout-btn { width: 100%; margin-top: 0.75rem; padding: 0.7rem; font-size: 1rem; font-weight: 600; color: white; background-color: var(--primary-blue); border: none; border-radius: 10px; cursor: pointer; }
        .logout-btn:hover { opacity: 0.95; transform: translateY(-1px); }

        .sharelink-box { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
        .sharelink-box input { flex: 1; padding: 0.6rem; border-radius: 8px; border: 1px solid #d1d5db; font-size: 0.95rem; }
        .sharelink-box button { padding: 0.6rem 0.9rem; border-radius: 8px; border: none; background: var(--primary-blue); color: #fff; cursor: pointer; }
        .sharelink-box button:disabled { background: #9ca3af; cursor: not-allowed; }
      `}</style>

      <div className="profile-screen">
        <header className="profile-header">
          <h2 className="profile-header-title">My Profile</h2>
          <button className="notification-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
            <BellIcon />
          </button>
        </header>

        <main className="profile-content">
          <section className="profile-banner">
            <div className="profile-avatar" aria-hidden>{userInitial}</div>
            <h3 className="profile-greeting">Hello, {name || 'Student'}!</h3>
            <p className="profile-email">{userData.email}</p>
          </section>

          <section className="profile-details-card" aria-labelledby="profile-details">
            <div className="detail-item">
              <span className="detail-label">Department</span>
              <span className="detail-value">{dept || 'Not Available'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Batch</span>
              <span className="detail-value">{batch || 'Not Available'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">{shownRole}</span>
            </div>

            {shownRole === 'incharge' && (
              <div style={{ marginTop: 12 }}>
                <div className="sharelink-box">
                  <input aria-label="Share link" type="text" placeholder="Enter new share link..." value={shareLink} onChange={(e) => setShareLink(e.target.value)} />
                  <button type="button" onClick={saveShareLink} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>

                </div>

                {/* NEW: Schedule link input reuses the exact same UI as the share link (no visual changes) */}
                <div className="sharelink-box">
                  <input aria-label="Schedule link" type="text" placeholder="Enter new schedule link (will replace route table)..." value={scheduleLink} onChange={(e) => setScheduleLink(e.target.value)} />
                  <button type="button" onClick={saveScheduleLink} disabled={scheduleSaving}>{scheduleSaving ? 'Saving...' : 'Save'}</button>

                </div>

              </div>
            )}
          </section>

          <button className="logout-btn" onClick={logOut} aria-label="Logout"><LogoutIcon /> Logout</button>
        </main>
      </div>
    </>
  );
}
