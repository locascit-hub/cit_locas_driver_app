import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";
import { FiArrowLeft, FiRefreshCcw } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/routedetailscreen.css";
import getEndpoint from "../utils/loadbalancer";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function RouteDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { _id, clgNo } = state || {};
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadTimer, setReloadTimer] = useState(90); 

  useEffect(() => {
    const storedUserData = localStorage.getItem("test");
    if (!storedUserData) navigate("/");
  }, []);

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
        lat: data.lat,
        long: data.long,
        last: data.last,
      });
    } catch (e) {
      console.error("Fetch error", e);
      window.alert("Could not fetch live location.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

   useEffect(() => {
    const interval = setInterval(() => {
      setReloadTimer((prev) => {
        if (prev <= 1) {
          fetchLocation();
          return 90; // reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading)
    return <div style={styles.centered}>Loading live location...</div>;
  if (!loc)
    return (
      <div style={styles.centered}>⚠ Live location not available yet.</div>
    );

  const lastUpdated = new Date(loc.last);
  const diffMinutes = Math.floor((new Date() - lastUpdated) / 60000);
  const freshness =
    diffMinutes > 3
      ? `⚠ Last updated ${diffMinutes} mins ago`
      : `Last updated: ${lastUpdated.toLocaleTimeString()}`;

  // Custom Reload Button placed inside map
  function ReloadControl({ onReload }) {
    const map = useMap();
    return (
      <div
        style={{
          position: "absolute",
          top: "480px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        <button
          style={styles.reloadBtn}
          onClick={() => {
            if (diffMinutes > 3) {
              fetchLocation();
              window.alert("Location reloaded successfully.");
            } else {
              window.alert("Location is up to date (within 3 minutes).");
            }
          }}
        >
          {/*position: "bottomleft"*/}
          <FiRefreshCcw size={16} style={{ marginRight: 6 }} /> Reload
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button style={styles.backButton} onClick={() => navigate("/search")}>
        <FiArrowLeft size={20} />
      </button>

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}> Bus No: {clgNo || _id}</h2>
      </div>

      {/* Map */}
      <div style={styles.mapWrapper}>
        <MapContainer
          center={[loc.lat, loc.long]}
          zoom={17}
          style={styles.map}
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

          <Marker position={[loc.lat, loc.long]} icon={busDivIcon(clgNo || _id)}>
            <Popup>
              <strong>Bus No:</strong> {clgNo || _id}
              <br />
              <strong>Last Updated:</strong>{" "}
              {new Date(loc.last).toLocaleString()}
            </Popup>
          </Marker>

          {/* Reload Button inside Map */}
          <ReloadControl onReload={fetchLocation} />
        </MapContainer>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <span style={styles.freshness}>{freshness}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Segoe UI, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f5f7f9ff",
    padding: "1rem",
  },
  backButton: {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#e5e7eb",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  header: {
    background: "white",
    padding: "16px",
    borderRadius: "12px",
    textAlign: "center",
    marginBottom: "12px",
    backgroundColor: "#c3cad1ff",
    boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#1E40AF",
  },
  mapWrapper: {
    flex: 1,
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    marginBottom: "12px",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  statusBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "white",
    padding: "10px 16px",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    fontSize: "14px",
    color: "#6c6b6bff",
  },
  reloadBtn: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#4d6cd2ff",
    color: "#fff",
    border: "none",
    position: "center",
    padding: "6px 12px",
    borderRadius: 8,
    
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  },
  freshness: {
    fontSize: "13px",
    color: "#666",
  },
  centered: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontSize: "18px",
    color: "#666",
  },
};
