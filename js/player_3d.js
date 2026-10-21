/**
 * 3D Player Character Controller
 * Procedurally animated low-poly character with 3D walking, sprinting, and vehicle interaction.
 */

class Player3D {
  constructor(scene, x = 750, z = 750) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.angle = 0; // Heading angle around Y axis
    this.radius = 4.5;

    this.walkSpeed = 48.0;
    this.sprintSpeed = 75.0;

    this.health = 100;
    this.currentVehicle = null;

    this.strideTimer = 0;
    this.footToggle = false;

    this.meshGroup = new THREE.Group();
    this.buildCharacterMesh();
    this.scene.add(this.meshGroup);
  }

  get isInVehicle() {
    return this.currentVehicle !== null;
  }

  buildCharacterMesh() {
    // 1. Torso / Shirt (Teal)
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

    this.syncPosition();
  }

  syncPosition() {
    this.meshGroup.position.set(this.x, this.y, this.z);
    this.meshGroup.rotation.y = this.angle;
  }

  update(dt, cityMap, vehicles) {
    if (this.isInVehicle) {
      this.meshGroup.visible = false;
      this.x = this.currentVehicle.x;
      this.z = this.currentVehicle.z;
      this.angle = this.currentVehicle.angle;
      return;
    }

    this.meshGroup.visible = true;

    const move = input.getMovementVector();
    const speed = input.isHandbrake ? this.sprintSpeed : this.walkSpeed;

    if (Math.abs(move.x) > 0.05 || Math.abs(move.y) > 0.05) {
      // Facing angle (0 = forward in Z)
      this.angle = Math.atan2(move.x, -move.y);

      const newX = this.x + Math.sin(this.angle) * speed * dt;
      const newZ = this.z + Math.cos(this.angle) * speed * dt;

      // 3D Building collision check
      const colX = cityMap.checkCollision(newX, this.z, this.radius);
      if (!colX.collided) this.x = newX;

      const colZ = cityMap.checkCollision(this.x, newZ, this.radius);
      if (!colZ.collided) this.z = newZ;

      // Animate leg & arm stride swing
      this.strideTimer += dt * (speed / 6.0);
      const swing = Math.sin(this.strideTimer) * 0.45;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing;
      this.rightArm.rotation.x = swing;
    } else {
      // Idle pose
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // World clamp
    this.x = Math.max(30, Math.min(this.x, CONFIG.WORLD_WIDTH - 30));
    this.z = Math.max(30, Math.min(this.z, CONFIG.WORLD_HEIGHT - 30));

    this.syncPosition();
  }

  tryEnterVehicle(vehicles) {
    if (this.isInVehicle) return false;

    let closest = null;
    let minDist = 24.0; // 3D units

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
      gameHUD.showNotification(`Entered 3D ${closest.name}`);
      return true;
    }
    return false;
  }

  exitVehicle() {
    if (!this.isInVehicle) return;

    const v = this.currentVehicle;
    v.isDrivenByPlayer = false;

    // Step out to the left door of the car in 3D
    const sideX = -Math.cos(v.angle) * 12.0;
    const sideZ = Math.sin(v.angle) * 12.0;

    this.x = v.x + sideX;
    this.z = v.z + sideZ;
    this.currentVehicle = null;

    audio.playDoor();
    gameHUD.showNotification('Exited vehicle');
  }
}

if (typeof window !== 'undefined') {
  window.Player3D = Player3D;
}
