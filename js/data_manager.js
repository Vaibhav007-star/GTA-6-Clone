/**
 * Offline Game Data Manager
 * Loads and provides open-source vehicle specs, weapon balances, mission templates, outfits, and store items.
 * Works seamlessly offline with built-in fallbacks even under file:// protocol.
 */

class GameDataManager {
  constructor() {
    this.vehicles = [];
    this.weapons = [];
    this.missions = [];
    this.wantedTiers = [];
    this.zones = [];
    this.outfits = [];
    this.items = [];
    this.isLoaded = false;

    this.initDefaultData();
  }

  initDefaultData() {
    // Open-source vehicle archetypes including Indian iconic vehicles
    this.vehicles = [
      {
        id: "thar_4x4",
        name: "Mahindra Thar 4x4",
        category: "Desi 4x4 SUV",
        description: "Iconic Indian 4x4 off-roader with high ground clearance, chunky 33-inch mud tires, vertical grille, and roll cage.",
        width: 38,
        height: 66,
        maxSpeed: 440,
        reverseSpeed: -130,
        acceleration: 340,
        braking: 450,
        turnRate: 3.0,
        friction: 120,
        driftFriction: 0.88,
        price: 1200,
        defaultColor: "#111111"
      },
      {
        id: "auto_rickshaw",
        name: "Tuk-Tuk Auto Rickshaw",
        category: "Desi 3-Wheeler",
        description: "Authentic yellow & green Indian 3-wheeler auto rickshaw! Ultra-nimble turning circle and loud horn.",
        width: 30,
        height: 52,
        maxSpeed: 360,
        reverseSpeed: -110,
        acceleration: 320,
        braking: 420,
        turnRate: 3.9,
        friction: 115,
        driftFriction: 0.92,
        price: 450,
        defaultColor: "#f1c40f"
      },
      {
        id: "bullet_350",
        name: "Royal Enfield Bullet 350",
        category: "Cruiser Bike",
        description: "Heavy metal Indian cruiser motorcycle with authentic dug-dug single-cylinder thump and chrome tank.",
        width: 20,
        height: 48,
        maxSpeed: 470,
        reverseSpeed: -70,
        acceleration: 410,
        braking: 480,
        turnRate: 3.6,
        friction: 130,
        driftFriction: 0.85,
        price: 650,
        defaultColor: "#111111"
      },
      {
        id: "scorpio_suv",
        name: "Scorpio Classic Boss",
        category: "Indian Heavy SUV",
        description: "The undisputed Indian mafia boss SUV with chrome teeth grille, front heavy bullbar, and roof carrier.",
        width: 39,
        height: 72,
        maxSpeed: 450,
        reverseSpeed: -130,
        acceleration: 330,
        braking: 440,
        turnRate: 2.7,
        friction: 115,
        driftFriction: 0.87,
        price: 1500,
        defaultColor: "#ffffff"
      },
      {
        id: "desi_truck",
        name: "Tata Highway Truck",
        category: "Heavy Commercial",
        description: "Vibrant Indian highway goods carrier with decorative folk art and 'Horn OK Please' rear bumper.",
        width: 44,
        height: 95,
        maxSpeed: 330,
        reverseSpeed: -90,
        acceleration: 240,
        braking: 380,
        turnRate: 2.1,
        friction: 110,
        driftFriction: 0.94,
        price: 2400,
        defaultColor: "#e67e22"
      },
      {
        id: "sports_viper",
        name: "Venom GT Supercar",
        category: "Exotic Sports",
        width: 36,
        height: 66,
        maxSpeed: 520,
        reverseSpeed: -160,
        acceleration: 390,
        braking: 500,
        turnRate: 3.2,
        friction: 140,
        driftFriction: 0.86,
        price: 4500,
        defaultColor: "#e74c3c"
      },
      {
        id: "muscle_v8",
        name: "Thunderbolt 442 V8",
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
        price: 2800,
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
        price: 3200,
        defaultColor: "#1a1a1a"
      }
    ];

    // Weapons
    this.weapons = [
      { id: "unarmed", name: "Fists", category: "Melee", damage: 15, range: 28, cooldown: 0.35, price: 0, icon: "👊" },
      { id: "bat", name: "Cricket / Baseball Bat", category: "Melee", damage: 38, range: 35, cooldown: 0.5, price: 120, icon: "🏏" },
      { id: "pistol_9mm", name: "Hawk 9mm Pistol", category: "Handgun", damage: 32, range: 400, cooldown: 0.28, price: 350, icon: "🔫" },
      { id: "smg_micro", name: "Micro-Uzi SMG", category: "Submachine Gun", damage: 22, range: 340, cooldown: 0.09, price: 850, icon: "⚡" },
      { id: "shotgun_pump", name: "Street Sweeper 12G", category: "Shotgun", damage: 85, range: 260, cooldown: 0.8, price: 1100, icon: "💥" },
      { id: "rifle_ak47", name: "Kalashnikov AK-47", category: "Assault Rifle", damage: 48, range: 480, cooldown: 0.13, price: 1800, icon: "🎯" }
    ];

    // Outfits & Wardrobe
    this.outfits = [
      { id: "tommy_classic", name: "Vice City Hawaiian", category: "Classic", price: 0, shirtColor: "#1abc9c", pantsColor: "#2980b9", icon: "🌴" },
      { id: "desi_kurta", name: "Mumbai Don Pathani Kurta", category: "Indian Desi", price: 400, shirtColor: "#111111", pantsColor: "#1a1a1a", icon: "👑" },
      { id: "mafia_suit", name: "Scarface White Tuxedo", category: "Formal Mafia", price: 750, shirtColor: "#ffffff", pantsColor: "#f5f6fa", icon: "🤵" },
      { id: "biker_leather", name: "Bullet Biker Leather", category: "Street", price: 350, shirtColor: "#533827", pantsColor: "#2c3e50", icon: "🏍️" },
      { id: "tactical_camo", name: "Desert Commando", category: "Military", price: 600, shirtColor: "#d4a373", pantsColor: "#a3704c", icon: "🪖" }
    ];

    // Consumables & Emergency Gear
    this.items = [
      { id: "health_pack", name: "First Aid Medi-Kit", category: "Medical", description: "Instantly restores health to 100%!", price: 150, icon: "🩹", effect: "HEALTH_100" },
      { id: "body_armor", name: "Tactical Kevlar Vest", category: "Defense", description: "Absorbs gunshots & crashes (100% Armor).", price: 250, icon: "🛡️", effect: "ARMOR_100" },
      { id: "nos_canister", name: "NOS Nitro Refill Canister", category: "Vehicle", description: "Instantly refills car NOS tank to 100%!", price: 120, icon: "🔥", effect: "NOS_100" },
      { id: "lawyer_card", name: "Corrupt Lawyer Bribe Card", category: "Legal", description: "Wipes all Police Wanted Stars to 0 immediately!", price: 500, icon: "⚖️", effect: "CLEAR_WANTED" },
      { id: "repair_kit", name: "Emergency Toolkit", category: "Vehicle", description: "Instantly repairs your current vehicle to 100% health.", price: 200, icon: "🔧", effect: "REPAIR_CAR" }
    ];

    // Missions
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
    if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http') && typeof fetch === 'function') {
      try {
        const [vRes, wRes, mRes, oRes, iRes] = await Promise.all([
          fetch('./data/vehicles.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/weapons.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/missions.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/outfits.json').then(r => r.ok ? r.json() : null).catch(() => null),
          fetch('./data/items.json').then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (vRes && vRes.vehicles) this.vehicles = vRes.vehicles;
        if (wRes && wRes.weapons) this.weapons = wRes.weapons;
        if (mRes && mRes.missions) this.missions = mRes.missions;
        if (oRes && oRes.outfits) this.outfits = oRes.outfits;
        if (iRes && iRes.items) this.items = iRes.items;
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

  getWeaponById(id) {
    return this.weapons.find(w => w.id === id) || this.weapons[0];
  }

  getOutfits() {
    return this.outfits;
  }

  getOutfitById(id) {
    return this.outfits.find(o => o.id === id) || this.outfits[0];
  }

  getItems() {
    return this.items;
  }

  getItemById(id) {
    return this.items.find(i => i.id === id) || this.items[0];
  }

  getMissions() {
    return this.missions;
  }
}

const dataManager = new GameDataManager();

if (typeof window !== 'undefined') {
  window.GameDataManager = GameDataManager;
  window.dataManager = dataManager;
  dataManager.loadFromJSON();
}
