import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/routedetailscreen.css';
import getEndpoint from '../utils/loadbalancer';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default function RouteDetailScreen() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]); // multiple bus locations
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem('test');
    if (!storedUserData) {
      navigate('/');
    }
  }, [navigate]);

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
      className: "",
      iconSize: [50, 50],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

  const fetchAllLocations = async () => {
    try {
      const res = await fetch(`${getEndpoint()}/get-location/all`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      // assuming data = [{_id, clgNo, latitude, longitude, timestamp}, ...]
      setLocations(data);
    } catch (e) {
      console.error('Fetch error', e);
      window.alert('Could not fetch live locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLocations();
    pollRef.current = setInterval(fetchAllLocations, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  if (loading) return <div className="centered">Loading...</div>;
  if (!locations.length) return <div className="centered">No live locations available.</div>;

  return (
    <div className="route-screen">
      <header className="header">
        <h2>Live Bus Tracking</h2>
      </header>

      <div className="map-container">
        <MapContainer
          center={[locations[0].latitude, locations[0].longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street View">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
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

          {locations.map((bus) => (
            <Marker
              key={bus._id}
              position={[bus.latitude, bus.longitude]}
              icon={busDivIcon(bus.clgNo || bus._id)}
            >
              <Popup>
                <strong>Bus No:</strong> {bus.clgNo || bus._id}<br />
                <strong>Last Updated:</strong> {new Date(bus.timestamp).toLocaleString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="status-bar">
        Last updated: <strong>{new Date().toLocaleTimeString()}</strong>
      </div>
    </div>
  );
}
