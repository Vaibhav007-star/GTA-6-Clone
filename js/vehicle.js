/**
 * 2D Top-Down Vehicle Engine with Arcade Drifting Physics
 * Simulates acceleration, braking, friction, steering, tire skid marks, and headlights.
 */

class Vehicle {
  constructor(x, y, typeKey = 'SEDAN', angle = 0, customColor = null) {
    this.x = x;
    this.y = y;
    this.angle = angle; // 0 = UP (-Y)
    this.typeKey = typeKey;

    const profile = CONFIG.VEHICLE_TYPES[typeKey] || CONFIG.VEHICLE_TYPES.SEDAN;
    this.name = profile.name;
    this.width = profile.width;
    this.height = profile.height;
    this.maxSpeed = profile.maxSpeed;
    this.reverseSpeed = profile.reverseSpeed;
    this.acceleration = profile.acceleration;
    this.braking = profile.braking;
    this.turnRate = profile.turnRate;
    this.friction = profile.friction;
    this.driftFriction = profile.driftFriction;
    this.color = customColor || profile.defaultColor;

    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.isDrivenByPlayer = false;

    // Siren animation for police vehicles
    this.sirenTimer = 0;
    this.sirenState = false;

    // Drifting & skid marks
    this.isDrifting = false;
    this.health = 100;
  }

  update(dt, cityMap, particles, skidMarks) {
    if (this.typeKey === 'POLICE') {
      this.sirenTimer += dt;
      if (this.sirenTimer >= 0.16) {
        this.sirenTimer = 0;
        this.sirenState = !this.sirenState;
      }
    }

    if (this.isDrivenByPlayer) {
      this.handlePlayerInput(dt, particles, skidMarks);
    } else {
      this.applyNaturalDeceleration(dt);
    }

    // Apply lateral drift physics
    this.applyVelocity(dt, particles, skidMarks);

    // World bounds constraint
    this.x = Math.max(40, Math.min(this.x, CONFIG.WORLD_WIDTH - 40));
    this.y = Math.max(40, Math.min(this.y, CONFIG.WORLD_HEIGHT - 40));

    // Building collision detection
    const col = cityMap.checkBuildingCollision(this.x, this.y, this.height * 0.45);
    if (col.collided) {
      this.x = col.nearestX + (this.x - col.nearestX) * 1.05;
      this.y = col.nearestY + (this.y - col.nearestY) * 1.05;
      if (Math.abs(this.speed) > 60) {
        audio.playCrash(Math.abs(this.speed) / this.maxSpeed);
        storage.incrementStat('collisions');
      }
      this.speed = -this.speed * 0.35; // Rebound
    }
  }

  handlePlayerInput(dt, particles, skidMarks) {
    const move = input.getMovementVector();

    // 1. Steering (A/D or Joystick X)
    if (Math.abs(move.x) > 0.05 && Math.abs(this.speed) > 10) {
      const speedFactor = Math.min(1.0, Math.abs(this.speed) / (this.maxSpeed * 0.5));
      const reverseMultiplier = this.speed >= 0 ? 1.0 : -1.0;
      this.angle += move.x * this.turnRate * speedFactor * reverseMultiplier * dt;
    }

    // 2. Throttle / Braking (W/S or Joystick Y)
    const throttle = -move.y; // Up is negative Y
    if (throttle > 0.1) {
      this.speed += this.acceleration * throttle * dt;
      if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    } else if (throttle < -0.1) {
      if (this.speed > 0) {
        // Braking
        this.speed -= this.braking * (-throttle) * dt;
      } else {
        // Reversing
        this.speed -= this.acceleration * 0.6 * (-throttle) * dt;
        if (this.speed < this.reverseSpeed) this.speed = this.reverseSpeed;
      }
    } else {
      this.applyNaturalDeceleration(dt);
    }

    // 3. Handbrake / Drift (Space key or button)
    this.isDrifting = false;
    if (input.isHandbrake && Math.abs(this.speed) > 60) {
      this.speed *= Math.pow(0.4, dt);
      this.isDrifting = true;
      if (Math.random() < 0.3) {
        audio.playTireScreech();
      }
    }

    // Update Web Audio engine tone
    audio.updateEngine(Math.abs(this.speed) / this.maxSpeed, true);
  }

