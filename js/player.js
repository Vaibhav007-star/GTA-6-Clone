/**
 * 2D Top-Down Player Character Controller
 * Procedurally animated character on foot with walking, sprinting, and vehicle interaction.
 */

class PlayerController {
  constructor(x = 750, y = 750) {
    this.x = x;
    this.y = y;
    this.angle = 0; // Radians, 0 = facing UP (-Y)
    this.radius = CONFIG.PLAYER.RADIUS;

    this.walkSpeed = CONFIG.PLAYER.WALK_SPEED;
    this.sprintSpeed = CONFIG.PLAYER.SPRINT_SPEED;

    this.health = 100;
    this.maxHealth = 100;

    // Active vehicle reference when driving
    this.currentVehicle = null;
    this.get isInVehicle() {
      return this.currentVehicle !== null;
    }

    // Walk animation variables
    this.strideTimer = 0;
    this.footToggle = false;
    this.isMoving = false;
  }

  update(dt, cityMap, vehicles) {
    if (this.isInVehicle) {
      // Sync player coordinates with driven vehicle
      this.x = this.currentVehicle.x;
      this.y = this.currentVehicle.y;
      this.angle = this.currentVehicle.angle;
      return;
    }

    const move = input.getMovementVector();
    const speed = input.isHandbrake ? this.sprintSpeed : this.walkSpeed;

    if (Math.abs(move.x) > 0.05 || Math.abs(move.y) > 0.05) {
      this.isMoving = true;
      // Facing angle
      this.angle = Math.atan2(move.x, -move.y);

      // Desired new position
      const newX = this.x + move.x * speed * dt;
      const newY = this.y + move.y * speed * dt;

      // Check collision with city buildings
      const colX = cityMap.checkBuildingCollision(newX, this.y, this.radius);
      if (!colX.collided) {
        this.x = newX;
      }

      const colY = cityMap.checkBuildingCollision(this.x, newY, this.radius);
      if (!colY.collided) {
        this.y = newY;
      }

      // Footstep stride cycle
      this.strideTimer += dt * (speed / 24);
      if (this.strideTimer >= 1.0) {
        this.strideTimer = 0;
        this.footToggle = !this.footToggle;
      }
    } else {
      this.isMoving = false;
    }

    // World clamp
    this.x = Math.max(30, Math.min(this.x, CONFIG.WORLD_WIDTH - 30));
    this.y = Math.max(30, Math.min(this.y, CONFIG.WORLD_HEIGHT - 30));

    // Check cash pickup collision
    for (const p of cityMap.cashPickups) {
      if (!p.collected && Math.hypot(this.x - p.x, this.y - p.y) < this.radius + 16) {
        p.collected = true;
        storage.addCash(p.amount);
        audio.playCash();
        gameHUD.showNotification(`Picked up $${p.amount} Cash!`);
      }
    }
  }

  tryEnterVehicle(vehicles) {
    if (this.isInVehicle) return false;

    let closest = null;
    let minDist = CONFIG.PLAYER.ENTER_VEHICLE_DIST;

    for (const v of vehicles) {
      const d = Math.hypot(this.x - v.x, this.y - v.y);
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
      gameHUD.showNotification(`Entered ${closest.name}`);
      return true;
    }
    return false;
  }

  exitVehicle() {
    if (!this.isInVehicle) return;

    const v = this.currentVehicle;
    v.isDrivenByPlayer = false;

    // Spawn player to the left door of the car
    const sideX = -Math.cos(v.angle) * 34;
    const sideY = -Math.sin(v.angle) * 34;

    this.x = v.x + sideX;
    this.y = v.y + sideY;
    this.currentVehicle = null;

    audio.playDoor();
    gameHUD.showNotification('Exited vehicle');
  }

  render(ctx) {
    if (this.isInVehicle) return; // Hidden while driving

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // 1. Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(2, 3, 10, 0, Math.PI * 2);
    ctx.fill();

    // 2. Animated Shoes / Legs
    ctx.fillStyle = '#2c3e50';
    const offset = this.footToggle ? 4 : -4;
    ctx.fillRect(-8, offset, 5, 8);
    ctx.fillRect(3, -offset, 5, 8);

    // 3. Body / Hawaiian Shirt (Retro teal pattern)
    ctx.fillStyle = '#1abc9c';
    ctx.beginPath();
    ctx.roundRect(-9, -6, 18, 12, 4);
    ctx.fill();

    // 4. Arms & Hands (Skin tone)
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(-9, -2, 3.2, 0, Math.PI * 2);
    ctx.arc(9, -2, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Head
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Hair
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(0, -1, 6.0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Aviator Sunglasses (facing forward)
    ctx.fillStyle = '#111111';
    ctx.fillRect(-4, -5, 3.5, 2);
    ctx.fillRect(0.5, -5, 3.5, 2);

    ctx.restore();
  }
}
