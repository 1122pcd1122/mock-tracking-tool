const StorageUtil = {
  get(key, fallback) {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : (fallback || null);
    } catch (e) { return fallback || null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  },
  mocks() { return this.get('mt_mocks', []); },
  saveMocks(v) { this.set('mt_mocks', v); },
  tracking() { return this.get('mt_tracking', []); },
  saveTracking(v) { this.set('mt_tracking', v); }
};
window.StorageUtil = StorageUtil;
