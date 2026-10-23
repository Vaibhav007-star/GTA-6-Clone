/**
 * 3D Vehicle Engine with Arcade Drifting, NOS Boost, Suspension & Stunts
 * Procedural 3D models for:
 * - Mahindra Thar 4x4 (Chunky tires, roll cage, rear spare tire)
 * - Tuk-Tuk Auto Rickshaw (Iconic 3-wheeler, yellow/green canopy)
 * - Royal Enfield Bullet 350 (2-wheeler cruiser motorcycle)
 * - Scorpio Classic Boss (Heavy SUV, front bullbar, roof carrier)
 * - Tata Highway Truck (Horn OK Please goods carrier, 6 wheels)
 * - Exotic Sports (Venom GT), Muscle V8, Police Interceptor, Sedan
 */

class Vehicle3D {
  constructor(scene, x, z, typeKey = 'SEDAN', angle = 0, customColor = null) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vy = 0;
    this.angle = angle;
    this.pitch = 0;
    this.typeKey = typeKey;

    const profile = CONFIG.VEHICLE_TYPES[typeKey] || CONFIG.VEHICLE_TYPES.SEDAN;
    this.name = profile.name;
    this.width = profile.width * 0.35;
    this.length = profile.height * 0.35;
    this.height = 7.5;
    this.baseMaxSpeed = profile.maxSpeed * 0.55;
    this.maxSpeed = this.baseMaxSpeed;
    this.reverseSpeed = profile.reverseSpeed * 0.55;
    this.acceleration = profile.acceleration * 0.55;
    this.braking = profile.braking * 0.55;
    this.turnRate = profile.turnRate;
    this.friction = profile.friction * 0.45;
    this.driftFriction = profile.driftFriction;
    this.colorHex = customColor ? parseInt(customColor.replace('#', '0x')) : parseInt((profile.defaultColor || '#2980b9').replace('#', '0x'));

    this.speed = 0;
    this.vx = 0;
    this.vz = 0;
    this.steerAngle = 0;
    this.isDrivenByPlayer = false;
    this.isDrifting = false;
    this.isBoosting = false;
    this.health = 100;
    this.nos = 100;
    this.airtime = 0;
    this.isAirborne = false;

    this.sirenTimer = 0;
    this.sirenState = false;

    this.meshGroup = new THREE.Group();
    this.wheels = [];
    this.frontWheels = [];

