/**
 * Offline Game Data Manager
 * Loads and provides open-source vehicle specs, weapon balances, mission templates, and city zone blueprints.
 * Works seamlessly offline with built-in fallbacks even under file:// protocol.
 */

class GameDataManager {
  constructor() {
    this.vehicles = [];
    this.weapons = [];
    this.missions = [];
    this.wantedTiers = [];
    this.zones = [];
    this.isLoaded = false;

    this.initDefaultData();
  }

  initDefaultData() {
    // Open-source vehicle archetypes
    this.vehicles = [
      {
        id: "sedan_standard",
        name: "Midtown Premier",
        category: "Sedan",
        width: 36,
        height: 68,
        maxSpeed: 400,
        reverseSpeed: -140,
        acceleration: 280,
        braking: 420,
        turnRate: 2.8,
        friction: 120,
        driftFriction: 0.90,
        defaultColor: "#2980b9"
      },
      {
        id: "sports_viper",
        name: "Venom GT",
        category: "Sports",
        width: 36,
        height: 66,
        maxSpeed: 520,
        reverseSpeed: -160,
        acceleration: 390,
        braking: 500,
        turnRate: 3.2,
        friction: 140,
        driftFriction: 0.86,
        defaultColor: "#e74c3c"
      },
      {
        id: "muscle_v8",
        name: "Thunderbolt 442",
        category: "Muscle",
        width: 38,
        height: 72,
        maxSpeed: 460,
        reverseSpeed: -130,
        acceleration: 350,
        braking: 360,
        turnRate: 2.5,
        friction: 110,
        driftFriction: 0.81,
        defaultColor: "#f39c12"
      },
      {
        id: "police_cruiser",
        name: "Metro Interceptor",
        category: "Law Enforcement",
        width: 36,
        height: 70,
        maxSpeed: 480,
        reverseSpeed: -150,
        acceleration: 330,
        braking: 460,
        turnRate: 3.1,
        friction: 130,
        driftFriction: 0.89,
        defaultColor: "#1a1a1a"
      }
    ];

    // Open-source weapon balance table
    this.weapons = [
      { id: "unarmed", name: "Fists", damage: 12, range: 28, cooldown: 0.45, icon: "👊" },
      { id: "bat", name: "Slugger Bat", damage: 30, range: 35, cooldown: 0.6, icon: "🏏" },
      { id: "pistol_9mm", name: "Hawk 9mm", damage: 28, range: 380, cooldown: 0.32, ammo: 48, icon: "🔫" },
      { id: "smg_micro", name: "Cobra SMG", damage: 18, range: 320, cooldown: 0.11, ammo: 120, icon: "⚡" }
    ];

    // Open-source missions
    this.missions = [
      {
        id: "mission_01",
        title: "Midnight Joyride",
        rewardCash: 750,
        rewardRep: 50,
        description: "Locate and deliver the Venom GT to the Eastside Chop Shop."
      },
      {
        id: "mission_02",
        title: "Five-Alarm Heat",
        rewardCash: 1200,
        rewardRep: 100,
        description: "Evade a 2-Star police pursuit without totaling your vehicle."
      }
    ];

    this.isLoaded = true;
  }

  async loadFromJSON() {
    // Only attempt fetch when served over HTTP/HTTPS in a real browser
    if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http') && typeof fetch === 'function') {
      try {
        const [vRes, wRes, mRes] = await Promise.all([
          fetch('./data/vehicles.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/weapons.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/missions.json').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (vRes && vRes.vehicles) this.vehicles = vRes.vehicles;
        if (wRes && wRes.weapons) this.weapons = wRes.weapons;
        if (mRes && mRes.missions) this.missions = mRes.missions;
      } catch (err) {
        // Fallback silently to offline dataset
      }
    }
  }

  getVehicleById(id) {
    return this.vehicles.find(v => v.id === id) || this.vehicles[0];
  }

  getVehicles() {
    return this.vehicles;
  }

  getWeapons() {
    return this.weapons;
  }

  getMissions() {
    return this.missions;
  }
}

const dataManager = new GameDataManager();

if (typeof window !== 'undefined') {
  window.GameDataManager = GameDataManager;
  window.dataManager = dataManager;
  // Background load json if under http
  dataManager.loadFromJSON();
}
