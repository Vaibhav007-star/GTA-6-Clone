/**
 * Master 3D Game Coordinator & Engine Loop
 * Powered by Three.js WebGL with dynamic lighting, shadows, and third-person chase camera.
 * Features:
 * - Real-time 80s procedural radio station switcher (Flash FM, Wave 103, V-Rock)
 * - Dynamic Day / Night & Weather atmosphere cycle (Sunset Dusk, Midnight Neon, Tropical Noon)
 * - Multi-angle cameras: Chase Follow, First-Person Hood, Aerial Tactical View
 * - Nitro boost with camera FOV punch and twin exhaust flames
 * - Chop Shop / Pay 'n' Spray vehicle respray, repair, and police cooldown
 * - Full 3D ballistic weapon combat & projectile hit-registration
 * - Insane stunt jump airtime detector
 */

class RetroOutlaw3D {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('game-canvas');

    this.isPaused = false;
    this.clock = new THREE.Clock();

    // Atmosphere modes: 0 = Sunset Dusk, 1 = Midnight Neon, 2 = Tropical Noon
    this.timeModes = [
      { name: '🌅 DUSK', bg: 0x221336, fog: 0x221336, sunColor: 0xffb142, sunIntensity: 1.9, ambColor: 0x70528c, ambIntensity: 1.2 },
      { name: '🌃 MIDNIGHT', bg: 0x090a14, fog: 0x090a14, sunColor: 0x1e3799, sunIntensity: 0.6, ambColor: 0x2c2c54, ambIntensity: 0.7 },
      { name: '☀️ NOON', bg: 0x48dbfb, fog: 0x81ecec, sunColor: 0xfffa65, sunIntensity: 2.2, ambColor: 0xdfe6e9, ambIntensity: 1.4 }
    ];
    this.currentTimeIndex = 0;

    // Camera modes: 0 = CHASE, 1 = HOOD, 2 = AERIAL
    this.cameraModes = ['🎥 CHASE', '🚘 HOOD', '🚁 AERIAL'];
    this.currentCamIndex = 0;

    this.initThree();
    this.initWorld();
    this.setupResize();
    this.setupControls();

