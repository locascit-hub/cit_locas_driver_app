// utils/recentBuses.js
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
    const filtered = list.filter((b) => _getKey(b) !== key);
    filtered.unshift(bus);
    const trimmed = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    _notifyRecentChanged(); // <— ensure same-tab listens can react instantly
  } catch (e) {
    console.warn('Failed to add recent bus', e);
  }
}

export function removeRecentBus(busOrKey) {
  try {
    const key = typeof busOrKey === 'string' ? busOrKey : _getKey(busOrKey);
    if (!key) return;
    const list = getRecentBuses();
    const next = list.filter((b) => _getKey(b) !== key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    _notifyRecentChanged();
  } catch (e) {
    console.warn('Failed to remove recent bus', e);
  }
}

export function clearRecentBuses() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    _notifyRecentChanged();
  } catch (e) {}
}

// Emit a custom event so the current tab can update instantly.
// (The native 'storage' event only fires in *other* tabs.)
function _notifyRecentChanged() {
  try {
    window.dispatchEvent(new CustomEvent('recentBuses:changed'));
  } catch {}
}
