import React, { useContext } from 'react';
import { SocketContext } from '../App';
import { toast } from 'react-toastify';

export default function DriverDashboard({ driverId, busNo }) {
  const socket = useContext(SocketContext);

  const startBus = () => {
    socket.emit('busStarted', { driverId, busNo }, (response) => {
      if (response.success) {
        toast.success(`Bus ${busNo} started.`);
      } else {
        toast.error('Could not start bus.');
      }
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.label}>Driver ID: {driverId}</h2>
      <h2 style={styles.label}>Bus Number: {busNo}</h2>
      <button style={styles.button} onClick={startBus}>
        Start Bus
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: '100vh',
  },
  label: { fontSize: '18px', marginBottom: '12px' },
  button: {
    backgroundColor: '#10B981',
    padding: '14px 20px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
  },
};