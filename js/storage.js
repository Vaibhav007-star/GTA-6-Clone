/**
 * Local Storage Persistence Manager
 * 100% Offline client-side data storage
 */

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'retro_outlaw_save_v1';
    this.data = this.load();
  }

  getDefaults() {
    return {
      cash: 250,
      highScore: 250,
      owned_vehicles: ['sedan_standard'],
      owned_weapons: ['unarmed', 'bat'],
      owned_outfits: ['tommy_classic'],
      player_outfit: 'tommy_classic',
      stats: {
        carsEntered: 0,
        copsEvaded: 0,
        collisions: 0,
        distanceTraveled: 0
      },
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        showTouchControls: 'auto' // auto, true, false
      }
    };
  }

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return Object.assign(this.getDefaults(), JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or disabled, falling back to session memory.', e);
    }
    return this.getDefaults();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.save();
  }

  getCash() {
    return this.data.cash !== undefined ? this.data.cash : 250;
  }

  addCash(amount) {
    this.data.cash = Math.max(0, (this.data.cash || 0) + amount);
    if (this.data.cash > this.data.highScore) {
      this.data.highScore = this.data.cash;
    }
    this.save();
    if (typeof gameHUD !== 'undefined' && gameHUD && gameHUD.updateCash) {
      gameHUD.updateCash(this.data.cash);
    }
    return this.data.cash;
  }

  deductCash(amount) {
    this.data.cash = Math.max(0, (this.data.cash || 0) - amount);
    this.save();
    if (typeof gameHUD !== 'undefined' && gameHUD && gameHUD.updateCash) {
      gameHUD.updateCash(this.data.cash);
    }
    return this.data.cash;
  }

  getHighScore() {
    return this.data.highScore;
  }

  incrementStat(statKey, delta = 1) {
    if (this.data.stats[statKey] !== undefined) {
      this.data.stats[statKey] += delta;
      this.save();
    }
  }

  getStats() {
    return this.data.stats;
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings) {
    Object.assign(this.data.settings, settings);
    this.save();
  }

  resetAll() {
    this.data = this.getDefaults();
    this.save();
  }
}

const storage = new StorageManager();

if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.storage = storage;
}

