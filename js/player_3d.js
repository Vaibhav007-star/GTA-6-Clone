/**
 * 3D Player Character Controller
 * Open-source third-person character dynamics with camera-relative movement,
 * smooth slerp directional rotation, jumping physics, and vehicle interaction.
 */

class Player3D {
  constructor(scene, x = 750, z = 750) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vy = 0; // Vertical velocity for jumping
    this.isGrounded = true;
    this.angle = 0; // Heading angle around Y axis
    this.targetAngle = 0;
    this.radius = 4.0;

    // Movement speeds
    this.walkSpeed = 48.0;
    this.sprintSpeed = 82.0;

    this.health = 100;
    this.armor = 100;
    this.currentVehicle = null;

    // Animation stride cycle
    this.strideTimer = 0;

    this.meshGroup = new THREE.Group();
    this.weaponGroup = new THREE.Group();
    this.buildCharacterMesh();
    this.buildWeaponMeshes();
    this.scene.add(this.meshGroup);
  }

  get isInVehicle() {
    return this.currentVehicle !== null;
  }

  buildCharacterMesh() {
    // 1. Torso / Hawaiian Shirt (Teal)
    const torsoGeo = new THREE.BoxGeometry(4.0, 5.0, 2.5);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x1abc9c, roughness: 0.7 });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 5.5;
    this.torso.castShadow = true;
    this.meshGroup.add(this.torso);

    // 2. Head & Hair
    const headGeo = new THREE.BoxGeometry(2.6, 2.8, 2.6);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc80, roughness: 0.8 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 9.4;
    this.head.castShadow = true;
    this.meshGroup.add(this.head);

    const hairGeo = new THREE.BoxGeometry(2.8, 1.2, 2.8);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 10.4;
    this.meshGroup.add(hair);

    // 3. Legs / Pants (Dark Navy)
    const legGeo = new THREE.BoxGeometry(1.5, 4.0, 1.8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

    this.leftLeg = new THREE.Mesh(legGeo, legMat);
    this.leftLeg.position.set(-1.1, 2.0, 0);
    this.leftLeg.castShadow = true;
    this.meshGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, legMat);
    this.rightLeg.position.set(1.1, 2.0, 0);
    this.rightLeg.castShadow = true;
    this.meshGroup.add(this.rightLeg);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(1.2, 4.5, 1.4);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffcc80 });

    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-2.6, 5.0, 0);
    this.meshGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(2.6, 5.0, 0);
    this.meshGroup.add(this.rightArm);

    // Attach weapon mount to right hand
    this.weaponGroup.position.set(0, -2.2, 0.8);
    this.rightArm.add(this.weaponGroup);

    this.syncPosition();
  }

  buildWeaponMeshes() {
    // 1. Pistol Mesh
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    this.pistolMesh = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 3.2), gunMat);
    barrel.position.set(0, 0, 1.2);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.9), gunMat);
    grip.position.set(0, -0.9, 0);
    this.pistolMesh.add(barrel);
    this.pistolMesh.add(grip);
    this.pistolMesh.visible = false;
    this.weaponGroup.add(this.pistolMesh);

    // 2. Baseball Bat Mesh
    const batMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.8 });
    this.batMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 7.5, 8), batMat);
    this.batMesh.rotation.x = Math.PI / 4;
    this.batMesh.position.set(0, 1.5, 1.5);
    this.batMesh.visible = false;
    this.weaponGroup.add(this.batMesh);

    // 3. Shotgun / SMG Mesh
    this.shotgunMesh = new THREE.Group();
    const sBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 6.2), gunMat);
    sBarrel.position.set(0, 0, 2.5);
    const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 2.8), batMat);
    sStock.position.set(0, -0.6, -1.2);
    this.shotgunMesh.add(sBarrel);
    this.shotgunMesh.add(sStock);
    this.shotgunMesh.visible = false;
    this.weaponGroup.add(this.shotgunMesh);
  }

  setHeldWeapon(weaponId) {
    if (this.pistolMesh) this.pistolMesh.visible = (weaponId === 'pistol_9mm');
    if (this.batMesh) this.batMesh.visible = (weaponId === 'baseball_bat' || weaponId === 'bat');
    if (this.shotgunMesh) this.shotgunMesh.visible = (weaponId === 'shotgun_pump' || weaponId === 'smg_micro' || weaponId === 'rifle_ak47');
  }

  setOutfit(outfitId) {
    const o = dataManager.getOutfitById(outfitId);
    if (!o) return;
    this.currentOutfit = outfitId;
    const sHex = parseInt(o.shirtColor.replace('#', '0x'));
    const pHex = parseInt(o.pantsColor.replace('#', '0x'));

    if (this.torso) this.torso.material.color.setHex(sHex);
    if (this.leftLeg) this.leftLeg.material.color.setHex(pHex);
    if (this.rightLeg) this.rightLeg.material.color.setHex(pHex);

    storage.set('player_outfit', outfitId);
    gameHUD.showNotification(`Outfit Equipped: ${o.name}`);
  }

  takeDamage(amount) {
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount);
      this.armor -= absorbed;
      amount -= absorbed;
    }
    this.health = Math.max(0, this.health - amount);
    audio.playPunch();

    if (window.gameHUD) {
      window.gameHUD.updateHealthArmor(this.health, this.armor);
    }

    if (this.health <= 0) {
      // Wasted! Respawn at Ocean Beach
      this.health = 100;
      this.armor = 50;
      this.x = 2650;
      this.z = 1450;
      this.y = 0;
      storage.deductCash(100);
      gameHUD.updateCash(storage.getCash());
      gameHUD.showNotification('WASTED! Admitted to Vice Beach Hospital (-$100)');
    }
  }

  syncPosition() {
    this.meshGroup.position.set(this.x, this.y, this.z);
    this.meshGroup.rotation.y = this.angle;
  }

  update(dt, cityMap, vehicles, camera) {
    if (this.isInVehicle) {
      this.meshGroup.visible = false;
      this.x = this.currentVehicle.x;
      this.y = this.currentVehicle.y;
      this.z = this.currentVehicle.z;
      this.angle = this.currentVehicle.angle;
      return;
    }

    this.meshGroup.visible = true;

    // 1. Jumping & Gravity Physics
    if (input.keys['Space'] && this.isGrounded) {
      this.vy = 28.0;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.y += this.vy * dt;
      this.vy -= 78.0 * dt; // Gravity

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // 2. Camera-Relative Movement Vector Calculation
    const move = input.getMovementVector();
    let isMoving = false;

    if (camera && (Math.abs(move.x) > 0.05 || Math.abs(move.y) > 0.05)) {
      isMoving = true;

      // Extract horizontal camera forward & right vectors
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(camera.up, forward).negate().normalize();

      // Combine input with camera orientation
      // move.y is -1 for forward (W), +1 for backward (S)
      // move.x is -1 for left (A), +1 for right (D)
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(forward, -move.y);
      moveDirection.addScaledVector(right, move.x);

      if (moveDirection.lengthSq() > 0.001) {
        moveDirection.normalize();

        // Calculate smooth target heading
        this.targetAngle = Math.atan2(moveDirection.x, moveDirection.z);

        // Smooth shortest-path rotation interpolation (Slerp-style)
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * Math.min(1.0, 16.0 * dt);

        // Sprint detection (Shift key or mobile handbrake button held)
        const isSprinting = input.isHandbrake || input.keys['ShiftLeft'] || input.keys['ShiftRight'];
        const currentSpeed = isSprinting ? this.sprintSpeed : this.walkSpeed;

        const newX = this.x + moveDirection.x * currentSpeed * dt;
        const newZ = this.z + moveDirection.z * currentSpeed * dt;

        // Collision with 3D buildings
        const colX = cityMap.checkCollision(newX, this.z, this.radius);
        if (!colX.collided) this.x = newX;

        const colZ = cityMap.checkCollision(this.x, newZ, this.radius);
        if (!colZ.collided) this.z = newZ;

        // Animate stride swing
        this.strideTimer += dt * (currentSpeed / 5.5);
        const swing = Math.sin(this.strideTimer) * 0.55;
        this.leftLeg.rotation.x = swing;
        this.rightLeg.rotation.x = -swing;
        this.leftArm.rotation.x = -swing;
        this.rightArm.rotation.x = swing;
      }
    } else {
      // Return smoothly to idle stance
      this.leftLeg.rotation.x *= Math.pow(0.1, dt);
      this.rightLeg.rotation.x *= Math.pow(0.1, dt);
      this.leftArm.rotation.x *= Math.pow(0.1, dt);
      this.rightArm.rotation.x *= Math.pow(0.1, dt);
    }

    // World clamp
    this.x = Math.max(30, Math.min(this.x, CONFIG.WORLD_WIDTH - 30));
    this.z = Math.max(30, Math.min(this.z, CONFIG.WORLD_HEIGHT - 30));

    // Vehicle proximity check for action button prompt
    this.checkVehicleProximity(vehicles);

    this.syncPosition();
  }

  checkVehicleProximity(vehicles) {
    let closest = null;
    let minDist = 26.0;

    for (const v of vehicles) {
      const d = Math.hypot(this.x - v.x, this.z - v.z);
      if (d < minDist) {
        minDist = d;
        closest = v;
      }
    }

    const btnLabel = document.getElementById('btn-action-label');
    if (closest) {
      if (btnLabel) btnLabel.textContent = `DRIVE`;
    } else {
      if (btnLabel && !this.isInVehicle) btnLabel.textContent = `ENTER`;
    }
  }

  tryEnterVehicle(vehicles) {
    if (this.isInVehicle) return false;

    let closest = null;
    let minDist = 26.0;

    for (const v of vehicles) {
      const d = Math.hypot(this.x - v.x, this.z - v.z);
      if (d < minDist) {
        minDist = d;
        closest = v;
      }
    }

    if (closest) {
      this.currentVehicle = closest;
      closest.isDrivenByPlayer = true;
      audio.playDoor();
      storage.incrementStat('carsEntered');
      gameHUD.showNotification(`Driving 3D ${closest.name}`);
      return true;
    }
    return false;
  }

  exitVehicle() {
    if (!this.isInVehicle) return;

    const v = this.currentVehicle;
    v.isDrivenByPlayer = false;

    // Step out beside the driver's side door
    const sideX = -Math.cos(v.angle) * 12.0;
    const sideZ = Math.sin(v.angle) * 12.0;

    this.x = v.x + sideX;
    this.z = v.z + sideZ;
    this.y = 0;
    this.currentVehicle = null;

    audio.playDoor();
    gameHUD.showNotification('Exited vehicle');
  }
}

if (typeof window !== 'undefined') {
  window.Player3D = Player3D;
}
