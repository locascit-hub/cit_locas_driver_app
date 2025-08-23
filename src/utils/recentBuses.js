

// utils/recentBuses.js
// Simple helper to manage recently searched buses in localStorage
// - Stores an array under key 'recentBuses'
// - Keeps most-recent-first, unique by obu_id or _id or regnNumber
// - Caps length to 5

const STORAGE_KEY = 'recentBuses';
const MAX_RECENT = 5;

function _getKey(bus) {
  if (!bus) return null;
  return bus.obu_id ?? bus._id ?? bus.regnNumber ?? JSON.stringify(bus);
}

export function getRecentBuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn('Failed to read recent buses from storage', e);
    return [];
  }
}

export function addRecentBus(bus) {
  if (!bus) return;
  try {
    const key = _getKey(bus);
    if (!key) return;
    const list = getRecentBuses();
    // remove existing matching
    const filtered = list.filter((b) => _getKey(b) !== key);
    // add to front
    filtered.unshift(bus);
    // cap
    const trimmed = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to add recent bus', e);
  }
}

export function clearRecentBuses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}