import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiAlertTriangle, FiX, FiMapPin, FiUsers, FiUser, FiMap } from 'react-icons/fi';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a bus number to search');
      return;
    }

    setIsSearching(true);
    try {
      const resp = await fetch(
        `https://transport-3d8k.onrender.com/api/buses?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await resp.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(`Network error: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Search Buses</h1>
        <p style={styles.subtitle}>Find bus routes and schedules</p>
      </div>

      <div style={styles.searchContainer}>
        <div style={styles.searchInputContainer}>
          <FiSearch size={20} color="#6B7280" />
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Enter a Bus Number (e.g.,BUS001)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button style={styles.clearButton} onClick={clearSearch}>
              <FiX size={24} color="#9CA3AF" />
            </button>
          )}
        </div>
        <button
          style={styles.searchButton}
          onClick={handleSearch}
          disabled={isSearching}
        >
          <span style={styles.searchButtonText}>
            {isSearching ? 'Searching...' : 'Search'}
          </span>
        </button>
      </div>

      <div style={styles.resultsContainer}>
        {isSearching && (
          <div style={styles.spinner}>
            <div style={{ ...styles.dot, animationDelay: '-0.32s' }}></div>
            <div style={{ ...styles.dot, animationDelay: '-0.16s' }}></div>
            <div style={styles.dot}></div>
          </div>
        )}

        {!isSearching && searchResults.length > 0 ? (
          <>
            <h2 style={styles.resultsTitle}>
              Search Results ({searchResults.length})
            </h2>
            {searchResults.map((bus) => (
              <div key={bus.id} style={styles.busCard}>
                <div style={styles.busHeader}>
                  <div style={styles.busInfo}>
                    <h3 style={styles.busId}>{bus.id}</h3>
                    <p style={styles.busRoute}>{bus.route}</p>
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      ...(bus.status === 'On Time' ? styles.statusOnTime : styles.statusDelayed),
                    }}
                  >
                    <span
                      style={
                        bus.status === 'On Time'
                          ? { ...styles.statusText, ...styles.statusTextOnTime }
                          : { ...styles.statusText, ...styles.statusTextDelayed }
                      }
                    >
                      {bus.status ?? 'Unknown'}
                    </span>
                  </div>
                </div>

                <div style={styles.busDetails}>
                  <div style={styles.detailRow}>
                    <FiMapPin size={16} color="#6B7280" />
                    <p style={styles.detailText}>
                      Current: {bus.currentLocation ?? '---'}
                    </p>
                  </div>
                  <div style={styles.detailRow}>
                    <FiUsers size={16} color="#6B7280" />
                    <p style={styles.detailText}>
                      Capacity: {bus.capacity ?? '---'}
                    </p>
                  </div>
                  <div style={styles.detailRow}>
                    <FiUser size={16} color="#6B7280" />
                    <p style={styles.detailText}>
                      Driver: {bus.driver ?? '---'}
                    </p>
                  </div>
                </div>

                <div style={styles.routeSection}>
                  <h4 style={styles.routeTitle}>Route Stops:</h4>
                  <div style={styles.stopsContainer}>
                    {Array.isArray(bus.stops) &&
                      bus.stops.map((stop, index) => (
                        <div key={index} style={styles.stopItem}>
                          <div
                            style={
                              stop === bus.currentLocation
                                ? styles.currentStopDot
                                : styles.stopDot
                            }
                          />
                          <p
                            style={
                              stop === bus.currentLocation
                                ? styles.currentStopText
                                : styles.stopText
                            }
                          >
                            {stop}
                          </p>
                          <span style={styles.stopTime}>
                            {bus.schedule?.[index] ?? '--:--'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <button
                  style={styles.trackButton}
                  onClick={() =>
                    navigate('/route-detail', {
                      state: { userType: 'student', busId: bus.id },
                    })
                  }
                >
                  <FiMap size={16} color="#FFFFFF" />
                  <span style={styles.trackButtonText}>Track Live</span>
                </button>
              </div>
            ))}
          </>
        ) : !isSearching && searchQuery.length > 0 ? (
          <div style={styles.noResults}>
            <FiAlertTriangle size={48} color="#9CA3AF" />
            <p style={styles.noResultsText}>No buses found</p>
            <p style={styles.noResultsSubtext}>
              Try searching with a different bus number
            </p>
          </div>
        ) : (
          <div style={styles.searchPrompt}>
            <FiSearch size={48} color="#9CA3AF" />
            <p style={styles.promptText}>Search for buses</p>
            <p style={styles.promptSubtext}>
              Enter a bus number to see routes and schedules
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#F9FAFB',
    overflowY: 'auto',
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingLeft: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  searchContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: '0 16px',
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    padding: '12px 12px',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#1F2937',
    border: 'none',
    outline: 'none',
  },
  clearButton: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '0 8px',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: '12px 20px',
    alignItems: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    padding: 20,
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 3px rgba(0, 0, 0, 0.1)',
  },
  busHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  busInfo: { flex: 1 },
  busId: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#1F2937',
  },
  busRoute: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: 20,
  },
  statusOnTime: { backgroundColor: '#D1FAE5' },
  statusDelayed: { backgroundColor: '#FEE2E2' },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  statusTextOnTime: { color: '#059669' },
  statusTextDelayed: { color: '#DC2626' },
  busDetails: { marginBottom: 16 },
  detailRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
    marginLeft: 8,
  },
  routeSection: { marginBottom: 16 },
  routeTitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  stopsContainer: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 },
  stopItem: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stopDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D1D5DB', marginRight: 12 },
  currentStopDot: { backgroundColor: '#2563EB', width: 12, height: 12, borderRadius: '50%', marginRight: 12 },
  stopText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6B7280',
  },
  currentStopText: {
    fontWeight: '600',
    color: '#2563EB',
    flex: 1,
    fontFamily: 'Inter',
  },
  stopTime: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9CA3AF',
  },
  trackButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: '12px 20px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  trackButtonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    display: 'flex',
    flexDirection: 'column',
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  searchPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    display: 'flex',
    flexDirection: 'column',
  },
  promptText: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  promptSubtext: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    margin: 5,
    animation: 'bounce 1s infinite ease-in-out',
  },
};