  applyNaturalDeceleration(dt) {
    if (Math.abs(this.speed) > 0.01) {
      const decel = this.friction * dt;
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - decel);
      } else {
        this.speed = Math.min(0, this.speed + decel);
      }
    }
  }

  applyVelocity(dt, particles, skidMarks) {
    // Forward unit vector based on car heading angle (0 = UP)
    const fx = Math.sin(this.angle);
    const fy = -Math.cos(this.angle);

    const targetVx = fx * this.speed;
    const targetVy = fy * this.speed;

    // Drift physics: interpolate current velocity towards target heading
    const driftFactor = this.isDrifting ? this.driftFriction * 0.75 : this.driftFriction;
    const lerpRate = 1.0 - Math.pow(1.0 - driftFactor, dt * 12);

    this.vx += (targetVx - this.vx) * lerpRate;
    this.vy += (targetVy - this.vy) * lerpRate;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Drifting tire marks & smoke
    const lateralSpeed = Math.hypot(this.vx - targetVx, this.vy - targetVy);
    if ((lateralSpeed > 75 || this.isDrifting) && Math.abs(this.speed) > 50) {
      if (skidMarks) {
        const rearLeft = this.getPointRelative(-this.width * 0.38, this.height * 0.35);
        const rearRight = this.getPointRelative(this.width * 0.38, this.height * 0.35);
        skidMarks.addMark(rearLeft.x, rearLeft.y);
        skidMarks.addMark(rearRight.x, rearRight.y);
      }

      if (particles && Math.random() < 0.45) {
        const rear = this.getPointRelative(0, this.height * 0.38);
        particles.spawnSmoke(rear.x, rear.y);
      }
    }
  }

  getPointRelative(relX, relY) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return {
      x: this.x + relX * cos - relY * sin,
      y: this.y + relX * sin + relY * cos
    };
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const w = this.width;
    const h = this.height;
    const hw = w / 2;
    const hh = h / 2;

    // 1. Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(-hw + 4, -hh + 4, w, h, 6);
    ctx.fill();

    // 2. Wheels / Tires (4 tires)
    ctx.fillStyle = '#111111';
    ctx.fillRect(-hw - 3, -hh + 8, 5, 14); // Front left
    ctx.fillRect(hw - 2, -hh + 8, 5, 14);  // Front right
    ctx.fillRect(-hw - 3, hh - 22, 5, 14); // Rear left
    ctx.fillRect(hw - 2, hh - 22, 5, 14);  // Rear right

    // 3. Main Car Body Chassis
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, w, h, 6);
    ctx.fill();

    // 4. White sides / markings for Police Cruiser
    if (this.typeKey === 'POLICE') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-hw + 2, -hh + 14, w - 4, h - 28);
    }

    // 5. Cabin & Roof
    ctx.fillStyle = this.typeKey === 'POLICE' ? '#111111' : '#222222';
    ctx.beginPath();
    ctx.roundRect(-hw + 3, -hh + 14, w - 6, h - 28, 4);
    ctx.fill();

    // 6. Windshields (Front & Rear glass)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-hw + 4, -hh + 15, w - 8, 8); // Front windshield
    ctx.fillRect(-hw + 4, hh - 23, w - 8, 6);  // Rear windshield

    // 7. Headlights (Bright yellow/white)
    ctx.fillStyle = '#fff9d2';
    ctx.beginPath();
    ctx.arc(-hw + 5, -hh + 2, 3, 0, Math.PI * 2);
    ctx.arc(hw - 5, -hh + 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 8. Taillights (Red, glows brightly when braking)
    const isBraking = this.isDrivenByPlayer && input.keys['KeyS'];
    ctx.fillStyle = isBraking ? '#ff0033' : '#c0392b';
    ctx.fillRect(-hw + 2, hh - 3, 6, 2.5);
    ctx.fillRect(hw - 8, hh - 3, 6, 2.5);

    // 9. Flashing Emergency Lightbar for Police
    if (this.typeKey === 'POLICE') {
      ctx.fillStyle = this.sirenState ? '#ff1e27' : '#550505';
      ctx.fillRect(-10, -3, 9, 6); // Red strobe

      ctx.fillStyle = !this.sirenState ? '#0066ff' : '#051155';
      ctx.fillRect(1, -3, 9, 6);   // Blue strobe
    }

    ctx.restore();
  }
}
