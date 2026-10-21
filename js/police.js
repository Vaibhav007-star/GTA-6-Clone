/**
 * Police Pursuit & Wanted Level Dispatcher
 * Manages police cruisers, AI chase vectoring, siren states, and heat cooldowns.
 */

class PoliceDispatcher {
  constructor() {
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
        // Despawn remaining police when cleared
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
    if (this.wantedLevel === 0) {
      if (this.policeUnits.length > 0) this.policeUnits = [];
      return;
    }

    const playerTarget = player.isInVehicle ? player.currentVehicle : player;

    // 1. Maintain active cruiser fleet based on wanted stars
    const targetUnits = Math.min(this.wantedLevel, this.maxUnits);
    if (this.policeUnits.length < targetUnits) {
      this.spawnCruiser(playerTarget);
    }

    // 2. Update each Cruiser's pursuit AI
    let closestCopDist = Infinity;

    for (const cop of this.policeUnits) {
      const dx = playerTarget.x - cop.x;
      const dy = playerTarget.y - cop.y;
      const dist = Math.hypot(dx, dy);
      if (dist < closestCopDist) closestCopDist = dist;

      // Pursuit vector steering
      if (dist > 25) {
        const targetAngle = Math.atan2(dx, -dy);
        let diff = targetAngle - cop.angle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        cop.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff));

        // Accelerate towards player
        cop.speed = Math.min(cop.maxSpeed, cop.speed + cop.acceleration * dt);

        const fx = Math.sin(cop.angle);
        const fy = -Math.cos(cop.angle);

        cop.x += fx * cop.speed * dt;
        cop.y += fy * cop.speed * dt;
      }

      // Check collision with player
      if (dist < 46) {
        cop.speed *= 0.5;
        audio.playCrash(1.0);
        onPoliceCollision(cop);

        if (this.wantedLevel < 4 && Math.random() < 0.4) {
          this.triggerCrime(this.wantedLevel + 1, 'Assaulting an Officer!');
        }
      }
    }

    // 3. Wanted Cooldown Logic (Evade the cops)
    if (closestCopDist > 550) {
      this.cooldownTimer += dt;
      if (this.cooldownTimer >= CONFIG.WANTED.COOLDOWN_TIME) {
        this.cooldownTimer = 0;
        const reduced = this.wantedLevel - 1;
        this.setWantedLevel(reduced);

        if (reduced === 0) {
          storage.addCash(150);
          storage.incrementStat('copsEvaded');
          gameHUD.showNotification('Heat Cleared! Evaded the Law (+$150)');
        } else {
          gameHUD.showNotification(`Lost pursuit! Wanted level reduced to ${reduced}`);
        }
      }
    } else {
      this.cooldownTimer = 0;
    }
  }

  spawnCruiser(playerTarget) {
    // Spawn 450px away off-screen in random direction
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 480;
    const spawnX = Math.max(100, Math.min(CONFIG.WORLD_WIDTH - 100, playerTarget.x + Math.cos(angle) * spawnDist));
    const spawnY = Math.max(100, Math.min(CONFIG.WORLD_HEIGHT - 100, playerTarget.y + Math.sin(angle) * spawnDist));

    const cop = new Vehicle(spawnX, spawnY, 'POLICE', angle);
    cop.maxSpeed = 440;
    cop.acceleration = 310;
    this.policeUnits.push(cop);
  }

  render(ctx) {
    for (const cop of this.policeUnits) {
      cop.render(ctx);
    }
  }
}

if (typeof window !== 'undefined') {
  window.PoliceDispatcher = PoliceDispatcher;
}

