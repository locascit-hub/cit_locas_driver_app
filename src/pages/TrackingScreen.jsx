import React,{useEffect} from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure this is imported here or in a root file
import { useNavigate } from 'react-router-dom';

export default function TrackingScreen() {
  const position = [10.9647, 76.9616]; // [latitude, longitude]
    const navigate = useNavigate();
    useEffect(() => {
      const storedUserData = localStorage.getItem('test');
      if (!storedUserData) {
        navigate('/');
      }
    }, []);

  return (
    <div style={styles.container}>
      <MapContainer
        center={position}
        zoom={14} // Zoom level based on initialRegion deltas
        scrollWheelZoom={false}
        style={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
      </MapContainer>
      <div style={styles.overlay}>
        <p style={styles.overlayText}>Tracking Live Location...</p>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  map: { 
    flex: 1,
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: {
    backgroundColor: '#2563EB',
    color: '#FFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
};