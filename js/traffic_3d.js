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
      { waypoints: [{ x: 750, z: 150 }, { x: 750, z: 2450 }], startX: 750, startZ: 300, speed: 40 },
      { waypoints: [{ x: 1300, z: 2450 }, { x: 1300, z: 150 }], startX: 1300, startZ: 2200, speed: 45 },
      { waypoints: [{ x: 150, z: 750 }, { x: 2450, z: 750 }], startX: 300, startZ: 750, speed: 38 },
      { waypoints: [{ x: 2450, z: 1850 }, { x: 150, z: 1850 }], startX: 2200, startZ: 1850, speed: 42 }
    ];

    routes.forEach((r, idx) => {
      const v = new Vehicle3D(this.scene, r.startX, r.startZ, 'SEDAN', 0, '#' + colors[idx % colors.length].toString(16));
      v.cruiseSpeed = r.speed;
      v.waypoints = r.waypoints;
      v.currentWp = 0;
      v.hasCollided = false;
      this.vehicles.push(v);
    });

    // 3D Pedestrians along sidewalks
    const pCoords = [
      { x: 700, z: 350, dir: 1, min: 300, max: 650 },
      { x: 800, z: 900, dir: -1, min: 800, max: 1200 },
      { x: 950, z: 1000, dir: 1, min: 880, max: 1150 }
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

