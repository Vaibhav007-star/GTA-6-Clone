/**
 * 3D Vehicle Engine with Arcade Drifting & Suspension Body Roll
 * Builds procedural 3D car meshes, rotating 3D wheels, headlights, and siren lights.
 */

class Vehicle3D {
  constructor(scene, x, z, typeKey = 'SEDAN', angle = 0, customColor = null) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.angle = angle; // Radians
    this.typeKey = typeKey;

    const profile = CONFIG.VEHICLE_TYPES[typeKey] || CONFIG.VEHICLE_TYPES.SEDAN;
    this.name = profile.name;
    this.width = profile.width * 0.35;   // Scale to 3D world units
    this.length = profile.height * 0.35; // 3D car length
    this.height = 7.5;
    this.maxSpeed = profile.maxSpeed * 0.55;
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
    this.health = 100;

    // Siren state for police
    this.sirenTimer = 0;
    this.sirenState = false;

    this.meshGroup = new THREE.Group();
    this.wheels = [];
    this.frontWheels = [];

    this.buildMesh();
    this.scene.add(this.meshGroup);
  }

  buildMesh() {
    const w = this.width;
    const l = this.length;
    const h = 4.5;

    // 1. Main Chassis
    const bodyGeo = new THREE.BoxGeometry(w, h, l);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      metalness: 0.5,
      roughness: 0.35
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2 + 1.2;
    body.castShadow = true;
    body.receiveShadow = true;
    this.meshGroup.add(body);

    // 2. Cabin & Roof
    const cabinH = 3.8;
    const cabinL = l * 0.55;
    const cabinW = w * 0.85;
    const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinL);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: this.typeKey === 'POLICE' ? 0xffffff : 0x1e272e,
      roughness: 0.4
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, h + cabinH / 2 + 0.8, -l * 0.05);
    cabin.castShadow = true;
    this.meshGroup.add(cabin);

    // 3. Tinted Windshield Glass
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0984e3,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    // Front windshield
    const fGlassGeo = new THREE.PlaneGeometry(cabinW * 0.9, cabinH * 0.8);
    const fGlass = new THREE.Mesh(fGlassGeo, glassMat);
    fGlass.position.set(0, cabin.position.y, cabin.position.z + cabinL / 2 + 0.05);
    this.meshGroup.add(fGlass);

    // 4. Headlights (3D Spotlights)
    const hlGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });

    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.position.set(-w * 0.38, body.position.y + 0.5, l / 2 + 0.2);
    this.meshGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, hlMat);
    hlRight.position.set(w * 0.38, body.position.y + 0.5, l / 2 + 0.2);
    this.meshGroup.add(hlRight);

    // Headlight Spotlights
    this.headlight = new THREE.SpotLight(0xfffa65, 1.8, 140, Math.PI / 6, 0.4);
    this.headlight.position.set(0, body.position.y + 1, l / 2);
    this.headlightTarget = new THREE.Object3D();
    this.headlightTarget.position.set(0, 0, l / 2 + 40);
    this.meshGroup.add(this.headlight);
    this.meshGroup.add(this.headlightTarget);
    this.headlight.target = this.headlightTarget;

    // 5. Taillights (Red)
    const tlGeo = new THREE.BoxGeometry(2.0, 1.0, 0.5);
    this.tlMat = new THREE.MeshBasicMaterial({ color: 0xc0392b });

    const tlLeft = new THREE.Mesh(tlGeo, this.tlMat);
    tlLeft.position.set(-w * 0.38, body.position.y + 0.5, -l / 2 - 0.1);
    this.meshGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, this.tlMat);
    tlRight.position.set(w * 0.38, body.position.y + 0.5, -l / 2 - 0.1);
    this.meshGroup.add(tlRight);

    // 6. 3D Wheels
    const wheelRadius = 1.8;
    const wheelWidth = 1.0;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    const wheelOffsets = [
      { x: -w / 2 - 0.2, z: l * 0.32, isFront: true },  // Front Left
      { x: w / 2 + 0.2, z: l * 0.32, isFront: true },   // Front Right
      { x: -w / 2 - 0.2, z: -l * 0.32, isFront: false }, // Rear Left
      { x: w / 2 + 0.2, z: -l * 0.32, isFront: false }  // Rear Right
    ];

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

    // 7. Police Emergency Lightbar
    if (this.typeKey === 'POLICE') {
      const barGeo = new THREE.BoxGeometry(w * 0.6, 1.2, 1.8);
      const barMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, cabin.position.y + cabinH / 2 + 0.7, cabin.position.z);
      this.meshGroup.add(bar);

      // Red Strobe
      this.redLightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.4), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      this.redLightMesh.position.set(-w * 0.2, bar.position.y, bar.position.z);
      this.meshGroup.add(this.redLightMesh);

      // Blue Strobe
      this.blueLightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.0, 1.4), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
      this.blueLightMesh.position.set(w * 0.2, bar.position.y, bar.position.z);
      this.meshGroup.add(this.blueLightMesh);
    }

    this.syncPosition();
  }

  syncPosition() {
    this.meshGroup.position.set(this.x, this.y, this.z);
    this.meshGroup.rotation.y = this.angle;
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
      // Coasting friction
      if (Math.abs(this.speed) > 0.01) {
        const decel = this.friction * dt;
        if (this.speed > 0) this.speed = Math.max(0, this.speed - decel);
        else this.speed = Math.min(0, this.speed + decel);
      }
    }

    this.applyVelocity(dt, particles);

    // World bounds clamp
    this.x = Math.max(40, Math.min(this.x, CONFIG.WORLD_WIDTH - 40));
    this.z = Math.max(40, Math.min(this.z, CONFIG.WORLD_HEIGHT - 40));

    // 3D Building collision
    const col = cityMap.checkCollision(this.x, this.z, this.length * 0.45);
    if (col.collided) {
      this.x = col.nearX + (this.x - col.nearX) * 1.08;
      this.z = col.nearZ + (this.z - col.nearZ) * 1.08;
      if (Math.abs(this.speed) > 20) {
        audio.playCrash(Math.abs(this.speed) / this.maxSpeed);
        storage.incrementStat('collisions');
      }
      this.speed = -this.speed * 0.35;
    }

    // Spin 3D wheels proportional to ground speed
    const spinRate = (this.speed / 1.8) * dt;
    for (const w of this.wheels) {
      w.rotation.x += spinRate;
    }

    // Turn front wheels according to steering input
    for (const fw of this.frontWheels) {
      fw.rotation.y = this.steerAngle;
    }

    // Body roll / suspension tilt during hard turns
    const bodyRoll = (this.speed / this.maxSpeed) * this.steerAngle * -0.18;
    this.meshGroup.rotation.z = bodyRoll;

    this.syncPosition();
  }

  handlePlayerInput(dt, particles) {
    const move = input.getMovementVector();

    // Steering
    this.steerAngle = 0;
    const throttle = -move.y; // Forward is negative Y

    if (Math.abs(move.x) > 0.05) {
      this.steerAngle = -move.x * 0.42; // Max 24 degrees front wheel turn
      if (Math.abs(this.speed) > 1 || Math.abs(throttle) > 0.1) {
        const speedFactor = Math.max(0.45, Math.min(1.0, Math.abs(this.speed) / (this.maxSpeed * 0.35)));
        const rev = this.speed < -1 ? -1.0 : 1.0;
        this.angle -= move.x * this.turnRate * speedFactor * rev * dt;
      }
    }

    // Throttle / Braking
    if (throttle > 0.1) {
      this.speed += this.acceleration * throttle * dt;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
      if (this.tlMat) this.tlMat.color.setHex(0xc0392b);
    } else if (throttle < -0.1) {
      if (this.speed > 0) {
        this.speed -= this.braking * (-throttle) * dt;
        if (this.tlMat) this.tlMat.color.setHex(0xff0033); // Bright brake lights
      } else {
        this.speed -= this.acceleration * 0.6 * (-throttle) * dt;
        if (this.speed < this.reverseSpeed) this.speed = this.reverseSpeed;
        if (this.tlMat) this.tlMat.color.setHex(0xffffff); // White reverse lights
      }
    } else {
      if (this.tlMat) this.tlMat.color.setHex(0xc0392b);
      // Coasting
      const decel = this.friction * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - decel);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + decel);
    }

    // Handbrake / Drift
    this.isDrifting = false;
    if (input.isHandbrake && Math.abs(this.speed) > 18) {
      this.speed *= Math.pow(0.5, dt);
      this.isDrifting = true;
      if (Math.random() < 0.25) {
        audio.playTireScreech();
      }
    }

    // Update sound synthesizer pitch
    audio.updateEngine(Math.abs(this.speed) / this.maxSpeed, true);
  }

  applyVelocity(dt, particles) {
    // Forward vector in 3D (heading angle around Y axis)
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

    // Drift smoke emission
    if (this.isDrifting && Math.abs(this.speed) > 15 && particles) {
      particles.spawnSmoke(this.x, 1.0, this.z);
    }
  }

  destroy() {
    this.scene.remove(this.meshGroup);
  }
}

if (typeof window !== 'undefined') {
  window.Vehicle3D = Vehicle3D;
}

