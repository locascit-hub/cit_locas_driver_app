import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl,LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/routedetailscreen.css'; // Assuming you have a CSS file for styles

import getEndpoint from '../utils/loadbalancer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function RouteDetailScreen() {
    const navigate = useNavigate();
    useEffect(() => {
      const storedUserData = localStorage.getItem('test');
      if (!storedUserData) {
        navigate('/');
      }
    }, []);
  const { state } = useLocation();
  const { _id, clgNo } = state || {}; 
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

const busDivIcon = (busNo) =>
  L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <img src="/bus-icon.webp" style="width:45px; height:45px;" />
        <span style="
          position: absolute;
          bottom: 15px;
          left: 18%;
          color: white;
          font-weight: bold;
          font-size: 14px;
          text-shadow: 1px 1px 2px black;
        ">
          ${busNo}
        </span>
      </div>
    `,
    className: "", // prevent Leaflet default styles
    iconSize: [50, 50],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  const fetchLocation = async () => {
    try {
      const res = await fetch(`${getEndpoint()}/get-location/obu/${_id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setLoc(null);
          setLoading(false);
          return;
        }
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setLoc({
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp,
      });
    } catch (e) {
      console.error('Fetch error', e);
      window.alert('Could not fetch live location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    pollRef.current = setInterval(fetchLocation, 10000);
    return () => clearInterval(pollRef.current);
  }, [_id]);

  if (loading) return <div className="centered">Loading...</div>;
  if (!loc) return <div className="centered">Live location not available yet.</div>;

  return (
    <div className="route-screen">
      <header className="header">
        <h2>BusNo: {clgNo || _id}</h2>
      </header>

      <div className="map-container">
        <MapContainer center={[loc.latitude, loc.longitude]} zoom={20} style={{ height: '100%', width: '100%' }}>
          <LayersControl position="topright">
  <LayersControl.BaseLayer checked name="Street View">
  <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
/>
  </LayersControl.BaseLayer>

  <LayersControl.BaseLayer name="Satellite View">
  <LayerGroup>
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      attribution="Tiles &copy; Esri"
    />
    <TileLayer
      url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      attribution="© OpenStreetMap contributors"
    />
  </LayerGroup>
</LayersControl.BaseLayer>
</LayersControl>


          <Marker position={[loc.latitude, loc.longitude]} icon={busDivIcon(clgNo || _id)}>
            <Popup>
              <strong>Bus No:</strong> {clgNo || _id}<br />
              <strong>Last Updated:</strong> {new Date(loc.timestamp).toLocaleString()}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="status-bar">
        Last updated: <strong>{new Date(loc.timestamp).toLocaleTimeString()}</strong>
      </div>
    </div>
  );
}
const styles = {
  routeScreen: {
    fontFamily: 'Segoe UI, sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f9f9f9',
  },
  header: {
    padding: '1rem',
    backgroundColor: '#ffd700',
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mapContainer: {
    flex: 1,
    borderTop: '1px solid #ccc',
  },
  statusBar: {
    padding: '0.5rem 1rem',
    fontSize: '14px',
    background: '#fff9db',
    borderTop: '1px solid #eee',
    textAlign: 'center',
    color: '#444',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666',
  },
};