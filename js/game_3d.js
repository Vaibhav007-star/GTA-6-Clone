/**
 * Master 3D Game Coordinator & Engine Loop
 * Powered by Three.js WebGL with dynamic lighting, shadows, and third-person chase camera.
 */

class RetroOutlaw3D {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('game-canvas');

    this.isPaused = false;
    this.clock = new THREE.Clock();

    this.initThree();
    this.initWorld();
    this.setupResize();
    this.setupControls();

    gameHUD.updateCash(storage.getCash());
  }

  initThree() {
    // 1. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x131a26); // Retro dusk sky
    this.scene.fog = new THREE.FogExp2(0x131a26, 0.0016);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1.0, 3000);
    this.camera.position.set(750, 25, 710);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting
    const ambient = new THREE.AmbientLight(0x5c7c99, 1.1);
    this.scene.add(ambient);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    this.sunLight.position.set(600, 450, 400);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1500;
    const d = 400;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  initWorld() {
    this.map = new CityMap3D(this.scene);
    this.player = new Player3D(this.scene, 750, 750);
    this.vehicles = [];

    // Parked Drivable Cars
    const spawns = [
      { x: 750, z: 700, type: 'SPORTS', angle: 0, color: '#e74c3c' },
      { x: 800, z: 750, type: 'SEDAN', angle: Math.PI / 2, color: '#2980b9' },
      { x: 1300, z: 700, type: 'MUSCLE', angle: Math.PI, color: '#f39c12' },
      { x: 1850, z: 1300, type: 'POLICE', angle: -Math.PI / 2, color: '#1a1a1a' },
      { x: 750, z: 1300, type: 'SEDAN', angle: 0, color: '#16a085' },
      { x: 1300, z: 1850, type: 'SPORTS', angle: Math.PI / 2, color: '#9b59b6' }
    ];

    for (const s of spawns) {
      this.vehicles.push(new Vehicle3D(this.scene, s.x, s.z, s.type, s.angle, s.color));
    }

    this.traffic = new TrafficManager3D(this.scene);
    this.police = new PoliceDispatcher3D(this.scene);
    this.minimap = new MiniMap('radar-canvas');
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setupControls() {
    input.onActionPress = () => this.toggleVehicleInteraction();
    input.onPauseToggle = () => this.togglePause();
    input.onMuteToggle = () => {
      const muted = audio.toggleMute();
      gameHUD.showNotification(muted ? 'Sound Muted' : 'Sound Enabled');
    };

    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

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

  spawnVehicle(vehicleId) {
    const vData = dataManager.getVehicleById(vehicleId);
    const target = this.player.isInVehicle ? this.player.currentVehicle : this.player;
    const typeKey = vData.id.includes('sports') ? 'SPORTS' : (vData.id.includes('muscle') ? 'MUSCLE' : (vData.id.includes('police') ? 'POLICE' : 'SEDAN'));
    const color = vData.colors ? vData.colors[0] : (vData.defaultColor || '#e74c3c');

    const v = new Vehicle3D(this.scene, target.x + 18, target.z + 18, typeKey, target.angle, color);
    v.name = vData.name;
    this.vehicles.push(v);
    gameHUD.showNotification(`Spawned 3D ${vData.name}!`);
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

    const missionContainer = document.getElementById('pause-missions-list');
    if (missionContainer) {
      const missions = dataManager.getMissions();
      missionContainer.innerHTML = missions.map(m => `
        <div class="launcher-item">
          <div class="launcher-info">
            <strong>${m.title}</strong>
            <small>Reward: +$${m.rewardCash} • ${m.description}</small>
          </div>
          <button class="btn-launcher" onclick="window.missionSystem.startMission('${m.id}'); window.retroGame3D.togglePause();">START</button>
        </div>
      `).join('');
    }

    const vehicleContainer = document.getElementById('pause-vehicles-list');
    if (vehicleContainer) {
      const vehicles = dataManager.getVehicles();
      vehicleContainer.innerHTML = vehicles.map(v => `
        <div class="launcher-item">
          <div class="launcher-info">
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${v.colors ? v.colors[0] : (v.defaultColor || '#3498db')}; margin-right:6px;"></span>
            <strong>${v.name}</strong> (${v.category})
            <small>Top Speed: ${v.maxSpeed} MPH • Accel: ${v.acceleration}</small>
          </div>
          <button class="btn-launcher" onclick="window.retroGame3D.spawnVehicle('${v.id}'); window.retroGame3D.togglePause();">SPAWN</button>
        </div>
      `).join('');
    }
  }

  start() {
    this.clock.start();
    this.loop();
    gameHUD.showNotification('Welcome to Retro City 3D! WASD to drive, F to enter cars');
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isPaused) {
      this.update(dt);
    }

    this.renderer.render(this.scene, this.camera);

    // MiniMap 2D Radar Overlay
    if (this.minimap) {
      const dummyMap = { roadWidth: this.map.roadWidth, roads: this.map.roads, cashPickups: this.map.cashPickups.map(p => ({ x: p.x, y: p.z, collected: p.collected })) };
      const dummyPlayer = { x: this.player.x, y: this.player.z, angle: this.player.angle, isInVehicle: this.player.isInVehicle, currentVehicle: this.player.currentVehicle ? { x: this.player.currentVehicle.x, y: this.player.currentVehicle.z, angle: this.player.currentVehicle.angle } : null };
      const dummyVehicles = this.vehicles.map(v => ({ x: v.x, y: v.z, isDrivenByPlayer: v.isDrivenByPlayer }));
      const dummyTraffic = { vehicles: this.traffic.vehicles.map(v => ({ x: v.x, y: v.z })) };
      const dummyPolice = { policeUnits: this.police.policeUnits.map(p => ({ x: p.x, y: p.z })) };

      this.minimap.render(dummyMap, dummyPlayer, dummyVehicles, dummyTraffic, dummyPolice);
    }
  }

  update(dt) {
    // 1. Update Map Collectibles
    this.map.update(dt, this.player);

    // 2. Update Player
    this.player.update(dt, this.map, this.vehicles);

    // 3. Update Vehicles
    for (const v of this.vehicles) {
      v.update(dt, this.map, null);
    }

    // 4. Update AI Traffic
    this.traffic.update(dt, this.player, () => {
      this.police.triggerCrime(1, 'Traffic Collision in 3D!');
    });

    // 5. Update Police Pursuit
    this.police.update(dt, this.player, () => {});

    // 6. Update Missions
    if (window.missionSystem) {
      const dummyGame = { player: { isInVehicle: this.player.isInVehicle, currentVehicle: this.player.currentVehicle ? { x: this.player.currentVehicle.x, y: this.player.currentVehicle.z } : null, x: this.player.x, y: this.player.z }, police: { wantedLevel: this.police.wantedLevel } };
      window.missionSystem.update(dt, dummyGame);
    }

    // 7. Third-Person Chase Camera
    this.updateCamera(dt);

    // 8. Sync HUD
    if (this.player.isInVehicle) {
      const mph = Math.abs(this.player.currentVehicle.speed) * 0.5;
      gameHUD.updateSpeed(mph, true);
    } else {
      gameHUD.updateSpeed(0, false);
    }
    gameHUD.updateCash(storage.getCash());
  }

  updateCamera(dt) {
    let targetX, targetY, targetZ, heading;

    if (this.player.isInVehicle) {
      const car = this.player.currentVehicle;
      targetX = car.x;
      targetY = car.y + 4.0;
      targetZ = car.z;
      heading = car.angle;

      // Dynamic pull back based on speed
      const dist = 45.0 + Math.abs(car.speed) * 0.15;
      const height = 22.0 + Math.abs(car.speed) * 0.05;

      const camX = targetX - Math.sin(heading) * dist;
      const camZ = targetZ - Math.cos(heading) * dist;

      this.camera.position.x += (camX - this.camera.position.x) * 0.12;
      this.camera.position.y += (targetY + height - this.camera.position.y) * 0.12;
      this.camera.position.z += (camZ - this.camera.position.z) * 0.12;

      this.camera.lookAt(targetX, targetY + 2.0, targetZ);
    } else {
      targetX = this.player.x;
      targetY = this.player.y + 6.0;
      targetZ = this.player.z;
      heading = this.player.angle;

      const dist = 32.0;
      const height = 18.0;

      const camX = targetX - Math.sin(heading) * dist;
      const camZ = targetZ - Math.cos(heading) * dist;

      this.camera.position.x += (camX - this.camera.position.x) * 0.14;
      this.camera.position.y += (targetY + height - this.camera.position.y) * 0.14;
      this.camera.position.z += (camZ - this.camera.position.z) * 0.14;

      this.camera.lookAt(targetX, targetY + 2.0, targetZ);
    }

    // Direct sunlight follows player region for consistent shadows
    this.sunLight.position.set(targetX + 300, 450, targetZ + 250);
    this.sunLight.target.position.set(targetX, 0, targetZ);
    this.sunLight.target.updateMatrixWorld();
  }
}

function initGame3D() {
  if (window.__retroGame3DInitialized) return;
  window.__retroGame3DInitialized = true;
  const game = new RetroOutlaw3D();
  game.start();
  window.retroGame3D = game;
  window.retroGame = game; // Fallback reference for controls/hud
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame3D);
} else {
  initGame3D();
}
