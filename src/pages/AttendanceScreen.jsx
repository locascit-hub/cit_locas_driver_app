import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import getEndpoint from '../utils/loadbalancer';
import { UserContext } from "../contexts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// --- Leaflet Imports ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
console.log(jsPDF.prototype.autoTable);


// Fix for default Leaflet marker icon issue with bundlers like Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// --- SVG Icons ---
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> );
const MapPinIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6B7280' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> );
const RefreshCwIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

// --- Map Modal Component ---
// --- Map Modal Component ---
// --- Map Modal Component ---
const MapModal = ({ isOpen, onClose, busData, isLoading }) => {
    if (!isOpen) return null;

    const parseCoordinates = (coordString) => {
        if (typeof coordString !== 'string' || !coordString.includes(',')) {
            return null;
        }

        // ✅ FIX: Remove leading/trailing quotes from the string before parsing
        const cleanedString = coordString.replace(/^"|"$/g, '');

        const parts = cleanedString.split(',');
        if (parts.length !== 2) return null;

        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());

        if (isNaN(lat) || isNaN(lng)) {
            return null;
        }

        return [lat, lng];
    };

    const startPos = parseCoordinates(busData?.start);
    const endPos = parseCoordinates(busData?.end);
    
    const mapCenter = startPos || [11.0168, 76.9558];

    return (
        // ... The rest of your Modal JSX remains the same
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Route for Bus No: {busData?.clgNo}</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-content">
                    {isLoading ? (
                        <div className="spinner-container"><div className="spinner"></div></div>
                    ) : (startPos && endPos) ? (
                        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={startPos}>
                                <Popup>Starting Point</Popup>
                            </Marker>
                            <Marker position={endPos}>
                                <Popup>Ending Point</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <p>Route data is not available for this bus.</p>
                    )}
                </div>
                 <div className="modal-footer">
                    <button onClick={onClose} className="cancel-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

export default function BusAttendance() {
    const navigate = useNavigate();
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useContext(UserContext);

    // --- State for Map Modal ---
    const [isMapOpen, setMapOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);


  const fetchBusData = async () => {
    if (buses.length === 0) setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${getEndpoint()}/api/bus-status`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // ✅ RE-ADD THE FILTER TO ENSURE ALL BUSES HAVE A VALID KEY
        const validBuses = data.filter(bus => bus.clgNo != null);

        setBuses(validBuses || []);

    } catch (err) {
        console.error("Error fetching bus data:", err);
        setError("Failed to load bus data. Please try again.");
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchBusData();
        
    }, []);

    // --- Updated function to handle map icon click ---
    const handleMapClick = async (clgNo) => {
        setMapOpen(true);
        setMapLoading(true);
        setSelectedBus({ clgNo }); // Set clgNo immediately

        try {
            const response = await fetch(`${getEndpoint()}/api/bus-route/${clgNo}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Could not fetch route data.');
            
            const routeData = await response.json();
            // Assuming coordinates are stored as arrays [lat, lng]
            setSelectedBus({ clgNo, ...routeData });
        } catch (err) {
            console.error("Error fetching route data:", err);
            // Keep modal open to show an error or 'not available' message
            setSelectedBus(prev => ({ ...prev, start: null, end: null }));
        } finally {
            setMapLoading(false);
        }
    };

 const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Live Bus Status Report", 14, 22);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, 14, 34);

    const tableData = [];
    for (let i = 0; i < buses.length; i++) {
        const bus = buses[i];
        let route = "N/A";
        let last = "N/A";

        try {
            const response = await fetch(`${getEndpoint()}/api/bus-pdf/${bus.clgNo}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                route = data.route || "N/A";

                if (bus.i === -1 && data.last) {
                    last = new Date(data.last).toLocaleTimeString();
                } else if (bus.i !== -1) {
                    last = "Not Reached Yet";
                }
            }
        } catch (err) {
            console.error(`Failed to fetch details for bus ${bus.clgNo}:`, err);
        }
        
        tableData.push([
            i + 1, 
            bus.clgNo, 
            route, 
            last
        ]);
    }

    // ✅ autoTable now works because the plugin is imported
   

// Call autoTable function, passing `doc`
autoTable(doc, {
  head: [['Serial Number', 'Bus Number', 'Route Name', 'Reached Time']],
  body:tableData,
  startY: 40,
  theme: 'striped',
  headStyles: { fillColor: '#4B5563' },
  styles: { fontSize: 10, cellPadding: 3, halign: 'center' },
  columnStyles: {
    0: { halign: 'center' },
    1: { halign: 'center' },
    2: { halign: 'left' },
    3: { halign: 'center' }
  }
});

doc.save("bus_status_report.pdf");
    setIsDownloading(false);
};

    
    return (
        <>
            <style>{`
                /* --- Existing styles remain the same --- */
                :root { --primary-color: #0D1B2A; --secondary-color: #1B263B; --accent-color: #415A77; --text-primary: #E0E1DD; --text-secondary: #778DA9; --bg-color: #F3F4F6; --card-bg: #FFFFFF; --text-dark: #1F2937; --status-green: #10B981; --status-red: #EF4444; --status-green-bg: #D1FAE5; --status-red-bg: #FEE2E2; }
                .dashboard-screen { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: var(--bg-color); min-height: 100vh; display: flex; flex-direction: column; }
                .dashboard-header { background-color: var(--card-bg); box-shadow: 0 2px 4px rgba(0,0,0,0.05); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
                .header-title { font-size: 1.25rem; font-weight: 600; color: var(--text-dark); }
                .header-btn { background: none; border: none; cursor: pointer; color: var(--text-dark); padding: 0.5rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
                .dashboard-content { flex-grow: 1; padding: 1.5rem; }
                .loading-container, .error-container { display: flex; justify-content: center; align-items: center; height: 60vh; flex-direction: column; gap: 1rem; color: var(--text-secondary); }
                .spinner { width: 48px; height: 48px; border: 5px solid #FFF; border-bottom-color: var(--accent-color); border-radius: 50%; display: inline-block; box-sizing: border-box; animation: rotation 1s linear infinite; }
                @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .bus-list { display: grid; gap: 1rem; }
                .bus-item { display: flex; align-items: center; background-color: var(--card-bg); padding: 1rem 1.25rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .bus-item:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
                .bus-info { display: flex; align-items: center; gap: 1rem; flex-grow: 1; }
                .bus-clgNo { font-size: 1.1rem; font-weight: 700; color: var(--text-dark); }
                .bus-status { margin-left: auto; padding: 0.3rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
                .status-started { background-color: var(--status-green-bg); color: var(--status-green); }
                .status-stopped { background-color: var(--status-red-bg); color: var(--status-red); }

                /* --- New Modal Styles --- */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-container { background: white; padding: 1.5rem; border-radius: 12px; width: 90%; max-width: 700px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 0.75rem; margin-bottom: 1rem; }
                .modal-header h3 { margin: 0; color: var(--text-dark); }
                .modal-close-btn { background: none; border: none; font-size: 2rem; cursor: pointer; color: #9CA3AF; line-height: 1; }
                .modal-content { height: 400px; width: 100%; }
                .spinner-container { display: flex; align-items: center; justify-content: center; height: 100%; }
                .modal-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; text-align: right; }
                .cancel-btn { background-color: #6B7280; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .cancel-btn:hover { background-color: #4B5563; }
            `}</style>
            
            <MapModal 
                isOpen={isMapOpen}
                onClose={() => setMapOpen(false)}
                busData={selectedBus}
                isLoading={mapLoading}
            />

            <div className="dashboard-screen">
                <header className="dashboard-header">
                    <button className="header-btn" onClick={() => navigate(-1)} aria-label="Go Back"><ArrowLeftIcon /></button>
                    <h1 className="header-title">Live Bus Status</h1>

                    <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                    className="header-btn" 
                   onClick={handleDownloadPDF} 
                   aria-label="Download PDF Report"
                   disabled={isDownloading || loading}
                   >
                    {isDownloading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div> : <DownloadIcon />}
                </button>
                <button className="header-btn" onClick={fetchBusData} aria-label="Refresh Data" disabled={isDownloading}><RefreshCwIcon /></button>
               </div>
                </header>
                <main className="dashboard-content">
                    {loading ? (
                        <div className="loading-container"><div className="spinner"></div><p>Fetching Live Data...</p></div>
                    ) : error ? (
                        <div className="error-container"><p>{error}</p><button onClick={fetchBusData}>Retry</button></div>
                    ) : (
                        <div className="bus-list">
                            {buses.map((bus) => (
                                <div key={bus.clgNo} className="bus-item">
                                    <div className="bus-info">
                                        <span onClick={() => handleMapClick(bus.clgNo)} style={{ cursor: 'pointer', display: 'flex' }}><MapPinIcon /></span>
                                        <span className="bus-clgNo">Bus No: {bus.clgNo}</span>
                                    </div>
                                    {/* ✅ Corrected bus.i to bus.count_i */}
                                    <div className={`bus-status ${bus.i === -1 ? 'status-stopped' : 'status-started'}`}>
                                        {bus.i === -1 ? 'Stopped' : 'Started'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}