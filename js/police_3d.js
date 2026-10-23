/**
 * 3D Police Pursuit AI & Fair Dispatcher Engine
 * Features:
 * - Dispatch Response Delay: Police don't spawn instantly; a 7-8s dispatch countdown gives player time to flee!
 * - Distant Road Spawns: Cruisers spawn 750-950 units away off-screen, giving realistic approach time.
 * - Line-of-Sight & Alley Evasion: Breaking contact (>260 units) starts the Evade Countdown.
 * - Outrunnable Speeds: Cruisers have realistic acceleration; fast driving or Nitro Boost easily outpaces them.
 * - No Unfair Auto-Escalation: Police collisions don't spam wanted stars automatically.
 */

class PoliceDispatcher3D {
  constructor(scene) {
    this.scene = scene;
    this.wantedLevel = 0;
    this.cooldownTimer = 0;
    this.dispatchTimer = 0;
    this.crimeOrigin = null;
    this.policeUnits = [];
    this.maxUnits = 3;
    this.sirenActive = false;
    this.isEvading = false;
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
        this.dispatchTimer = 0;
        this.crimeOrigin = null;
      }
    }
  }

  triggerCrime(stars = 1, reason = 'Crime Committed!') {
    const p = window.retroGame3D ? window.retroGame3D.player : null;
    const target = p ? (p.isInVehicle ? p.currentVehicle : p) : { x: 0, z: 0 };

    if (this.wantedLevel === 0) {
      // First crime: Set dispatch delay so cops don't materialize instantly!
      this.dispatchTimer = (stars === 1 ? 8.0 : 5.0);
      this.crimeOrigin = { x: target.x, z: target.z };
      this.cooldownTimer = 0;
      this.setWantedLevel(stars);
      gameHUD.showNotification(`911 DISPATCH: Police en route in ${Math.round(this.dispatchTimer)}s. Flee the area!`);
    } else {
      const newLevel = Math.max(this.wantedLevel, stars);
      this.setWantedLevel(newLevel);
      this.cooldownTimer = 0;
      gameHUD.showNotification(`WANTED: ${reason}`);
    }
  }

  update(dt, player, onPoliceCollision) {
    if (this.wantedLevel === 0) return;

    const pTarget = player.isInVehicle ? player.currentVehicle : player;

    // 1. Dispatch Countdown: Gives the player a headstart to escape!
    if (this.dispatchTimer > 0) {
      this.dispatchTimer -= dt;

      // If player flees far from the initial crime scene before police arrive, evade immediately!
      if (this.crimeOrigin) {
        const fleeDist = Math.hypot(pTarget.x - this.crimeOrigin.x, pTarget.z - this.crimeOrigin.z);
        if (fleeDist > 380) {
          this.setWantedLevel(0);
          gameHUD.showNotification('Escaped the crime scene before police arrived! Heat cleared.');
          return;
        }
      }

      if (this.dispatchTimer <= 0) {
        gameHUD.showNotification('POLICE ARRIVED: Officers spotted your vehicle!');
      } else {
        // Cruisers have not arrived yet
        return;
      }
    }

    // 2. Spawn cruisers far off-screen (750 to 950 units away)
    const targetUnits = Math.min(this.wantedLevel, this.maxUnits);
    if (this.policeUnits.length < targetUnits) {
      this.spawnCruiser(pTarget);
    }

    let closestCopDist = Infinity;

    for (let i = this.policeUnits.length - 1; i >= 0; i--) {
      const cop = this.policeUnits[i];

      // If cop was destroyed or disabled
      if (cop.health <= 0) {
        cop.destroy();
        this.policeUnits.splice(i, 1);
        continue;
      }

      const dx = pTarget.x - cop.x;
      const dz = pTarget.z - cop.z;
      const dist = Math.hypot(dx, dz);
      if (dist < closestCopDist) closestCopDist = dist;

      // Pursuit steering
      if (dist > 20) {
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - cop.angle;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        cop.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
        cop.speed = Math.min(cop.maxSpeed * 0.9, cop.speed + cop.acceleration * dt);

        cop.x += Math.sin(cop.angle) * cop.speed * dt;
        cop.z += Math.cos(cop.angle) * cop.speed * dt;
      }

      cop.syncPosition();

      // Ram impact
      if (dist < 18) {
        cop.speed *= 0.4;
        audio.playCrash(0.8);
        onPoliceCollision(cop);
      }
    }

    // 3. Evasion & Star Cooldown System
    // If player breaks distance (> 260 units away) by turning corners or speeding away
    const evadeDistance = 260;
    if (closestCopDist > evadeDistance) {
      this.isEvading = true;
      this.cooldownTimer += dt;

      // Flash stars on HUD to indicate escaping
      const flash = Math.floor(performance.now() / 250) % 2 === 0;
      if (flash) gameHUD.updateWantedStars(this.wantedLevel);
      else gameHUD.updateWantedStars(0);

      const requiredTime = this.wantedLevel === 1 ? 5.0 : 8.0;
      if (this.cooldownTimer >= requiredTime) {
        this.cooldownTimer = 0;
        const reduced = this.wantedLevel - 1;
        this.setWantedLevel(reduced);

        if (reduced === 0) {
          storage.addCash(200);
          storage.incrementStat('copsEvaded');
          gameHUD.updateCash(storage.getCash());
          gameHUD.showNotification('⭐ COPS EVADED! Lost the pursuit (+$200)');
        } else {
          gameHUD.showNotification(`Lost pursuit visual! Heat reduced to ${reduced} Stars.`);
        }
      }
    } else {
      // Police have direct visual contact
      this.isEvading = false;
      this.cooldownTimer = 0;
      gameHUD.updateWantedStars(this.wantedLevel);
    }
  }

  spawnCruiser(playerTarget) {
    // Spawn 750 to 950 units away (off-screen on roads)
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 750 + Math.random() * 200;
    const spawnX = Math.max(120, Math.min(CONFIG.WORLD_WIDTH - 120, playerTarget.x + Math.sin(angle) * spawnDist));
    const spawnZ = Math.max(120, Math.min(CONFIG.WORLD_HEIGHT - 120, playerTarget.z + Math.cos(angle) * spawnDist));

    const cop = new Vehicle3D(this.scene, spawnX, spawnZ, 'POLICE', angle);
    cop.maxSpeed = 175; // Fair pursuit speed, outrunnable with fast cars/nitro
    cop.acceleration = 130;
    this.policeUnits.push(cop);
  }
}

if (typeof window !== 'undefined') {
  window.PoliceDispatcher3D = PoliceDispatcher3D;
}
