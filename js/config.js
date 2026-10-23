/**
 * Retro City: Outlaw - Game Configuration
 * 100% Original Offline Top-Down Action Driving Experience
 */

// Canvas roundRect polyfill for older browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (typeof radii === 'number') radii = [radii];
    const r = radii ? radii[0] || 0 : 0;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

const CONFIG = {
  TITLE: 'Retro City: Outlaw',
  VERSION: '1.0.0',

  // World dimensions (pixels / 3D units)
  WORLD_WIDTH: 3200,
  WORLD_HEIGHT: 3200,
  ROAD_WIDTH: 150,

  // Camera settings
  CAMERA_SMOOTHING: 0.1,
  DEFAULT_ZOOM: 1.0,

  // Player physics
  PLAYER: {
    WIDTH: 22,
    HEIGHT: 22,
    WALK_SPEED: 160,
    SPRINT_SPEED: 250,
    RADIUS: 11,
    ENTER_VEHICLE_DIST: 70
  },

  // Vehicle types and physics profiles
  VEHICLE_TYPES: {
    SEDAN: {
      name: 'Executive Sedan',
      width: 36,
      height: 68,
      maxSpeed: 400,
      reverseSpeed: -140,
      acceleration: 280,
      braking: 420,
      turnRate: 2.8,
      friction: 120,
      driftFriction: 0.90,
      defaultColor: '#2980b9'
    },
    SPORTS: {
      name: 'Viper GT',
      width: 36,
      height: 66,
      maxSpeed: 520,
      reverseSpeed: -160,
      acceleration: 380,
      braking: 500,
      turnRate: 3.2,
      friction: 140,
      driftFriction: 0.86,
      defaultColor: '#e74c3c'
    },
    MUSCLE: {
      name: 'Thunderbolt V8',
      width: 38,
      height: 72,
      maxSpeed: 460,
      reverseSpeed: -130,
      acceleration: 340,
      braking: 360,
      turnRate: 2.5,
      friction: 110,
      driftFriction: 0.82, // Higher drift/slide
      defaultColor: '#f39c12'
    },
    POLICE: {
      name: 'Interceptor Cruiser',
      width: 36,
      height: 70,
      maxSpeed: 480,
      reverseSpeed: -150,
      acceleration: 320,
      braking: 460,
      turnRate: 3.1,
      friction: 130,
      driftFriction: 0.89,
      defaultColor: '#1a1a1a'
    }
  },

  // Colors and themes
  COLORS: {
    GROUND: '#243342',
    GRASS: '#27ae60',
    ROAD: '#1e252b',
    ROAD_MARKING: '#f1c40f',
    SIDEWALK: '#7f8c8d',
    BUILDING_BASE: '#2c3e50',
    BUILDING_ROOF: '#3e5369',
    BUILDING_TRIM: '#d35400',
    WATER: '#2980b9'
  },

  // Wanted heat levels
  WANTED: {
    COOLDOWN_TIME: 10.0, // Seconds without sight to reduce star
    MAX_STARS: 5
  }
};

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

