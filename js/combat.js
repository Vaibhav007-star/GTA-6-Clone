/**
 * 3D Ballistic Combat & Weapon System
 * Features:
 * - 3D Tracer Bullets flying through WebGL space
 * - Muzzle flash point lights and ballistic recoil
 * - Real-time vehicle damage, pedestrian ragdolls, and police aggression response
 * - Melee punch / bat combo attacks with sound FX
 * - Switching weapons (Fists, Baseball Bat, 9mm Pistol, Pump Shotgun, Micro SMG)
 */

class CombatSystem {
  constructor() {
    this.weapons = dataManager.getWeapons();
    this.currentWeaponIndex = 0;
    this.projectiles = [];
    this.cooldownTimer = 0;

    // Shared 3D Tracer Materials
    this.bulletMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    this.bulletGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.2, 6);

    this.setupListeners();
  }

  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex] || this.weapons[0];
  }

  setupListeners() {
    // Weapon switching keys 1, 2, 3, 4
    window.addEventListener('keydown', (e) => {
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const idx = parseInt(e.key) - 1;
        if (idx < this.weapons.length) {
          this.currentWeaponIndex = idx;
          this.updateHUD();
          gameHUD.showNotification(`Equipped: ${this.currentWeapon.name}`);
        }
      }
    });

    // Left click attack / shoot
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !e.target.closest('#hud-overlay, #pause-modal, #touch-controls')) {
        this.triggerAttack();
      }
    });
  }

  nextWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    this.updateHUD();
    gameHUD.showNotification(`Equipped: ${this.currentWeapon.name}`);
    return this.currentWeapon;
  }

  updateHUD() {
    const el = document.getElementById('hud-weapon-icon');
    const nameEl = document.getElementById('hud-weapon-name');
    if (el) el.textContent = this.currentWeapon.icon;
    if (nameEl) nameEl.textContent = this.currentWeapon.name;
  }

  triggerAttack() {
    if (this.cooldownTimer > 0) return;
    const game = window.retroGame3D || window.retroGame;
    if (!game || !game.player) return;
    const player = game.player;

    if (player.isInVehicle) {
      // Drive-by shooting in vehicle!
      this.fireDriveBy(game, player);
      return;
    }

    const weapon = this.currentWeapon;
    this.cooldownTimer = weapon.cooldown;

    // Orient player towards camera forward direction
    player.angle = game.cameraYaw;
    player.syncPosition();

    if (weapon.category === 'Melee') {
      audio.playPunch();
      this.performMeleeAttack(game, player, weapon);
    } else {
      audio.playGunshot(weapon.id === 'shotgun_pump');
      this.fire3DProjectile(game, player, weapon);

      // Alert police if firing firearms in the city
      if (game.police && game.police.wantedLevel === 0 && Math.random() < 0.4) {
        game.police.triggerCrime(1, 'Gunfire Reported in Public Area!');
      }
    }
  }

  fireDriveBy(game, player) {
    const car = player.currentVehicle;
    if (!car) return;
    this.cooldownTimer = 0.18;
    audio.playGunshot(false);

    // Fire out of car window towards camera aim
    const camYaw = game.cameraYaw;
    const camPitch = game.cameraPitch;

    const fx = Math.sin(camYaw) * Math.cos(camPitch);
    const fy = -Math.sin(camPitch);
    const fz = Math.cos(camYaw) * Math.cos(camPitch);

    const speed = 750;
    this.spawnTracer(game.scene, car.x, car.y + 4.5, car.z, fx * speed, fy * speed, fz * speed, 25, 0.9);

    if (game.police && game.police.wantedLevel === 0 && Math.random() < 0.45) {
      game.police.triggerCrime(2, 'Drive-By Shooting Reported!');
    }
  }

  performMeleeAttack(game, player, weapon) {
    const hitDist = weapon.range || 12;
    const hitX = player.x + Math.sin(player.angle) * hitDist;
    const hitZ = player.z + Math.cos(player.angle) * hitDist;

    // 1. Damage parked/drivable cars
    for (const v of game.vehicles) {
      if (Math.hypot(v.x - hitX, v.z - hitZ) < v.width * 1.2) {
        audio.playCrash(0.3);
        v.health = Math.max(0, v.health - weapon.damage);
        if (game.police.wantedLevel === 0 && Math.random() < 0.3) {
          game.police.triggerCrime(1, 'Vandalism!');
        }
      }
    }

    // 2. Punch civilian traffic cars
    if (game.traffic) {
      for (const tv of game.traffic.vehicles) {
        if (Math.hypot(tv.x - hitX, tv.z - hitZ) < 16) {
          audio.playCrash(0.3);
          game.police.triggerCrime(1, 'Vandalizing Motor Vehicles!');
        }
      }

      // 3. Punch pedestrians
      for (const p of game.traffic.pedestrians) {
        if (p.alive && Math.hypot(p.x - hitX, p.z - hitZ) < 14) {
          p.alive = false;
          if (p.mesh) p.mesh.rotation.x = Math.PI / 2; // Knock down
          game.police.triggerCrime(1, 'Assault!');
          storage.addCash(25);
          gameHUD.showNotification('Assault: +$25 Cash Pickpocketed!');
        }
      }
    }
  }

  fire3DProjectile(game, player, weapon) {
    const camYaw = game.cameraYaw;
    const camPitch = game.cameraPitch;

    // Shotgun fires multiple pellets
    const pelletCount = weapon.id === 'shotgun_pump' ? 6 : 1;

    for (let i = 0; i < pelletCount; i++) {
      const spreadX = (Math.random() - 0.5) * (weapon.spread || 0.04);
      const spreadY = (Math.random() - 0.5) * (weapon.spread || 0.04);

      const yaw = camYaw + spreadX;
      const pitch = camPitch + spreadY;

      const fx = Math.sin(yaw) * Math.cos(pitch);
      const fy = -Math.sin(pitch);
      const fz = Math.cos(yaw) * Math.cos(pitch);

      const speed = weapon.projectileSpeed || 850;
      const spawnX = player.x + fx * 4.0;
      const spawnY = player.y + 6.0 + fy * 4.0;
      const spawnZ = player.z + fz * 4.0;

      this.spawnTracer(
        game.scene,
        spawnX, spawnY, spawnZ,
        fx * speed, fy * speed, fz * speed,
        weapon.damage,
        (weapon.range || 450) / speed
      );
    }
  }

  spawnTracer(scene, x, y, z, vx, vy, vz, damage, maxLife) {
    const mesh = new THREE.Mesh(this.bulletGeo, this.bulletMat);
    mesh.position.set(x, y, z);

    // Orient cylinder along trajectory velocity vector
    const dir = new THREE.Vector3(vx, vy, vz).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(up, dir);

    scene.add(mesh);

    this.projectiles.push({
      mesh,
      x, y, z,
      vx, vy, vz,
      damage,
      life: maxLife
    });
  }

  update(dt, game) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    // Update active 3D projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;

      p.mesh.position.set(p.x, p.y, p.z);

      let hasTerminated = false;

      // 1. Check ground / ocean collision
      if (p.y <= 0) {
        hasTerminated = true;
      }

      // 2. Check 3D building collision
      if (!hasTerminated && game.map) {
        const col = game.map.checkCollision(p.x, p.z, 2.0);
        if (col.collided) {
          hasTerminated = true;
        }
      }

      // 3. Check drivable cars collision
      if (!hasTerminated && game.vehicles) {
        for (const v of game.vehicles) {
          if (Math.hypot(v.x - p.x, v.z - p.z) < v.width * 1.1 && Math.abs(p.y - (v.y + 3)) < 4) {
            audio.playCrash(0.4);
            v.health = Math.max(0, v.health - p.damage);
            hasTerminated = true;
            break;
          }
        }
      }

      // 4. Check civilian traffic cars
      if (!hasTerminated && game.traffic && game.traffic.vehicles) {
        for (const tv of game.traffic.vehicles) {
          if (Math.hypot(tv.x - p.x, tv.z - p.z) < 14) {
            audio.playCrash(0.4);
            game.police.triggerCrime(1, 'Firing upon Traffic Vehicles!');
            hasTerminated = true;
            break;
          }
        }
      }

      // 5. Check police cruisers
      if (!hasTerminated && game.police && game.police.policeUnits) {
        for (const cop of game.police.policeUnits) {
          if (Math.hypot(cop.x - p.x, cop.z - p.z) < 16) {
            audio.playCrash(0.6);
            game.police.triggerCrime(3, 'Attacking Police Cruisers with Firearms!');
            hasTerminated = true;
            break;
          }
        }
      }

      // 6. Check pedestrians
      if (!hasTerminated && game.traffic && game.traffic.pedestrians) {
        for (const ped of game.traffic.pedestrians) {
          if (ped.alive && Math.hypot(ped.x - p.x, ped.z - p.z) < 10) {
            ped.alive = false;
            if (ped.mesh) ped.mesh.rotation.x = Math.PI / 2;
            game.police.triggerCrime(2, 'Manslaughter!');
            hasTerminated = true;
            break;
          }
        }
      }

      // Remove projectile if hit or expired
      if (hasTerminated || p.life <= 0) {
        game.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}

const combatSystem = new CombatSystem();

if (typeof window !== 'undefined') {
  window.CombatSystem = CombatSystem;
  window.combatSystem = combatSystem;
}
