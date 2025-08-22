import {React, useEffect, useState,useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts';
import getEndpoint from '../utils/loadbalancer';



// Inlined SVGs to replace the 'react-icons/fi' dependency
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
  const [userData, setUserData] = useState(propUserData || null);
  const [shareLink, setShareLink] = useState(""); 
  const [saving, setSaving] = useState(false);
  const { role, setRole} = useContext(UserContext);   // 👈 role from context
  const [user, setUser] = useState(null);
  

  // --- Data loading and JWT parsing logic (no changes) ---
  useEffect(() => {
    if (propUserData) {
      setUserData(propUserData);
      
      return;
    }

    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
      setUserData(parsed);
      if (parsed.role) setRole(parsed.role);
       // 👈 Set role here
      return;
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    }

    const token = localStorage.getItem('test');
    if (token) {
      try {
        const base64Payload = token.split('.')[1];
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
         const roleFromToken = payload.role || "student";
          if (email) {
            setUserData({ email, token,role: roleFromToken  });
             setRole(roleFromToken);
            
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to decode JWT payload', err);
      }
    }

    navigate('/');
  }, [navigate, propUserData]);

  

  // --- Email parsing logic (no changes) ---
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
    localStorage.removeItem('test');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const saveShareLink = async () => {
    if (!shareLink.trim()) return;
    setSaving(true);
    try {
      const resp = await fetch(`${getEndpoint()}/api/save-sharelink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareLink, inchargeEmail: userData.email })
      });
      const result = await resp.json();
      if (resp.ok) {
        alert("Share link updated successfully ✅");
        setShareLink("");
      } else {
        alert("Failed to save share link: " + result.error);
      }
    } catch (err) {
      console.error("Error saving share link:", err);
      alert("Something went wrong while saving.");
    }
    setSaving(false);
  };

  // Parse user details once
  const { name, dept, batch } = userData ? parseEmail(userData.email) : {};
  const userInitial = name ? name.charAt(0).toUpperCase() : 'S';

  if (!userData) {
    // You can return a loading spinner here if you like
    return null; 
  }

  return (
    <>
      {/* Inlined CSS to remove the external stylesheet dependency */}
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
          display: absolute;
          flex-direction: column;
          background-color: var(--background-color);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: var(--card-background);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          flex-shrink: 0;
        }
        .profile-header-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .notification-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .notification-btn:hover {
          background-color: #f0f0f0;
          color: var(--primary-blue);
        }
        .profile-content {
          flex-grow: 1;
          padding: 1.5rem;
          height: calc(110vh - 64px); /* Adjust based on header height */
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .profile-banner {
          background: linear-gradient(135deg, var(--primary-blue), var(--light-blue));
          color: white;
          padding: 2rem 1.5rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }
        .profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border: 4px solid white;
          margin-bottom: 1rem;
          object-fit: cover;
          background-color: #E0E0E0; /* Fallback color for placeholder */
          color: #333; /* Text color for placeholder */
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: bold;
        }
        .profile-greeting {
          margin: 0 0 0.25rem 0;
          font-size: 1.75rem;
          font-weight: 600;
        }
        .profile-email {
          margin: 0;
          font-size: 1rem;
          opacity: 0.8;
          textalign: left;
        }
        .profile-details-card {
          background-color: var(--card-background);
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-size: 1rem;
          color: var(--text-secondary);
        }
        .detail-value {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
        }
       
          .logout-btn.below-card {
  width: 90%;
  align-self: center;
  padding: 0.6rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background-color: var(--primary-blue);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  box-shadow: 0 4px 12px rgba(66, 66, 226, 0.3);
}

.logout-btn.below-card:hover {
  background-color: #7591deff;
}

.logout-btn.below-card:active {
  transform: scale(0.98);
}
  .sharelink-box {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .sharelink-box input {
          flex: 1;
          padding: 0.7rem;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 1rem;
        }
        .sharelink-box button {
          padding: 0.7rem 1.2rem;
          border: none;
          border-radius: 8px;
          background-color: var(--primary-blue);
          color: white;
          cursor: pointer;
        }
        .sharelink-box button:disabled {
          background-color: #aaa;
          cursor: not-allowed;
        }

       
        }
      `}</style>
      <div className="profile-screen">
        {/* Header */}
        <header className="profile-header">
          <h2 className="profile-header-title">My Profile</h2>
          <button className="notification-btn" onClick={() => navigate('/notifications')} title="Notifications">
            <BellIcon />
          </button>
        </header>

        {/* Main Content */}
        <main className="profile-content">
          {/* Profile Banner */}
          <div className="profile-banner">
            <img
              src={`https://placehold.co/120x120/E0E0E0/333?text=${userInitial}`}
              alt="User Avatar"
              className="profile-avatar"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x120?text=Error'; }}
            />
            <h3 className="profile-greeting">Hello, {name || 'Student'}!</h3>
            <p className="profile-email">{userData.email}</p>
          </div>

          {/* Profile Details Card */}
          <div className="profile-details-card">
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
              <span className="detail-value">{userData.role || "Student"}</span>
            </div>
          </div>
          
       {/* Logout Button just below the detail box */}
        <button className="logout-btn below-card" onClick={logOut}>
          <LogoutIcon />
          Logout
        </button>

        {role === 'incharge' && (
  <div className="sharelink-box">
    <input
      type="text"
      placeholder="Enter new share link..."
      value={shareLink}
      onChange={(e) => setShareLink(e.target.value)}
    />
    <button onClick={saveShareLink} disabled={saving}>
      {saving ? "Saving..." : "Save"}
    </button>
  </div>
)}
        </main>

      </div>
    </>
  );
}

