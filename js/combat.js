/**
 * Combat & Weapon System
 * Manages active weapons, projectiles, muzzle flashes, and ballistic damage.
 */

class CombatSystem {
  constructor() {
    this.weapons = dataManager.getWeapons();
    this.currentWeaponIndex = 0;
    this.projectiles = [];
    this.muzzleFlashes = [];
    this.cooldownTimer = 0;
    this.aimTarget = { x: 0, y: 0 }; // World coordinates of aim

    this.setupListeners();
  }

  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex] || this.weapons[0];
  }

  setupListeners() {
    // Weapon switching with number keys 1, 2, 3, 4
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

    // Aim with mouse pointer
    window.addEventListener('mousemove', (e) => {
      if (window.retroGame) {
        const game = window.retroGame;
        const rect = game.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left - game.canvas.width / 2;
        const screenY = e.clientY - rect.top - game.canvas.height / 2;
        this.aimTarget.x = game.camera.x + screenX;
        this.aimTarget.y = game.camera.y + screenY;
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
  }

  updateHUD() {
    const el = document.getElementById('hud-weapon-icon');
    const nameEl = document.getElementById('hud-weapon-name');
    if (el) el.textContent = this.currentWeapon.icon;
    if (nameEl) nameEl.textContent = this.currentWeapon.name;
  }

  triggerAttack() {
    if (this.cooldownTimer > 0) return;
    const player = window.retroGame ? window.retroGame.player : null;
    if (!player || player.isInVehicle) return;

    const weapon = this.currentWeapon;
    this.cooldownTimer = weapon.cooldown;

    // Heading angle towards aim target
    const dx = this.aimTarget.x - player.x;
    const dy = this.aimTarget.y - player.y;
    const angle = (Math.abs(dx) > 10 || Math.abs(dy) > 10) ? Math.atan2(dx, -dy) : player.angle;
    player.angle = angle;

    if (weapon.category === 'Melee') {
      audio.playPunch();
      this.performMeleeAttack(player, angle, weapon);
    } else {
      // Fire gun projectile
      audio.playGunshot(weapon.id === 'shotgun_pump');
      this.fireProjectile(player, angle, weapon);

      // Alert police if firing firearms in the city
      if (window.retroGame && window.retroGame.police.wantedLevel === 0 && Math.random() < 0.35) {
        window.retroGame.police.triggerCrime(1, 'Gunfire Reported in Public Area!');
      }
    }
  }

  performMeleeAttack(player, angle, weapon) {
    const game = window.retroGame;
    if (!game) return;

    const hitDist = weapon.range;
    const hitX = player.x + Math.sin(angle) * hitDist;
    const hitY = player.y - Math.cos(angle) * hitDist;

    // Check hit on vehicles
    for (const v of game.vehicles) {
      if (Math.hypot(v.x - hitX, v.y - hitY) < v.width) {
        audio.playCrash(0.4);
        v.health -= weapon.damage;
        if (game.police.wantedLevel === 0 && Math.random() < 0.3) {
          game.police.triggerCrime(1, 'Vandalism!');
        }
      }
    }

    // Check hit on pedestrians
    for (const p of game.traffic.pedestrians) {
      if (p.alive && Math.hypot(p.x - hitX, p.y - hitY) < 18) {
        p.alive = false;
        game.police.triggerCrime(1, 'Assault!');
      }
    }
  }

  fireProjectile(player, angle, weapon) {
    const muzzleDist = 18;
    const spawnX = player.x + Math.sin(angle) * muzzleDist;
    const spawnY = player.y - Math.cos(angle) * muzzleDist;

    // Muzzle flash particle
    this.muzzleFlashes.push({
      x: spawnX,
      y: spawnY,
      angle: angle,
      life: 0.06
    });

    // Spread
    const spread = (Math.random() - 0.5) * weapon.spread;
    const finalAngle = angle + spread;
    const speed = weapon.projectileSpeed || 900;

    this.projectiles.push({
      x: spawnX,
      y: spawnY,
      vx: Math.sin(finalAngle) * speed,
      vy: -Math.cos(finalAngle) * speed,
      damage: weapon.damage,
      life: weapon.range / speed
    });
  }

  update(dt, game) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    // Update muzzle flashes
    for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
      this.muzzleFlashes[i].life -= dt;
      if (this.muzzleFlashes[i].life <= 0) {
        this.muzzleFlashes.splice(i, 1);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // 1. Building collision
      const col = game.map.checkBuildingCollision(p.x, p.y, 4);
      if (col.collided) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // 2. Vehicle collision
      let hit = false;
      for (const v of game.vehicles) {
        if (Math.hypot(v.x - p.x, v.y - p.y) < v.width * 0.7) {
          audio.playCrash(0.5);
          v.health -= p.damage;
          hit = true;
          break;
        }
      }

      // 3. Civilian cars collision
      if (!hit) {
        for (const tv of game.traffic.vehicles) {
          if (Math.hypot(tv.x - p.x, tv.y - p.y) < 22) {
            audio.playCrash(0.5);
            game.police.triggerCrime(1, 'Firing upon Motor Vehicles!');
            hit = true;
            break;
          }
        }
      }

      // 4. Police cruisers collision
      if (!hit) {
        for (const cop of game.police.policeUnits) {
          if (Math.hypot(cop.x - p.x, cop.y - p.y) < 24) {
            audio.playCrash(0.7);
            game.police.triggerCrime(3, 'Attacking Law Enforcement with Firearms!');
            hit = true;
            break;
          }
        }
      }

      // 5. Pedestrian collision
      if (!hit) {
        for (const ped of game.traffic.pedestrians) {
          if (ped.alive && Math.hypot(ped.x - p.x, ped.y - p.y) < 14) {
            ped.alive = false;
            game.police.triggerCrime(2, 'Manslaughter!');
            hit = true;
            break;
          }
        }
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // 1. Draw Muzzle Flashes
    for (const mf of this.muzzleFlashes) {
      ctx.save();
      ctx.translate(mf.x, mf.y);
      ctx.rotate(mf.angle);
      ctx.fillStyle = '#fffa65';
      ctx.beginPath();
      ctx.arc(0, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw Bullet Tracers
    ctx.strokeStyle = '#fff176';
    ctx.lineWidth = 2.5;
    for (const p of this.projectiles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
      ctx.stroke();
    }
  }
}

const combatSystem = new CombatSystem();

if (typeof window !== 'undefined') {
  window.CombatSystem = CombatSystem;
  window.combatSystem = combatSystem;
}
