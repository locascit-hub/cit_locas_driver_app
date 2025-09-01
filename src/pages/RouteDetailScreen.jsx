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
import { FiArrowLeft, FiRefreshCcw ,FiRefreshCw} from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/routedetailscreen.css";
import getEndpoint from "../utils/loadbalancer";
import { useContext } from "react";
import { UserContext } from "../contexts";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

//  Add AnimatedMarker back for testing
function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null);
  const prevPos = useRef(position); // Hardcoded previous pos (Bangalore center)

  useEffect(() => {
    if (!markerRef.current) return;

    const marker = markerRef.current;
    const from = L.latLng(prevPos.current);
    const to = L.latLng(position);

    if (!from || !to || from.equals(to)) return;

    let start = null;
    const duration = 2000; // 2 sec animation

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevPos.current = to; // update for next run
      }
    }

    requestAnimationFrame(animate);
  }, [position]);

  return (
    <Marker ref={markerRef} position={prevPos.current} icon={icon}>
      {children}
    </Marker>
  );
}


export default function RouteDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { _id, clgNo } = state || {};
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadTimer, setReloadTimer] = useState(90); 
  const { token } = useContext(UserContext); 
  const [remtimer, setRemtimer] = useState(0);

 useEffect(() => {
    if (!token) navigate("/");
    fetchLocation();
  }, [token, navigate]);

  const busDivIcon = (busNo) =>
    L.divIcon({
      html: `
<div style="
  display: flex; 
  align-items: center; 
  justify-content: flex-start; 
  background-color: rgba(255, 255, 255, 0.8); 
  border-radius: 8px; 
  padding: 4px 8px;
  border: 1px solid #316adeff;
  width: fit-content;
">
  <!-- Bus Icon -->
  <img src="/bus-icon.png" style="width:30px; height:30px; border-radius:6px; margin-right:6px;" />

  <!-- Bus Number -->
  <span style="
    color: black; 
    font-weight: bold; 
    font-size: 20px; 
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
      const res = await fetch(`${getEndpoint()}/get-location/obu/${_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        });
      if (!res.ok) {
        if(res.status === 404) {
      window.location.reload();
      return;
      }
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setLoc(data);
    } catch (e) {
      console.error("Fetch error", e);
      window.alert("Could not fetch live location.");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {

const interval = setInterval(() => {
  if (!loc?.last) return; // wait until loc is available

  if (loc.i === -1 || !loc.i) {
    setRemtimer("Stopped");
    return;
  }

  const lastTime = new Date(loc.last).getTime(); // in ms
  const nextFetchTime = lastTime + loc.i * 60000 + 3000;
  const now = Date.now();

  const diff = nextFetchTime - now;
  console.log(diff)
    // show at least 1 second
  setRemtimer(Math.max(0, Math.ceil(diff / 1000)));
}, 1000);


  return () => clearInterval(interval); // cleanup on unmount
}, [loc]); // ✅ run only once on mount


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
    return (
      <div
        style={{
          height:"fit-content",
          marginBottom: "10px",
          zIndex: 1000,
          width:"100%",
          backgroundColor: "#fff9db",
          padding: "0.5rem",
          display:"flex",
          flexDirection:"row"
        }}
      >
      <div>
      <div style={{...styles.statusBar,fontSize: "15px",padding: "0.2rem 0.5rem"}}>
        Last updated: <strong>{new Date(loc.last).toLocaleString()}</strong>
      </div>
      <div style={{...styles.statusBar,fontSize: "14px",padding: "0rem 0.5rem"}}>
        Reload enables in <strong>{remtimer} secs</strong>
      </div>
      </div>
      <div style={{textAlign:"center",flex:1}}>
        <button disabled={remtimer!=0} style={{color:(remtimer!=0 || remtimer!="stopped")?"#2563EB":"green", cursor: "pointer",background:"transparent"}} onClick={onReload}>
          <strong><FiRefreshCcw size={26} fontFamily="Segoe UI" /></strong>
        </button>
      </div>

      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <div style={{display:"flex",flexDirection:"row",justifyContent:"flex-start",alignItems:"center",width:"100%",marginBottom:"2px"}}>
      <button style={styles.backButton} onClick={() => navigate("/search")}>
        <FiArrowLeft size={20} />
      </button>
      <div style={{width:"70%",textAlign:"center",height:"100%",...styles.title}}>
        <span>Bus No: {clgNo || _id}</span>
      </div>
      </div>
      <ReloadControl onReload={fetchLocation} />

      {/* Header */}
      <div style={{height:"75%"}}>
        <MapContainer center={[loc.lat,loc.long]} zoom={20} style={{ height: '100%', width: '100%' }}>
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


          <AnimatedMarker position={[loc.lat,loc.long]} icon={busDivIcon(clgNo || _id)}>
            <Popup>
              <strong>Bus No:</strong> {clgNo || _id}<br />
              <strong>Last Updated:</strong> {new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata", // change if needed
  }).format(new Date(loc.last))}
            </Popup>
          </AnimatedMarker>

          {/* Reload Button inside Map */}

        </MapContainer>
      </div>
    </div>
  );
}

const styles = {

  statusBar: {
    textAlign: "left",
    color: "#444",
  },
  container: {
    fontFamily: "Segoe UI, sans-serif",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f5f7f9ff",
    padding: "0.5rem",
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
    fontSize: "22px",
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
