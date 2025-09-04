import React, { useState, useEffect, useContext } from 'react';
import {
  FiBell,
  FiSend,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiImage,
  FiTrash,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import getEndpoint from '../utils/loadbalancer';
import { openDB } from 'idb';

// ---------- IndexedDB Helper ----------
const DB_NAME = 'notifications-db';
const STORE_NAME = 'notifications';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: '_id' });
  },
});

const saveNotifications = async (notifs) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  notifs.forEach((notif) => tx.store.put(notif));
  await tx.done;
};

const getAllNotifications = async () => {
  const db = await dbPromise;
  const all = await db.getAll(STORE_NAME);
  all.sort((a, b) => new Date(b.time) - new Date(a.time));
  return all;
};

const getNotificationById = async (id) => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

const getLatestNotificationTime = async () => {
  const db = await dbPromise;
  const all = await db.getAll(STORE_NAME);
  if (all.length === 0) return 0;
  return Math.max(...all.map((n) => new Date(n.time).getTime()));
};

// ---------- NotificationScreen ----------
export default function NotificationScreen() {
  const { role, token } = useContext(UserContext);
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ title: "", description: "" });
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Redirect if no user data
  useEffect(() => {
    if (!userData) navigate('/');
  }, [userData, navigate]);

  // ---------- Fetch and Sync Notifications ----------
  const fetchNotifications = async () => {
    try {
      const storedNotifications = await getAllNotifications();
      setNotifications(storedNotifications);

      const latestTime = await getLatestNotificationTime();

      const res = await fetch(`${getEndpoint()}/api/notifications?after=${latestTime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const newNotifs = await res.json();

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev]);
        await saveNotifications(newNotifs);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationAsRead = async (id) => {
  const db = await dbPromise;
  const notif = await db.get(STORE_NAME, id);
  if (notif) {
    notif.read = true;
    await db.put(STORE_NAME, notif); // update notification in IDB
  }
};


  useEffect(() => {
    fetchNotifications();

    // Listen for push events forwarded from service worker
    if ('serviceWorker' in navigator) {
      const handler = async (event) => {
        if (event.data?.type === 'NEW_NOTIFICATION') {
          const notifId = event.data?.notifId;
          if (notifId) {
            console.log('Push received for ID:', notifId);
            const exists = await getNotificationById(notifId);
            if (exists) {
              console.log("Notification already in IDB, skipping fetch:", notifId);
              return;
            }
            console.log('Push without ID → full refresh');
            fetchNotifications();
          }
          else{
             fetchNotifications();
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  // ---------- Delete Notification ----------
  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this notification?');
    if (!confirmed) return;

    try {
      const res = await fetch(`${getEndpoint()}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        alert('Deleted successfully');
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // ---------- Send Notification ----------
  const handleImageSelect = (e) => {
    if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
  };

  const sendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.description.trim()) {
      alert('Please enter both title and description');
      return;
    }

    const formData = new FormData();
    formData.append('title', newNotification.title);
    formData.append('message', newNotification.description);
    formData.append('sender', 'Transport Incharge');
    formData.append('type', 'info');
    formData.append('targetStudentIds', 'all');
    if (selectedImage) formData.append('image', selectedImage);

    setLoading(true);
    try {
      const res = await fetch(`${getEndpoint()}/api/notifications`, {
        method: 'POST',
        body: formData,
        ...(token && { headers: { Authorization: `Bearer ${token}` } }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNotification({ title: "", description: "" });
        setSelectedImage(null);
        fetchNotifications();
      }
      alert('Notification sent successfully');
    } catch (error) {
      alert('Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FiAlertTriangle size={20} color="#F59E0B" />;
      case 'alert':
        return <FiAlertCircle size={20} color="#EF4444" />;
      case 'success':
        return <FiCheckCircle size={20} color="#10B981" />;
      default:
        return <FiInfo size={20} color="#3B82F6" />;
    }
  };

  const getNotificationBorder = (type) => {
    switch (type) {
      case 'warning':
        return '#F59E0B';
      case 'alert':
        return '#EF4444';
      case 'success':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  // ---------- Render ----------
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <p style={styles.title}>Notifications</p>
          {notifications.filter(n => !n.read).length > 0 && (
            <div style={styles.unreadBadge}>
              <p style={styles.unreadCount}>
                {notifications.filter(n => !n.read).length}
              </p>
            </div>
          )}
        </div>
        <FiBell size={24} color="#2563EB" />
      </div>

      {/* Send Notification */}
      {role === 'incharge' && (
        <div style={styles.sendSection}>
          <p style={styles.sendTitle}>Send Notification</p>
          <label style={styles.uploadButton}>
            <FiImage size={16} color="#2563EB" style={{ marginRight: 6 }} />
            <span style={styles.uploadText}>
              {selectedImage ? 'Change Selected Image' : 'Upload Image'}
            </span>
            <input type="file" accept="image/*" onChange={handleImageSelect} hidden />
          </label>
          {selectedImage && (
            <div style={styles.previewContainer}>
              <img src={URL.createObjectURL(selectedImage)} alt="preview" style={styles.imagePreview} />
              <button style={styles.removeImageButton} onClick={() => setSelectedImage(null)}>Remove Image</button>
            </div>
          )}
          <input
            type="text"
            style={styles.titleInput}
            placeholder="Enter title..."
            value={newNotification.title}
            onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
          />
          <div style={styles.inputContainer}>
            <textarea
              style={styles.input}
              placeholder="Type your description..."
              value={newNotification.description}
              onChange={(e) => setNewNotification(prev => ({ ...prev, description: e.target.value }))}
            />
            <button style={{...styles.sendButton,backgroundColor: loading ? '#94a3b8' : '#2563EB',}} onClick={sendNotification} disabled={loading}>
              <FiSend size={16} color="#FFFFFF" />
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div style={styles.notificationsList}>
        {notifications.map(notification => (
          <div
            key={notification._id || notification.id}
            style={{
              ...styles.notificationCard,
              ...(notification.read ? {} : styles.unreadCard),
              borderLeft: `4px solid ${getNotificationBorder(notification.type)}`,
            }}
          >
            {role === 'incharge' && (
              <button
                style={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification._id);
                }}
                title="Delete Notification"
              >
                <FiTrash size={16} color="#EF4444" />
              </button>
            )}

            <button
              style={styles.notificationContent}
              onClick={() => {
                if (notification.imageUrl) {
                  const uri = `${getEndpoint()}/api/img?id=${notification.imageUrl}`;
                  setLightboxImages([{ src: uri }]);
                  setLightboxOpen(true);
                } else {
                  if (!notification.read) {
                   notification.read = true;
                   setNotifications([...notifications]);
                    markNotificationAsRead(notification._id); // persist read state
                  }
                }
              }}
            >
              <div style={styles.notificationHeader}>
                <div style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</div>
                <div style={styles.notificationMeta}>
                  <p style={styles.notificationTitle}>{notification.title}</p>
                  <p style={styles.notificationSender}>From: {notification.sender}</p>
                </div>
              </div>

              <p style={styles.notificationMessage}>{notification.message}</p>

              {notification.imageUrl && (
                <img
                  src={`${getEndpoint()}/api/img?id=${notification.imageUrl}`}
                  alt="attachment"
                  style={styles.notificationImage}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImages([{ src: `${getEndpoint()}/api/img?id=${notification.imageUrl}` }]);
                    setLightboxOpen(true);
                  }}
                />
              )}

              <div style={styles.notificationFooter}>
                <span style={styles.notificationTime}>{new Date(notification.time).toLocaleString()}</span>
                {!notification.read && <span style={styles.unreadDot} />}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div style={styles.emptyState}>
          <FiBell size={48} color="#9CA3AF" />
          <h4 style={styles.emptyTitle}>No Notifications</h4>
          <p style={styles.emptyMessage}>You're all caught up! New notifications will appear here.</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxImages}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter, sans-serif',
    minHeight: '100vh',
    minHeight: '100dvh',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB',
  },
  previewContainer: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    padding: '2px 6px',
    fontSize: 10,
    cursor: 'pointer',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1F2937',
    margin: 0,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    padding: '2px 8px',
    marginLeft: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: 0,
  },
  sendSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottom: '1px solid #E5E7EB',
  },
  sendTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
    margin: 0,
    marginBottom: 12,
  },
  uploadButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '6px 12px',
    backgroundColor: '#E0ECFF',
    borderRadius: 8,
    marginBottom: 10,
    cursor: 'pointer',
  },
  uploadText: {
    color: '#2563EB',
    fontSize: '14px',
    fontWeight: 600,
    margin: 0,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
    objectFit: 'cover',
  },
  titleInput: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 400,
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    marginBottom: 12,
    fontFamily: 'Inter, sans-serif',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: '16px',
    fontWeight: 400,
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    resize: 'none',
    minHeight: 80,
    marginRight: 12,
    fontFamily: 'Inter, sans-serif',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  notificationsList: {
    flex: 1,
    padding: 20,
    paddingBottom: 80,
    overflowY: 'auto',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeft: '4px solid transparent',
    boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    display: 'block',
    padding: 16,
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  notificationHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
    margin: 0,
    marginBottom: 2,
  },
  notificationSender: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#6B7280',
    margin: 0,
  },
  notificationMessage: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#4B5563',
    lineHeight: '20px',
    margin: 0,
    marginBottom: 12,
  },
  notificationImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    objectFit: 'cover',
  },
  notificationFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: '12px',
    fontWeight: 400,
    color: '#9CA3AF',
    margin: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#2563EB',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#6B7280',
    marginTop: 12,
  },
};

