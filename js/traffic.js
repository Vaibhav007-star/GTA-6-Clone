/**
 * AI Civilian Traffic & Pedestrian System
 * Simulates city vehicles following waypoints and pedestrians traversing sidewalks.
 */

class TrafficManager {
  constructor() {
    this.vehicles = [];
    this.pedestrians = [];
    this.init();
  }

  init() {
    // 1. Seed Civilian Vehicles along avenues
    const colors = ['#8e44ad', '#f39c12', '#16a085', '#d35400', '#27ae60', '#7f8c8d'];
    const routes = [
      // Route 1: Vertical 750 Ave
      {
        waypoints: [{ x: 750, y: 150 }, { x: 750, y: 2450 }],
        startX: 750,
        startY: 300,
        speed: 150
      },
      // Route 2: Vertical 1300 Ave
      {
        waypoints: [{ x: 1300, y: 2450 }, { x: 1300, y: 150 }],
        startX: 1300,
        startY: 2200,
        speed: 160
      },
      // Route 3: Horizontal 750 Ave
      {
        waypoints: [{ x: 150, y: 750 }, { x: 2450, y: 750 }],
        startX: 300,
        startY: 750,
        speed: 140
      },
      // Route 4: Horizontal 1850 Ave
      {
        waypoints: [{ x: 2450, y: 1850 }, { x: 150, y: 1850 }],
        startX: 2200,
        startY: 1850,
        speed: 155
      },
      // Route 5: Downtown Loop
      {
        waypoints: [
          { x: 1300, y: 750 },
          { x: 1850, y: 750 },
          { x: 1850, y: 1300 },
          { x: 1300, y: 1300 }
        ],
        startX: 1300,
        startY: 750,
        speed: 145
      }
    ];

    routes.forEach((r, idx) => {
      this.vehicles.push({
        x: r.startX,
        y: r.startY,
        angle: 0,
        speed: r.speed,
        waypoints: r.waypoints,
        currentWp: 0,
        color: colors[idx % colors.length],
        width: 32,
        height: 62,
        hasCollided: false
      });
    });

    // 2. Seed Pedestrians walking along sidewalks
    const pCoords = [
      { x: 700, y: 350, dir: 1, axis: 'y', min: 300, max: 650 },
      { x: 800, y: 900, dir: -1, axis: 'y', min: 800, max: 1200 },
      { x: 400, y: 700, dir: 1, axis: 'x', min: 350, max: 650 },
      { x: 1450, y: 700, dir: 1, axis: 'x', min: 1350, max: 1750 },
      { x: 950, y: 1000, dir: 1, axis: 'x', min: 880, max: 1150 } // Park pedestrian
    ];

    pCoords.forEach(p => {
      this.pedestrians.push({
        x: p.x,
        y: p.y,
        dir: p.dir,
        axis: p.axis,
        min: p.min,
        max: p.max,
        speed: 55,
        alive: true
      });
    });
  }

  update(dt, player, onCollision) {
    // 1. Update Civilian Vehicles
    for (const v of this.vehicles) {
      if (!v.waypoints || v.waypoints.length === 0) continue;

      const target = v.waypoints[v.currentWp];
      const dx = target.x - v.x;
      const dy = target.y - v.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 25) {
        v.currentWp = (v.currentWp + 1) % v.waypoints.length;
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        v.angle = Math.atan2(nx, -ny);

        v.x += nx * v.speed * dt;
        v.y += ny * v.speed * dt;
      }

      // Collision check with player / player's car
      const playerPos = player.isInVehicle ? player.currentVehicle : player;
      const playerDist = Math.hypot(v.x - playerPos.x, v.y - playerPos.y);

      if (playerDist < 42 && !v.hasCollided) {
        v.hasCollided = true;
        audio.playCrash(0.8);
        onCollision('CIVILIAN_CAR', v);

        setTimeout(() => {
          v.hasCollided = false;
        }, 4000);
      }
    }

    // 2. Update Pedestrians
    for (const p of this.pedestrians) {
      if (!p.alive) continue;

      if (p.axis === 'x') {
        p.x += p.dir * p.speed * dt;
        if (p.x > p.max || p.x < p.min) p.dir *= -1;
      } else {
        p.y += p.dir * p.speed * dt;
        if (p.y > p.max || p.y < p.min) p.dir *= -1;
      }

      // Check if run over by driven car
      if (player.isInVehicle) {
        const car = player.currentVehicle;
        if (Math.hypot(car.x - p.x, car.y - p.y) < 26 && Math.abs(car.speed) > 40) {
          p.alive = false;
          audio.playCrash(0.6);
          onCollision('PEDESTRIAN', p);
        }
      }
    }
  }

  render(ctx) {
    // Render Pedestrians
    for (const p of this.pedestrians) {
      if (!p.alive) continue;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Shirt
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(p.x - 4, p.y - 2, 8, 4);
    }

    // Render Civilian Traffic Vehicles
    for (const v of this.vehicles) {
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      const hw = v.width / 2;
      const hh = v.height / 2;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(-hw + 3, -hh + 3, v.width, v.height, 5);
      ctx.fill();

      // Tires
      ctx.fillStyle = '#111111';
      ctx.fillRect(-hw - 2, -hh + 8, 4, 12);
      ctx.fillRect(hw - 2, -hh + 8, 4, 12);
      ctx.fillRect(-hw - 2, hh - 20, 4, 12);
      ctx.fillRect(hw - 2, hh - 20, 4, 12);

      // Body
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, v.width, v.height, 5);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-hw + 3, -hh + 14, v.width - 6, 8);
      ctx.fillRect(-hw + 3, hh - 20, v.width - 6, 6);

      // Headlights
      ctx.fillStyle = '#ffff99';
      ctx.beginPath();
      ctx.arc(-hw + 4, -hh + 2, 2, 0, Math.PI * 2);
      ctx.arc(hw - 4, -hh + 2, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
