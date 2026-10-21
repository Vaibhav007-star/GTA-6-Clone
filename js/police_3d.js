/**
 * 3D Police Pursuit AI & Siren Strobes
 */

class PoliceDispatcher3D {
  constructor(scene) {
    this.scene = scene;
    this.wantedLevel = 0;
    this.cooldownTimer = 0;
    this.policeUnits = [];
    this.maxUnits = 3;
    this.sirenActive = false;
  }

  setWantedLevel(level) {
    const clamped = Math.max(0, Math.min(CONFIG.WANTED.MAX_STARS, level));
    if (this.wantedLevel !== clamped) {
      this.wantedLevel = clamped;
      gameHUD.updateWantedStars(this.wantedLevel);

      if (this.wantedLevel > 0) {
        if (!this.sirenActive) {
          audio.startSiren();
          this.sirenActive = true;
        }
      } else {
        if (this.sirenActive) {
          audio.stopSiren();
          this.sirenActive = false;
        }
        for (const cop of this.policeUnits) {
          cop.destroy();
        }
        this.policeUnits = [];
      }
    }
  }

  triggerCrime(stars = 1, reason = 'Crime Committed!') {
    const newLevel = Math.max(this.wantedLevel, stars);
    this.setWantedLevel(newLevel);
    this.cooldownTimer = 0;
    gameHUD.showNotification(`WANTED: ${reason}`);
  }

  update(dt, player, onPoliceCollision) {
    if (this.wantedLevel === 0) return;

    const pTarget = player.isInVehicle ? player.currentVehicle : player;

    // Spawn cruisers according to star tier
    const targetUnits = Math.min(this.wantedLevel, this.maxUnits);
    if (this.policeUnits.length < targetUnits) {
      this.spawnCruiser(pTarget);
    }

    let closestCopDist = Infinity;

    for (const cop of this.policeUnits) {
      const dx = pTarget.x - cop.x;
      const dz = pTarget.z - cop.z;
      const dist = Math.hypot(dx, dz);
      if (dist < closestCopDist) closestCopDist = dist;

      if (dist > 18) {
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - cop.angle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        cop.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
        cop.speed = Math.min(cop.maxSpeed * 0.9, cop.speed + cop.acceleration * dt);

        cop.x += Math.sin(cop.angle) * cop.speed * dt;
        cop.z += Math.cos(cop.angle) * cop.speed * dt;
      }

      cop.syncPosition();

      // Ram impact
      if (dist < 18) {
        cop.speed *= 0.5;
        audio.playCrash(1.0);
        onPoliceCollision(cop);

        if (this.wantedLevel < 4 && Math.random() < 0.35) {
          this.triggerCrime(this.wantedLevel + 1, 'Assaulting an Officer!');
        }
      }
    }

    // Cooldown logic
    if (closestCopDist > 450) {
      this.cooldownTimer += dt;
      if (this.cooldownTimer >= CONFIG.WANTED.COOLDOWN_TIME) {
        this.cooldownTimer = 0;
        const reduced = this.wantedLevel - 1;
        this.setWantedLevel(reduced);

        if (reduced === 0) {
          storage.addCash(150);
          storage.incrementStat('copsEvaded');
          gameHUD.showNotification('Evaded the Law in 3D! (+$150)');
        }
      }
    } else {
      this.cooldownTimer = 0;
    }
  }

  spawnCruiser(playerTarget) {
    const angle = Math.random() * Math.PI * 2;
    const spawnX = Math.max(100, Math.min(CONFIG.WORLD_WIDTH - 100, playerTarget.x + Math.sin(angle) * 360));
    const spawnZ = Math.max(100, Math.min(CONFIG.WORLD_HEIGHT - 100, playerTarget.z + Math.cos(angle) * 360));

    const cop = new Vehicle3D(this.scene, spawnX, spawnZ, 'POLICE', angle);
    cop.maxSpeed = 160;
    cop.acceleration = 120;
    this.policeUnits.push(cop);
  }
}

if (typeof window !== 'undefined') {
  window.PoliceDispatcher3D = PoliceDispatcher3D;
}