    gameHUD.updateCash(storage.getCash());
    gameHUD.updateHealthArmor(this.player.health, this.player.armor);
  }

  initThree() {
    const tm = this.timeModes[this.currentTimeIndex];

    // 1. Scene & Atmosphere Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(tm.bg);
    this.scene.fog = new THREE.FogExp2(tm.fog, 0.0011);

    // 2. Camera & Orbit Angles
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1.0, 4200);
    this.cameraYaw = 0;
    this.cameraPitch = 0.32;
    this.camera.position.set(2650, 22, 1460);

    // 3. WebGL Renderer (Optimized for RTX 3050)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting Setup
    this.ambientLight = new THREE.AmbientLight(tm.ambColor, tm.ambIntensity);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xff9f43, 0x0abde3, 0.6);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(tm.sunColor, tm.sunIntensity);
    this.sunLight.position.set(2000, 480, 800);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 1800;
    const d = 500;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  initWorld() {
    this.map = new CityMap3D(this.scene);

    // Spawn Player on Ocean Drive (X: 2650, Z: 1450)
    this.player = new Player3D(this.scene, 2650, 1450);
    this.vehicles = [];

    // Parked Drivable Vehicles across authentic Vice City locations
    const spawns = [
      { x: 2650, z: 1400, type: 'SPORTS', angle: 0, color: '#e74c3c' },         // Venom GT on Ocean Drive
      { x: 2650, z: 900, type: 'SPORTS', angle: Math.PI, color: '#f1c40f' },     // Yellow GT near The Beacon
      { x: 1750, z: 1460, type: 'MUSCLE', angle: Math.PI / 2, color: '#ecf0f1' },// Tommy Vercetti's White Muscle Car
      { x: 620, z: 2450, type: 'SPORTS', angle: 0.28, color: '#9b59b6' },        // Drag Supercar on Escobar Airport Runway
      { x: 1250, z: 2050, type: 'MUSCLE', angle: 0, color: '#e67e22' },         // Heavy Muscle Car at Viceport Cargo Docks
      { x: 850, z: 850, type: 'SEDAN', angle: 0, color: '#f39c12' },            // Taxi Cab Downtown Financial District
      { x: 1200, z: 800, type: 'POLICE', angle: -Math.PI / 2, color: '#1a1a1a' },// Police Cruiser at North Causeway
      { x: 2380, z: 2650, type: 'SEDAN', angle: 0, color: '#2980b9' }           // Marina Luxury Cruiser
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
    input.onRadioToggle = () => this.toggleRadio();
    input.onTimeToggle = () => this.toggleTimeOfDay();
    input.onCamToggle = () => this.toggleCameraMode();

    input.onMuteToggle = () => {
      const muted = audio.toggleMute();
      gameHUD.showNotification(muted ? 'Sound Muted' : 'Sound Enabled');
    };

    // UI Buttons
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

    const btnTime = document.getElementById('btn-toggle-time');
    if (btnTime) btnTime.addEventListener('click', () => this.toggleTimeOfDay());

    const btnCam = document.getElementById('btn-toggle-cam');
    if (btnCam) btnCam.addEventListener('click', () => this.toggleCameraMode());

    const btnRespray = document.getElementById('btn-respray');
    if (btnRespray) btnRespray.addEventListener('click', () => this.triggerRespray());

    const radioBadge = document.getElementById('hud-radio-badge');
    if (radioBadge) radioBadge.addEventListener('click', () => this.toggleRadio());

    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        storage.resetAll();
        window.location.reload();
      });
    }
  }

  toggleRadio() {
    const station = audio.nextStation();
    gameHUD.updateRadio(station);
  }

  toggleTimeOfDay() {
    this.currentTimeIndex = (this.currentTimeIndex + 1) % this.timeModes.length;
    const tm = this.timeModes[this.currentTimeIndex];

    this.scene.background.setHex(tm.bg);
    this.scene.fog.color.setHex(tm.fog);
    this.ambientLight.color.setHex(tm.ambColor);
    this.ambientLight.intensity = tm.ambIntensity;
    this.sunLight.color.setHex(tm.sunColor);
    this.sunLight.intensity = tm.sunIntensity;

    const btn = document.getElementById('btn-toggle-time');
    if (btn) btn.textContent = tm.name;
    gameHUD.showNotification(`Atmosphere: ${tm.name}`);
  }

  toggleCameraMode() {
    this.currentCamIndex = (this.currentCamIndex + 1) % this.cameraModes.length;
    const modeName = this.cameraModes[this.currentCamIndex];

    const btn = document.getElementById('btn-toggle-cam');
    if (btn) btn.textContent = modeName;
    gameHUD.showNotification(`Camera Mode: ${modeName}`);
  }

  triggerRespray() {
    if (this.player.isInVehicle) {
      this.player.currentVehicle.respray();
      this.police.setWantedLevel(0);
      gameHUD.showNotification("CHOP SHOP: Vehicle Resprayed & Repaired! Wanted Level Cleared.");
    } else {
      gameHUD.showNotification("Enter a car to respray and repair!");
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
        gameHUD.updateRadio(audio.currentStation);
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
    gameHUD.showNotification('Welcome to Vice City! Press Shift for Nitro Boost, R for 80s Radio, C for Camera (WASD / Mouse)');
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
    // 1. Update Map Collectibles & Animated Props
    this.map.update(dt, this.player);

    // 2. Update Player with Camera-Relative Orientation
    this.player.update(dt, this.map, this.vehicles, this.camera);
    if (window.combatSystem) {
      this.player.setHeldWeapon(window.combatSystem.currentWeapon.id);
    }

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

    // 6. Update 3D Combat Ballistics
    if (window.combatSystem) {
      window.combatSystem.update(dt, this);
    }

    // 7. Update Missions
    if (window.missionSystem) {
      const dummyGame = { player: { isInVehicle: this.player.isInVehicle, currentVehicle: this.player.currentVehicle ? { x: this.player.currentVehicle.x, y: this.player.currentVehicle.z } : null, x: this.player.x, y: this.player.z }, police: { wantedLevel: this.police.wantedLevel } };
      window.missionSystem.update(dt, dummyGame);
    }

    // 8. Third-Person Chase & Free-Look Camera
    this.updateCamera(dt);

    // 9. Sync HUD (Speed, NOS, Health, Cash)
    if (this.player.isInVehicle) {
      const car = this.player.currentVehicle;
      const mph = Math.abs(car.speed) * 0.5;
      gameHUD.updateSpeed(mph, true);
      gameHUD.updateNOS(car.nos, car.isBoosting);

      // Check Chop Shop Pay 'n' Spray
      if (this.map.checkPayAndSpray(car.x, car.z)) {
        if (car.health < 100 || this.police.wantedLevel > 0) {
          car.respray();
          this.police.setWantedLevel(0);
          gameHUD.showNotification("CHOP SHOP: Vehicle Resprayed & Repaired! Wanted Level Cleared.");
        }
      }
    } else {
      gameHUD.updateSpeed(0, false);
      gameHUD.updateHealthArmor(this.player.health, this.player.armor);
    }
    gameHUD.updateCash(storage.getCash());
  }

  updateCamera(dt) {
    // Mouse Drag / Pointer Look Delta
    if (input.mouseDelta.x !== 0 || input.mouseDelta.y !== 0) {
      this.cameraYaw -= input.mouseDelta.x * 0.004;
      this.cameraPitch = Math.max(-0.08, Math.min(1.05, this.cameraPitch + input.mouseDelta.y * 0.0035));
      input.mouseDelta.x = 0;
      input.mouseDelta.y = 0;
    }

    let targetX, targetY, targetZ;
    const isCar = this.player.isInVehicle;
    const car = isCar ? this.player.currentVehicle : null;

    if (isCar) {
      targetX = car.x;
      targetY = car.y + 3.0;
      targetZ = car.z;
    } else {
      targetX = this.player.x;
      targetY = this.player.y + 4.5;
      targetZ = this.player.z;
    }

    // FOV Punch for Nitro Boost
    const targetFOV = (isCar && car.isBoosting) ? 74 : 60;
    this.camera.fov += (targetFOV - this.camera.fov) * 0.12;
    this.camera.updateProjectionMatrix();

    if (this.currentCamIndex === 1) {
      // 1. HOOD / FIRST-PERSON CAMERA
      if (isCar) {
        const frontDist = car.length * 0.45;
        const camX = targetX + Math.sin(car.angle) * frontDist;
        const camZ = targetZ + Math.cos(car.angle) * frontDist;
        const camY = car.y + 4.5;

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(targetX + Math.sin(car.angle) * 80, camY, targetZ + Math.cos(car.angle) * 80);
      } else {
        const camY = this.player.y + 7.5;
        this.camera.position.set(targetX, camY, targetZ);
        this.camera.lookAt(
          targetX + Math.sin(this.cameraYaw) * 60,
          camY - Math.sin(this.cameraPitch) * 40,
          targetZ + Math.cos(this.cameraYaw) * 60
        );
      }
    } else if (this.currentCamIndex === 2) {
      // 2. AERIAL TACTICAL VIEW
      const height = 180;
      this.camera.position.x += (targetX - this.camera.position.x) * 0.15;
      this.camera.position.y += (targetY + height - this.camera.position.y) * 0.15;
      this.camera.position.z += (targetZ + 30 - this.camera.position.z) * 0.15;
      this.camera.lookAt(targetX, targetY, targetZ);
    } else {
      // 0. CHASE CAMERA (Default)
      if (isCar) {
        // Align camera yaw smoothly behind car direction
        let angleDiff = car.angle - this.cameraYaw;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        this.cameraYaw += angleDiff * Math.min(1.0, 3.8 * dt);

        const dist = 48.0 + Math.abs(car.speed) * 0.14;
        const height = 18.0 + Math.sin(this.cameraPitch) * 16.0;

        const camX = targetX - Math.sin(this.cameraYaw) * dist;
        const camZ = targetZ - Math.cos(this.cameraYaw) * dist;

        this.camera.position.x += (camX - this.camera.position.x) * 0.16;
        this.camera.position.y += (targetY + height - this.camera.position.y) * 0.16;
        this.camera.position.z += (camZ - this.camera.position.z) * 0.16;

        this.camera.lookAt(targetX, targetY + 2.0, targetZ);
      } else {
        const dist = 32.0;
        const height = 14.0 + Math.sin(this.cameraPitch) * 14.0;

        const camX = targetX - Math.sin(this.cameraYaw) * dist;
        const camZ = targetZ - Math.cos(this.cameraYaw) * dist;

        this.camera.position.x += (camX - this.camera.position.x) * 0.18;
        this.camera.position.y += (targetY + height - this.camera.position.y) * 0.18;
        this.camera.position.z += (camZ - this.camera.position.z) * 0.18;

        this.camera.lookAt(targetX, targetY + 2.0, targetZ);
      }
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
  window.retroGame = game;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame3D);
} else {
  initGame3D();
}
