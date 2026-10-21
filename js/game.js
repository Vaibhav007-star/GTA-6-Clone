/**
 * Core Game Loop & Scene Orchestrator
 * Retro City: Outlaw
 */

class GameHUD {
  constructor() {
    this.cashEl = document.getElementById('hud-cash');
    this.starsContainer = document.getElementById('hud-stars');
    this.speedContainer = document.getElementById('hud-speed-box');
    this.speedValEl = document.getElementById('hud-speed-val');
    this.notifEl = document.getElementById('hud-notification');
    this.btnActionIcon = document.getElementById('btn-action-icon');
    this.btnActionLabel = document.getElementById('btn-action-label');
    this.notifTimeout = null;
  }

  updateCash(amount) {
    if (this.cashEl) {
      this.cashEl.textContent = `$${String(amount).padStart(6, '0')}`;
    }
  }

  updateWantedStars(stars) {
    if (!this.starsContainer) return;
    const starIcons = this.starsContainer.children;
    for (let i = 0; i < starIcons.length; i++) {
      if (i < stars) {
        starIcons[i].classList.add('active');
      } else {
        starIcons[i].classList.remove('active');
      }
    }
  }

  updateSpeed(speedMph, isDriving) {
    if (!this.speedContainer) return;
    if (isDriving) {
      this.speedContainer.style.display = 'block';
      if (this.speedValEl) this.speedValEl.textContent = `${Math.round(speedMph)} MPH`;
      if (this.btnActionIcon) this.btnActionIcon.textContent = '🚪';
      if (this.btnActionLabel) this.btnActionLabel.textContent = 'EXIT';
    } else {
      this.speedContainer.style.display = 'none';
      if (this.btnActionIcon) this.btnActionIcon.textContent = '🚗';
      if (this.btnActionLabel) this.btnActionLabel.textContent = 'ENTER';
    }
  }

  showNotification(msg) {
    if (!this.notifEl) return;
    this.notifEl.textContent = msg;
    this.notifEl.classList.add('show');

    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      this.notifEl.classList.remove('show');
    }, 3500);
  }
}

const gameHUD = new GameHUD();

class RetroOutlawGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.isPaused = false;
    this.lastTime = 0;

    // Camera
    this.camera = {
      x: 750,
      y: 750,
      zoom: 1.0
    };

    // Subsystems
    this.map = new CityMap();
    this.player = new PlayerController(750, 750);
    this.vehicles = [];
    this.traffic = new TrafficManager();
    this.police = new PoliceDispatcher();
    this.minimap = new MiniMap('radar-canvas');
    this.skidMarks = new SkidMarkManager();
    this.particles = new ParticleManager();

    this.initVehicles();
    this.setupResize();
    this.setupControls();

    gameHUD.updateCash(storage.getCash());
  }

  initVehicles() {
    // Parked player-driveable cars throughout the city
    const spawns = [
      { x: 750, y: 700, type: 'SPORTS', angle: 0, color: '#e74c3c' },
      { x: 800, y: 750, type: 'SEDAN', angle: Math.PI / 2, color: '#2980b9' },
      { x: 1300, y: 700, type: 'MUSCLE', angle: Math.PI, color: '#f39c12' },
      { x: 1850, y: 1300, type: 'POLICE', angle: -Math.PI / 2, color: '#1a1a1a' },
      { x: 750, y: 1300, type: 'SEDAN', angle: 0, color: '#16a085' },
      { x: 1300, y: 1850, type: 'SPORTS', angle: Math.PI / 2, color: '#9b59b6' }
    ];

    for (const s of spawns) {
      this.vehicles.push(new Vehicle(s.x, s.y, s.type, s.angle, s.color));
    }
  }

  setupResize() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  setupControls() {
    input.onActionPress = () => this.toggleVehicleInteraction();
    input.onPauseToggle = () => this.togglePause();
    input.onMuteToggle = () => {
      const muted = audio.toggleMute();
      gameHUD.showNotification(muted ? 'Sound Muted' : 'Sound Enabled');
    };

    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => this.togglePause());
    }

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => this.togglePause());
    }

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        storage.resetAll();
        window.location.reload();
      });
    }
  }

  toggleVehicleInteraction() {
    if (this.player.isInVehicle) {
      this.player.exitVehicle();
      gameHUD.updateSpeed(0, false);
    } else {
      const entered = this.player.tryEnterVehicle(this.vehicles);
      if (entered) {
        gameHUD.updateSpeed(0, true);
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) {
      pauseModal.style.display = this.isPaused ? 'flex' : 'none';
      if (this.isPaused) {
        this.updateStatsDisplay();
      }
    }
  }

  updateStatsDisplay() {
    const stats = storage.getStats();
    const statsContainer = document.getElementById('pause-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-row"><span>Cash Balance:</span> <strong>$${storage.getCash()}</strong></div>
        <div class="stat-row"><span>Cars Entered:</span> <strong>${stats.carsEntered}</strong></div>
        <div class="stat-row"><span>Police Evaded:</span> <strong>${stats.copsEvaded}</strong></div>
        <div class="stat-row"><span>Traffic Collisions:</span> <strong>${stats.collisions}</strong></div>
      `;
    }
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
    gameHUD.showNotification('Welcome to Retro City! WASD to move, F to enter cars');
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Update Player
    this.player.update(dt, this.map, this.vehicles);

    // 2. Update Vehicles
    for (const v of this.vehicles) {
      v.update(dt, this.map, this.particles, this.skidMarks);
    }

    // 3. Update AI Traffic
    this.traffic.update(dt, this.player, (type, entity) => {
      this.police.triggerCrime(1, 'Hit & Run Traffic Incident!');
    });

    // 4. Update Police Pursuit
    this.police.update(dt, this.player, (cop) => {
      // Impact with police cruiser
    });

    // 5. Update Particles
    this.particles.update(dt);

    // 6. Smooth Camera Follow
    const target = this.player.isInVehicle ? this.player.currentVehicle : this.player;
    this.camera.x += (target.x - this.camera.x) * CONFIG.CAMERA_SMOOTHING;
    this.camera.y += (target.y - this.camera.y) * CONFIG.CAMERA_SMOOTHING;

    // 7. Sync HUD
    if (this.player.isInVehicle) {
      const mph = Math.abs(this.player.currentVehicle.speed) * 0.25;
      gameHUD.updateSpeed(mph, true);
    } else {
      gameHUD.updateSpeed(0, false);
    }
    gameHUD.updateCash(storage.getCash());
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Center camera on screen
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Map Layer (Ground, Roads, Buildings, Pickups)
    this.map.render(ctx, this.camera);

    // 2. Skid Marks on Asphalt
    this.skidMarks.render(ctx);

    // 3. Parked and Player-Driven Vehicles
    for (const v of this.vehicles) {
      v.render(ctx);
    }

    // 4. Civilian Traffic & Pedestrians
    this.traffic.render(ctx);

    // 5. Police Pursuit Squads
    this.police.render(ctx);

    // 6. Player Character (rendered on foot)
    this.player.render(ctx);

    // 7. Smoke Particles
    this.particles.render(ctx);

    ctx.restore();

    // 8. Radar Mini-Map
    this.minimap.render(this.map, this.player, this.vehicles, this.traffic, this.police);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new RetroOutlawGame();
  game.start();
});
