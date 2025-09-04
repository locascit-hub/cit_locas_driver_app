import React, { useState, useEffect,useContext } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import getEndpoint from "../utils/loadbalancer";
import "../styles/routedetailscreen.css";
import { UserContext } from "../contexts";

export default function ScheduleScreen() {
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, role } = useContext(UserContext); 

  useEffect(() => {
   
    if (!token) {
      navigate("/");
    }
  }, [token,navigate]);

 const fetchRouteChart = async () => {
  try {
    const res = await fetch(`${getEndpoint()}/get-route-chart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();

    if (data.route_chart) {
      setPdfUrl(data.route_chart);
    } else {
      console.error("No route chart in response:", data);
      window.alert(data.error || "No route chart found.");
    }
  } catch (e) {
    console.error("Fetch error", e);
    window.alert("Could not fetch route chart.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchRouteChart();
  }, []);

  if (loading) return <div className="centered">Loading Route Chart...</div>;
  if (!pdfUrl) return <div className="centered">No route chart available.</div>;

  return (
<div style={styles.container}>
  
  <header style={styles.header}>
    <button style={styles.backButton} onClick={() => navigate("/home")}>
          <FiArrowLeft size={20} />
         
        </button>
        <h2 style={styles.title}>Bus Route Chart</h2>
  </header>

  <div style={styles.pdfContainer}>
    {pdfUrl ? (
      <iframe src={pdfUrl} title="Schedule PDF" style={styles.pdfFrame} />
    ) : (
      <p>No schedule found</p>
    )}
  </div>
</div>
);
}


const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    height: "100dvh",
    backgroundColor: "#f4f0f0ff",
  },
   header: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    fontSize: "20px",
    fontWeight: "bold",
    backgroundColor: "#1976d2",
    color: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
   backButton: {
    display: "flex",
    alignItems: "center",
    background: "white",
    color: "#1976d2",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "12px",
    fontWeight: "500",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
   title: {
    margin: 0,
    fontSize: "18px",
    flex: 1,
    marginLeft: "35px",
    textAlign: "left",
  },
  pdfContainer: {
    flex: 1,
    width: "100%",
    height: "calc(100vh - 120px)",
    height: "calc(100dvh - 120px)", // 60px header + 60px bottom nav
    overflow: "hidden",
  },
  pdfFrame: {
    width: "100%",
    height: "calc(100vh - 120px)",
    height: "calc(100dvh - 120px)",
    border: "none",
  },
};
