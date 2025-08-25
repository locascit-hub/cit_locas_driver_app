import React, { useState, useEffect,useContext } from "react";
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
    <h2>Bus Route Chart</h2>
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
    backgroundColor: "#f9f9f9",
  },
  header: {
    textAlign: "center",
    padding: "10px",
    fontSize: "22px",
    fontWeight: "bold",
    backgroundColor: "#1976d2",
    color: "white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  pdfContainer: {
    flex: 1,
    width: "100%",
    height: "calc(100vh - 60px)", // 60px header + 60px bottom nav
    overflow: "hidden",
  },
  pdfFrame: {
    width: "100%",
    height: "calc(100vh - 60px)",
    border: "none",
  },
};