    this.buildMesh();
    this.scene.add(this.meshGroup);
  }

  buildMesh() {
    if (this.typeKey === 'AUTO_RICKSHAW') {
      this.buildAutoRickshawMesh();
    } else if (this.typeKey === 'BULLET_350') {
      this.buildMotorcycleMesh();
    } else {
      this.buildStandardCarMesh();
    }
  }

  /* =========================================================================
   * 1. DESI AUTO RICKSHAW (3-WHEELER)
   * ========================================================================= */
  buildAutoRickshawMesh() {
    const w = this.width;
    const l = this.length;

    // Lower Body Tub (Green)
    const tubGeo = new THREE.BoxGeometry(w, 3.2, l * 0.9);
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.6 });
    this.body = new THREE.Mesh(tubGeo, this.bodyMat);
    this.body.position.y = 2.6;
    this.body.castShadow = true;
    this.meshGroup.add(this.body);

    // Yellow Curved Canvas Canopy Roof
    const roofGeo = new THREE.BoxGeometry(w * 0.95, 3.8, l * 0.7);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 5.8, -l * 0.08);
    roof.castShadow = true;
    this.meshGroup.add(roof);

    // Front Windshield & Handlebar Cockpit
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, transparent: true, opacity: 0.75 });
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, 2.4), glassMat);
    ws.position.set(0, 5.2, l * 0.28);
    this.meshGroup.add(ws);

    // Single Central Front Headlight
    const hl = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfffa65 }));
    hl.position.set(0, 3.2, l * 0.46);
    this.meshGroup.add(hl);

    // NOS Flame
    this.initFlames(w, l);

    // 3 Wheels: 1 Front Center, 2 Rear
    const wRadius = 1.5;
    const wGeo = new THREE.CylinderGeometry(wRadius, wRadius, 0.9, 12);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Front Wheel (Steered)
    const fwHub = new THREE.Group();
    fwHub.position.set(0, wRadius, l * 0.38);
    const fwMesh = new THREE.Mesh(wGeo, wMat);
    fwMesh.rotation.z = Math.PI / 2;
    fwHub.add(fwMesh);
    this.meshGroup.add(fwHub);
    this.wheels.push(fwMesh);
    this.frontWheels.push(fwHub);

    // Rear Wheels
    [-w / 2 - 0.2, w / 2 + 0.2].forEach(rx => {
      const rwHub = new THREE.Group();
      rwHub.position.set(rx, wRadius, -l * 0.3);
      const rwMesh = new THREE.Mesh(wGeo, wMat);
      rwMesh.rotation.z = Math.PI / 2;
      rwHub.add(rwMesh);
      this.meshGroup.add(rwHub);
      this.wheels.push(rwMesh);
    });

    this.syncPosition();
  }

  /* =========================================================================
   * 2. ROYAL ENFIELD BULLET 350 (2-WHEELER CRUISER)
   * ========================================================================= */
  buildMotorcycleMesh() {
    const l = this.length;

    // Tubular Steel Bike Frame & Engine Block
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.95, roughness: 0.1 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, l * 0.65), frameMat);
    frame.position.y = 3.0;
    frame.castShadow = true;
    this.meshGroup.add(frame);

    // Chrome Cylinder Head Engine Block
    const eng = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 3.2), chromeMat);
    eng.position.set(0, 2.4, 0.4);
    this.meshGroup.add(eng);

    // Teardrop Fuel Tank
    this.bodyMat = new THREE.MeshStandardMaterial({ color: this.colorHex, metalness: 0.7, roughness: 0.3 });
    this.body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 4.8, 12), this.bodyMat);
    this.body.rotation.x = Math.PI / 2;
    this.body.position.set(0, 4.4, 1.2);
    this.meshGroup.add(this.body);

    // Black Leather Cruiser Saddle Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 3.6), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    seat.position.set(0, 4.2, -1.8);
    this.meshGroup.add(seat);

    // Raised Chrome Handlebars
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.0, 8), chromeMat);
    hb.rotation.z = Math.PI / 2;
    hb.position.set(0, 5.8, 3.2);
    this.meshGroup.add(hb);

    // Bullet Chrome Round Headlight
    const hl = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfffa65 }));
    hl.position.set(0, 5.0, l * 0.46);
    this.meshGroup.add(hl);

    // Chrome Long Exhaust Pipe
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, l * 0.65, 8), chromeMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(1.4, 1.8, -1.2);
    this.meshGroup.add(ex);

    // NOS Flame
    this.initFlames(2.0, l);

    // 2 Wheels: 1 Front, 1 Rear
    const wRadius = 2.0;
    const wGeo = new THREE.CylinderGeometry(wRadius, wRadius, 0.8, 14);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });

    // Front Wheel (Steered)
    const fwHub = new THREE.Group();
    fwHub.position.set(0, wRadius, l * 0.42);
    const fwMesh = new THREE.Mesh(wGeo, wMat);
    fwMesh.rotation.z = Math.PI / 2;
    fwHub.add(fwMesh);
    this.meshGroup.add(fwHub);
    this.wheels.push(fwMesh);
    this.frontWheels.push(fwHub);

    // Rear Wheel
    const rwHub = new THREE.Group();
    rwHub.position.set(0, wRadius, -l * 0.42);
    const rwMesh = new THREE.Mesh(wGeo, wMat);
    rwMesh.rotation.z = Math.PI / 2;
    rwHub.add(rwMesh);
    this.meshGroup.add(rwHub);
    this.wheels.push(rwMesh);

    this.syncPosition();
  }

  /* =========================================================================
   * 3. STANDARD CARS, MAHINDRA THAR, SCORPIO, TATA TRUCK
   * ========================================================================= */
  buildStandardCarMesh() {
    const w = this.width;
    const l = this.length;
    const h = (this.typeKey === 'THAR' || this.typeKey === 'SCORPIO') ? 5.8 : (this.typeKey === 'DESI_TRUCK' ? 7.5 : 4.5);

    // 1. Main Chassis
    const bodyGeo = new THREE.BoxGeometry(w, h, l);
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      metalness: 0.55,
      roughness: 0.35
    });
    this.body = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.body.position.y = h / 2 + 1.2;
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.meshGroup.add(this.body);

    // 2. Cabin & Roof
    const cabinH = (this.typeKey === 'THAR' || this.typeKey === 'SCORPIO') ? 4.2 : 3.8;
    const cabinL = l * 0.55;
    const cabinW = w * 0.85;
    const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: this.typeKey === 'POLICE' ? 0xffffff : (this.typeKey === 'THAR' ? 0x111111 : 0x1e272e),
      roughness: 0.4
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, h + cabinH / 2 + 0.8, -l * 0.05);
    cabin.castShadow = true;
    this.meshGroup.add(cabin);

    // 3. Indian Thar 4x4 Special: Rear External Spare Tire & Front Grille
    if (this.typeKey === 'THAR') {
      const spareGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.3, 14);
      const spareMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      const spare = new THREE.Mesh(spareGeo, spareMat);
      spare.rotation.x = Math.PI / 2;
      spare.position.set(0, h / 2 + 2.5, -l / 2 - 0.7);
      this.meshGroup.add(spare);
    }

    // 4. Scorpio & Truck Special: Front Heavy Bullbar & Roof Carrier
    if (this.typeKey === 'SCORPIO' || this.typeKey === 'DESI_TRUCK') {
      const bbGeo = new THREE.BoxGeometry(w * 0.9, 2.5, 1.2);
      const bbMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
      const bullbar = new THREE.Mesh(bbGeo, bbMat);
      bullbar.position.set(0, 3.2, l / 2 + 0.6);
      this.meshGroup.add(bullbar);

      // Roof Carrier Rack
      const rackGeo = new THREE.BoxGeometry(cabinW * 0.9, 1.0, cabinL * 0.85);
      const rack = new THREE.Mesh(rackGeo, bbMat);
      rack.position.set(0, h + cabinH + 1.2, -l * 0.05);
      this.meshGroup.add(rack);
    }

    // 5. Headlights
    const hlGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });

    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.position.set(-w * 0.38, this.body.position.y + 0.5, l / 2 + 0.2);
    this.meshGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, hlMat);
    hlRight.position.set(w * 0.38, this.body.position.y + 0.5, l / 2 + 0.2);
    this.meshGroup.add(hlRight);

    // Headlight Spotlight
    this.headlight = new THREE.SpotLight(0xfffa65, 1.8, 140, Math.PI / 6, 0.4);
    this.headlight.position.set(0, this.body.position.y + 1, l / 2);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0, l / 2 + 40);
    this.meshGroup.add(this.headlight);
    this.meshGroup.add(this.headlightTarget);
    this.headlight.target = this.headlightTarget;

    // 6. Taillights
    const tlGeo = new THREE.BoxGeometry(2.0, 1.0, 0.5);
    this.tlMat = new THREE.MeshBasicMaterial({ color: 0xc0392b });

    const tlLeft = new THREE.Mesh(tlGeo, this.tlMat);
    tlLeft.position.set(-w * 0.38, this.body.position.y + 0.5, -l / 2 - 0.1);
    this.meshGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, this.tlMat);
    tlRight.position.set(w * 0.38, this.body.position.y + 0.5, -l / 2 - 0.1);
    this.meshGroup.add(tlRight);

    // NOS Flames
    this.initFlames(w, l);

    // 7. Wheels
    const isTruck = this.typeKey === 'DESI_TRUCK';
    const isThar = this.typeKey === 'THAR';
    const wheelRadius = isThar ? 2.4 : (isTruck ? 2.5 : 1.8);
    const wheelWidth = isThar ? 1.4 : 1.0;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    const wheelOffsets = [
      { x: -w / 2 - 0.2, z: l * 0.32, isFront: true },
      { x: w / 2 + 0.2, z: l * 0.32, isFront: true },
      { x: -w / 2 - 0.2, z: -l * 0.32, isFront: false },
      { x: w / 2 + 0.2, z: -l * 0.32, isFront: false }
    ];

    // Truck gets extra dual rear axle
    if (isTruck) {
      wheelOffsets.push({ x: -w / 2 - 0.2, z: -l * 0.16, isFront: false });
      wheelOffsets.push({ x: w / 2 + 0.2, z: -l * 0.16, isFront: false });
    }

    for (const off of wheelOffsets) {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(off.x, wheelRadius, off.z);

      const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wMesh.rotation.z = Math.PI / 2;
      wMesh.castShadow = true;
      wheelHub.add(wMesh);

      this.meshGroup.add(wheelHub);
      this.wheels.push(wMesh);

      if (off.isFront) {
        this.frontWheels.push(wheelHub);
      }
    }

    // Police Strobes
    if (this.typeKey === 'POLICE') {
      const barGeo = new THREE.BoxGeometry(w * 0.6, 1.2, 1.8);
      const barMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, cabin.position.y + cabinH / 2 + 0.7, cabin.position.z);
      this.meshGroup.add(bar);

      this.redLightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      this.redLightMesh.position.set(-w * 0.2, bar.position.y, bar.position.z);
      this.meshGroup.add(this.redLightMesh);

      this.blueLightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.4), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
      this.blueLightMesh.position.set(w * 0.2, bar.position.y, bar.position.z);
      this.meshGroup.add(this.blueLightMesh);
    }

    this.syncPosition();
  }

  initFlames(w, l) {
    const flameGeo = new THREE.ConeGeometry(0.9, 5.0, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3 });

    this.flameLeft = new THREE.Mesh(flameGeo, flameMat);
    this.flameLeft.rotation.x = -Math.PI / 2;
    this.flameLeft.position.set(-w * 0.25, 1.5, -l / 2 - 2.5);
    this.flameLeft.visible = false;
    this.meshGroup.add(this.flameLeft);

    this.flameRight = new THREE.Mesh(flameGeo, flameMat);
    this.flameRight.rotation.x = -Math.PI / 2;
    this.flameRight.position.set(w * 0.25, 1.5, -l / 2 - 2.5);
    this.flameRight.visible = false;
    this.meshGroup.add(this.flameRight);
  }

  syncPosition() {
    this.meshGroup.position.set(this.x, this.y, this.z);
    this.meshGroup.rotation.y = this.angle;
    this.meshGroup.rotation.x = this.pitch;
  }

  respray(colorHex = null) {
    const palette = [0xff7675, 0x00d2d3, 0xf1c40f, 0xe84393, 0x9b59b6, 0xffffff, 0x1abc9c, 0xe67e22, 0x111111];
    this.colorHex = colorHex || palette[Math.floor(Math.random() * palette.length)];
    if (this.bodyMat) this.bodyMat.color.setHex(this.colorHex);
    this.health = 100;
    this.nos = 100;
    audio.playPayAndSpray();
  }

  update(dt, cityMap, particles) {
    if (this.typeKey === 'POLICE') {
      this.sirenTimer += dt;
      if (this.sirenTimer >= 0.16) {
        this.sirenTimer = 0;
        this.sirenState = !this.sirenState;
        if (this.redLightMesh) this.redLightMesh.material.color.setHex(this.sirenState ? 0xff1e27 : 0x440000);
        if (this.blueLightMesh) this.blueLightMesh.material.color.setHex(!this.sirenState ? 0x0066ff : 0x000044);
      }
    }

    if (this.isDrivenByPlayer) {
      this.handlePlayerInput(dt, particles);
    } else {
      if (Math.abs(this.speed) > 0.01) {
        const decel = this.friction * dt;
        if (this.speed > 0) this.speed = Math.max(0, this.speed - decel);
        else this.speed = Math.min(0, this.speed + decel);
      }
    }

    // NOS Flame flicker & recharge
    if (this.isBoosting) {
      if (this.flameLeft) this.flameLeft.visible = true;
      if (this.flameRight) this.flameRight.visible = true;
      const flicker = 0.8 + Math.random() * 0.4;
      if (this.flameLeft) this.flameLeft.scale.set(flicker, flicker * 1.3, flicker);
      if (this.flameRight) this.flameRight.scale.set(flicker, flicker * 1.3, flicker);
    } else {
      if (this.flameLeft) this.flameLeft.visible = false;
      if (this.flameRight) this.flameRight.visible = false;
      this.nos = Math.min(100, this.nos + 14 * dt);
    }

    // Airtime & Stunt Physics
    if (this.y > 0.05 || this.vy > 0) {
      this.isAirborne = true;
      this.airtime += dt;
      this.y += this.vy * dt;
      this.vy -= 90 * dt;
      this.pitch = Math.sin(this.airtime * 2.0) * -0.15;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.pitch = 0;

        if (this.airtime > 0.75) {
          audio.playStuntFanfare();
          const bonus = 500;
          storage.addCash(bonus);
          gameHUD.updateCash(storage.getCash());
          gameHUD.showNotification(`INSANE STUNT JUMP! Airtime: ${this.airtime.toFixed(1)}s (+$${bonus})`);
        }
        this.airtime = 0;
        this.isAirborne = false;
      }
    }

    this.applyVelocity(dt, particles);

    // Stunt ramps
    if (cityMap && cityMap.checkStuntRamp) {
      const rampHit = cityMap.checkStuntRamp(this.x, this.z);
      if (rampHit && this.speed > 80 && !this.isAirborne) {
        this.vy = Math.min(85, this.speed * 0.42);
        this.y = 1.0;
        audio.playNitro();
      }
    }

    this.x = Math.max(40, Math.min(this.x, CONFIG.WORLD_WIDTH - 40));
    this.z = Math.max(40, Math.min(this.z, CONFIG.WORLD_HEIGHT - 40));

    // Collision with buildings
    const col = cityMap.checkCollision(this.x, this.z, this.length * 0.45);
    if (col.collided) {
      this.x = col.nearX + (this.x - col.nearX) * 1.08;
      this.z = col.nearZ + (this.z - col.nearZ) * 1.08;
      if (Math.abs(this.speed) > 20) {
        audio.playCrash(Math.abs(this.speed) / this.maxSpeed);
        this.health = Math.max(0, this.health - Math.floor(Math.abs(this.speed) * 0.12));
        storage.incrementStat('collisions');
      }
      this.speed = -this.speed * 0.35;
    }

    // Spin wheels
    const spinRate = (this.speed / 1.8) * dt;
    for (const w of this.wheels) {
      w.rotation.x += spinRate;
    }

    // Steer front wheels
    for (const fw of this.frontWheels) {
      fw.rotation.y = this.steerAngle;
    }

    // Motorcycle banking tilt or car body roll
    if (this.typeKey === 'BULLET_350') {
      const bankAngle = (this.speed / this.maxSpeed) * this.steerAngle * -0.45;
      this.meshGroup.rotation.z = bankAngle;
    } else {
      const bodyRoll = (this.speed / this.maxSpeed) * this.steerAngle * -0.18;
      this.meshGroup.rotation.z = bodyRoll;
    }

    this.syncPosition();
  }

  handlePlayerInput(dt, particles) {
    const move = input.getMovementVector();

    this.steerAngle = 0;
    const throttle = -move.y;

    if (Math.abs(move.x) > 0.05) {
      this.steerAngle = -move.x * 0.42;
      if (Math.abs(this.speed) > 1 || Math.abs(throttle) > 0.1) {
        const speedFactor = Math.max(0.45, Math.min(1.0, Math.abs(this.speed) / (this.maxSpeed * 0.35)));
        const rev = this.speed < -1 ? -1.0 : 1.0;
        this.angle -= move.x * this.turnRate * speedFactor * rev * dt;
      }
    }

    // Nitro Boost
    this.isBoosting = false;
    const wantsBoost = (input.keys['ShiftLeft'] || input.keys['ShiftRight'] || input.isSprint) && this.nos > 5 && throttle > 0.1;
    if (wantsBoost) {
      this.isBoosting = true;
      this.nos = Math.max(0, this.nos - 38 * dt);
      this.maxSpeed = this.baseMaxSpeed * 1.55;
      this.speed += this.acceleration * 1.8 * throttle * dt;
      if (Math.random() < 0.2) audio.playNitro();
    } else {
      this.maxSpeed = this.baseMaxSpeed;
    }

    // Throttle / Brake
    if (throttle > 0.1) {
      this.speed += this.acceleration * (this.isBoosting ? 1.8 : 1.0) * throttle * dt;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
      if (this.tlMat) this.tlMat.color.setHex(0xc0392b);
    } else if (throttle < -0.1) {
      if (this.speed > 0) {
        this.speed -= this.braking * (-throttle) * dt;
        if (this.tlMat) this.tlMat.color.setHex(0xff0033);
      } else {
        this.speed -= this.acceleration * 0.6 * (-throttle) * dt;
        if (this.speed < this.reverseSpeed) this.speed = this.reverseSpeed;
        if (this.tlMat) this.tlMat.color.setHex(0xffffff);
      }
    } else {
      if (this.tlMat) this.tlMat.color.setHex(0xc0392b);
      const decel = this.friction * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - decel);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + decel);
    }

    // Drift Handbrake
    this.isDrifting = false;
    if (input.isHandbrake && Math.abs(this.speed) > 18) {
      this.speed *= Math.pow(0.5, dt);
      this.isDrifting = true;
    }

    audio.updateEngine(Math.abs(this.speed) / this.maxSpeed, true);
  }

  applyVelocity(dt, particles) {
    const fx = Math.sin(this.angle);
    const fz = Math.cos(this.angle);

    const targetVx = fx * this.speed;
    const targetVz = fz * this.speed;

    const driftFactor = this.isDrifting ? this.driftFriction * 0.72 : this.driftFriction;
    const lerpRate = 1.0 - Math.pow(1.0 - driftFactor, dt * 10);

    this.vx += (targetVx - this.vx) * lerpRate;
    this.vz += (targetVz - this.vz) * lerpRate;

    this.x += this.vx * dt;
    this.z += this.vz * dt;
  }

  destroy() {
    this.scene.remove(this.meshGroup);
  }
}

if (typeof window !== 'undefined') {
  window.Vehicle3D = Vehicle3D;
}
