/**
 * 3D Civilian Traffic & Pedestrian Simulation
 */

class TrafficManager3D {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.pedestrians = [];
    this.init();
  }

  init() {
    const colors = [0x8e44ad, 0xf39c12, 0x16a085, 0xd35400, 0x27ae60, 0x7f8c8d];
    const routes = [
      // 1. Ocean Drive Beachfront Cruise
      { waypoints: [{ x: 2650, z: 550 }, { x: 2650, z: 2750 }], startX: 2650, startZ: 900, speed: 45 },
      // 2. North Causeway Bridge (Downtown to Vice Point across Prawn Island)
      { waypoints: [{ x: 500, z: 800 }, { x: 2650, z: 800 }], startX: 1650, startZ: 800, speed: 52 },
      // 3. Downtown Financial Avenue
      { waypoints: [{ x: 850, z: 450 }, { x: 850, z: 1950 }], startX: 850, startZ: 1100, speed: 42 },
      // 4. Starfish Island Causeway Corridor
      { waypoints: [{ x: 850, z: 1550 }, { x: 1750, z: 1550 }, { x: 2650, z: 1550 }], startX: 1750, startZ: 1550, speed: 46 },
      // 5. South Port Causeway Bridge
      { waypoints: [{ x: 2650, z: 2350 }, { x: 1200, z: 2350 }], startX: 2100, startZ: 2350, speed: 48 }
    ];

    routes.forEach((r, idx) => {
      const v = new Vehicle3D(this.scene, r.startX, r.startZ, 'SEDAN', 0, '#' + colors[idx % colors.length].toString(16));
      v.cruiseSpeed = r.speed;
      v.waypoints = r.waypoints;
      v.currentWp = 0;
      v.hasCollided = false;
      this.vehicles.push(v);
    });

    // 3D Pedestrians along Ocean Drive Palm Promenade
    const pCoords = [
      { x: 2720, z: 900, dir: 1, min: 700, max: 1300 },
      { x: 2720, z: 1500, dir: -1, min: 1350, max: 1950 },
      { x: 2720, z: 2100, dir: 1, min: 1950, max: 2600 },
      { x: 820, z: 900, dir: 1, min: 600, max: 1200 } // Downtown pedestrian
    ];

    const pedGeo = new THREE.CylinderGeometry(1.2, 1.2, 7.0, 8);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0xe67e22 });

    pCoords.forEach(p => {
      const mesh = new THREE.Mesh(pedGeo, pedMat);
      mesh.position.set(p.x, 3.5, p.z);
      this.scene.add(mesh);

      this.pedestrians.push({
        x: p.x,
        z: p.z,
        dir: p.dir,
        min: p.min,
        max: p.max,
        speed: 14,
        mesh: mesh,
        alive: true
      });
    });
  }

  update(dt, player, onCollision) {
    // 1. Update Civilian Cars
    for (const v of this.vehicles) {
      if (!v.waypoints || v.waypoints.length === 0) continue;

      const target = v.waypoints[v.currentWp];
      const dx = target.x - v.x;
      const dz = target.z - v.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 20) {
        v.currentWp = (v.currentWp + 1) % v.waypoints.length;
      } else {
        const nx = dx / dist;
        const nz = dz / dist;
        v.angle = Math.atan2(nx, nz);
        v.speed = v.cruiseSpeed;
        v.x += nx * v.speed * dt;
        v.z += nz * v.speed * dt;
      }

      v.syncPosition();

      // Collision check with player
      const pTarget = player.isInVehicle ? player.currentVehicle : player;
      const pDist = Math.hypot(v.x - pTarget.x, v.z - pTarget.z);

      if (pDist < 18 && !v.hasCollided) {
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

      p.z += p.dir * p.speed * dt;
      if (p.z > p.max || p.z < p.min) p.dir *= -1;
      p.mesh.position.z = p.z;

      if (player.isInVehicle) {
        const car = player.currentVehicle;
        if (Math.hypot(car.x - p.x, car.z - p.z) < 12 && Math.abs(car.speed) > 10) {
          p.alive = false;
          p.mesh.rotation.x = Math.PI / 2;
          p.mesh.position.y = 1.0;
          audio.playCrash(0.6);
          onCollision('PEDESTRIAN', p);
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.TrafficManager3D = TrafficManager3D;
}

