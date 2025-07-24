import React, { useState, useEffect, useContext } from 'react';
import { FiBell, FiSend, FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiInfo, FiImage } from 'react-icons/fi';
import { SocketContext } from '../contexts';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Utility functions for icons and border colors
function getNotificationIcon(type) {
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
}

function getNotificationBorder(type) {
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
}

export default function NotificationScreen({ role = 'student' }) {
  const socket = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // New state for the lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);

  // Web PWA Host
  const HOST = 'https://transport-3d8k.onrender.com';

  useEffect(() => {
    fetchNotifications();
    socket.on('studentNotification', (notif) => {
      if (role === 'student' || role === 'driver') {
        setNotifications(prev => [notif, ...prev]);
        // Removed toast.info
      }
    });

    return () => {
      socket.off('studentNotification');
    };
  }, [socket, role]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${HOST}/api/notifications`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
  };

  const sendNotification = async () => {
    if (!newNotification.trim() && !selectedImage) {
      alert('Please enter a message or select an image');
      return;
    }

    const formData = new FormData();
    formData.append('title', 'Announcement');
    formData.append('message', newNotification);
    formData.append('sender', 'Transport Incharge');
    formData.append('type', 'info');
    if (selectedImage) formData.append('image', selectedImage);

    try {
      const res = await fetch(`${HOST}/api/notifications`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setNewNotification('');
        setSelectedImage(null);
        fetchNotifications();
        // Removed toast.success
      }
    } catch (error) {
      alert('Error sending notification');
    }
  };

  return (
    <div style={styles.container}>
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
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="preview"
              style={styles.imagePreview}
            />
          )}
          <div style={styles.inputContainer}>
            <textarea
              style={styles.input}
              placeholder="Type your message..."
              value={newNotification}
              onChange={(e) => setNewNotification(e.target.value)}
            />
            <button
              style={styles.sendButton}
              onClick={sendNotification}
            >
              <FiSend size={16} color="#FFFFFF" />
            </button>
          </div>
        </div>
      )}

      <div style={styles.notificationsList}>
        {notifications.map(notification => (
          <div
            key={notification._id || notification.id}
            style={{
              ...styles.notificationCard,
              ...(notification.read ? {} : styles.unreadCard),
              borderLeftColor: getNotificationBorder(notification.type),
            }}
          >
            <button
              style={styles.notificationContent}
              onClick={() => {
                if (notification.imageUrl) {
                  const uri = `${HOST}${notification.imageUrl}`;
                  setLightboxImages([{ src: uri }]);
                  setLightboxOpen(true);
                } else {
                  notification.read = true;
                  setNotifications([...notifications]);
                }
              }}
            >
              <div style={styles.notificationHeader}>
                <div style={styles.notificationIcon}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={styles.notificationMeta}>
                  <p style={styles.notificationTitle}>
                    {notification.title}
                  </p>
                  <p style={styles.notificationSender}>
                    From: {notification.sender}
                  </p>
                </div>
              </div>

              <p style={styles.notificationMessage}>
                {notification.message}
              </p>

              {notification.imageUrl && (
                <img
                  src={`${HOST}${notification.imageUrl}`}
                  alt="attachment"
                  style={styles.notificationImage}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImages([{ src: `${HOST}${notification.imageUrl}` }]);
                    setLightboxOpen(true);
                  }}
                />
              )}

              <div style={styles.notificationFooter}>
                <span style={styles.notificationTime}>
                  {new Date(notification.time).toLocaleString()}
                </span>
                {!notification.read && <span style={styles.unreadDot} />}
              </div>
            </button>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div style={styles.emptyState}>
          <FiBell size={48} color="#9CA3AF" />
          <h4 style={styles.emptyTitle}>No Notifications</h4>
          <p style={styles.emptyMessage}>
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      )}

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
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding:20,
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 4,
    width: 24,
    height: 20,
    marginLeft: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sendSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E5E7EB',
  },
  sendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    margin: 0,
  },
  uploadButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E0ECFF',
    borderRadius: 8,
    marginBottom: 10,
    cursor: 'pointer',
  },
  uploadText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    margin: 0,
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
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
    overflowY: 'auto',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.03)',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    margin: 0,
  },
  notificationSender: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    margin: 0,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 1.4,
    marginBottom: 12,
    margin: 0,
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
    fontSize: 12,
    fontWeight: '400',
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    margin: 0,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.4,
    margin: 0,
  },
};