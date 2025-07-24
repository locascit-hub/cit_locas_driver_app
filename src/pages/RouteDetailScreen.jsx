import React from 'react';

export default function RouteDetailScreen() {
  return (
    <div style={styles.container}>
      <p style={styles.message}>🚧 Work is in progress. 🚧</p>
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