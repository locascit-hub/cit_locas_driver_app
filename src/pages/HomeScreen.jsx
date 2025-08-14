import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiUsers, FiMapPin, FiSearch, FiClock, FiBell } from 'react-icons/fi';
// Import the new CSS file
import '../styles/homescreen.css';

export default function HomeScreen() {
  const navigate = useNavigate();

  const activeBuses = [
    { id: 'BUS001', route: 'Route 1', status: 'On Time', location: 'Ennore', capacity: '32/40' },
    { id: 'BUS002', route: 'Route 1', status: 'On Time', location: 'Tondirapet', capacity: '28/40' },
    { id: 'BUS003', route: 'Route 1', status: 'On Time', location: 'Mint', capacity: '35/40' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <p style={styles.greeting}>Hello 10 Everyone!</p>
          <p style={styles.welcomeText}>Welcome to CIT Transport</p>
          <div style={styles.statsContainer}>
            <div style={styles.statItem}>
              <FiTruck size={24} color="#FFFFFF" />
              <p style={styles.statNumber}>101</p>
              <p style={styles.statLabel}>Active Buses</p>
            </div>
            <div style={styles.statItem}>
              <FiUsers size={24} color="#FFFFFF" />
              <p style={styles.statNumber}>4000</p>
              <p style={styles.statLabel}>Students</p>
            </div>
            <div style={styles.statItem}>
              <FiMapPin size={24} color="#FFFFFF" />
              <p style={styles.statNumber}>101</p>
              <p style={styles.statLabel}>Routes</p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Active Buses</h2>
          {activeBuses.map((bus) => (
            <div key={bus.id} className="bus-card" style={styles.busCard} onClick={() => { /* Add navigation if needed */ }}>
              <div style={styles.busCardHeader}>
                <div style={styles.busInfo}>
                  <h3 style={styles.busId}>{bus.id}</h3>
                  <p style={styles.busRoute}>{bus.route}</p>
                </div>
                <div
                  style={{
                    ...styles.statusBadge,
                    ...(bus.status === 'On Time' ? styles.statusOnTime : styles.statusDelayed),
                  }}
                >
                  <p
                    style={{
                      ...styles.statusText,
                      ...(bus.status === 'On Time' ? styles.statusTextOnTime : styles.statusTextDelayed),
                    }}
                  >
                    {bus.status}
                  </p>
                </div>
              </div>
              <div style={styles.busCardDetails}>
                <div style={styles.busDetail}>
                  <FiMapPin size={16} color="#6B7280" />
                  <p style={styles.busDetailText}>{bus.location}</p>
                </div>
                <div style={styles.busDetail}>
                  <FiUsers size={16} color="#6B7280" />
                  <p style={styles.busDetailText}>{bus.capacity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.quickActions}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionGrid}>
            <div 
              className="action-card"
              style={styles.actionCard}
              onClick={() => navigate('/search')}
            >
              <FiSearch size={32} color="#2563EB" />
              <p style={styles.actionText}>Search Bus</p>
            </div>
            <div 
              className="action-card"
              style={styles.actionCard}
              onClick={() => navigate('/tracking')}
            >
              <FiMapPin size={32} color="#059669" />
              <p style={styles.actionText}>Live Tracking</p>
            </div>
            <div className="action-card" style={styles.actionCard}>
              <FiClock size={32} color="#DC2626" />
              <p style={styles.actionText}>Schedule</p>
            </div>
            <div className="action-card" style={styles.actionCard}>
              <FiBell size={32} color="#7C3AED" />
              <p style={styles.actionText}>Notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: '#F9FAFB',
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    background: 'linear-gradient(to bottom, #2563EB, #1E40AF)',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  busCardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busInfo: {
    flex: 1,
  },
  busId: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
  },
  busRoute: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusOnTime: {
    backgroundColor: '#D1FAE5',
  },
  statusDelayed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  statusTextOnTime: {
    color: '#059669',
  },
  statusTextDelayed: {
    color: '#DC2626',
  },
  busCardDetails: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  busDetail: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  busDetailText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
    marginLeft: 6,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 'calc(50% - 10px)',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 8,
  },
};