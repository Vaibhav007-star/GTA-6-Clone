/**
 * 3D Open-World City Map Generator
 * Builds roads, sidewalks, 3D buildings, parks, trees, streetlights, and pickup collectibles.
 */

class CityMap3D {
  constructor(scene) {
    this.scene = scene;
    this.width = CONFIG.WORLD_WIDTH;
    this.height = CONFIG.WORLD_HEIGHT;
    this.roadWidth = CONFIG.ROAD_WIDTH;

    this.buildings = [];
    this.colliders = [];
    this.cashPickups = [];
    this.roads = { vertical: [250, 750, 1300, 1850, 2350], horizontal: [250, 750, 1300, 1850, 2350] };

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildGround();
    this.buildRoadsAndSidewalks();
    this.buildParks();
    this.buildCityBuildings();
    this.buildStreetlights();
    this.buildCashPickups();
  }

  buildGround() {
    const groundGeo = new THREE.PlaneGeometry(this.width, this.height);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a232f,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(this.width / 2, 0, this.height / 2);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  buildRoadsAndSidewalks() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x222629,
      roughness: 0.85
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x636e72,
      roughness: 0.9
    });

    const lineMat = new THREE.MeshBasicMaterial({
      color: 0xf1c40f
    });

    // Horizontal Roads
    for (const z of this.roads.horizontal) {
      // Asphalt Road
      const roadGeo = new THREE.PlaneGeometry(this.width, this.roadWidth);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(this.width / 2, 0.05, z);
      road.receiveShadow = true;
      this.group.add(road);

      // Sidewalks North & South
      const swGeo = new THREE.BoxGeometry(this.width, 0.35, 12);
      const swNorth = new THREE.Mesh(swGeo, sidewalkMat);
      swNorth.position.set(this.width / 2, 0.18, z - this.roadWidth / 2 - 6);
      swNorth.receiveShadow = true;
      this.group.add(swNorth);

      const swSouth = new THREE.Mesh(swGeo, sidewalkMat);
      swSouth.position.set(this.width / 2, 0.18, z + this.roadWidth / 2 + 6);
      swSouth.receiveShadow = true;
      this.group.add(swSouth);

      // Center dashed yellow lane dividers
      for (let x = 10; x < this.width; x += 35) {
        const lineGeo = new THREE.PlaneGeometry(20, 2.5);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.08, z);
        this.group.add(line);
      }
    }

    // Vertical Roads
    for (const x of this.roads.vertical) {
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.height);
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.06, this.height / 2);
      road.receiveShadow = true;
      this.group.add(road);

      // Sidewalks East & West
      const swGeo = new THREE.BoxGeometry(12, 0.35, this.height);
      const swWest = new THREE.Mesh(swGeo, sidewalkMat);
      swWest.position.set(x - this.roadWidth / 2 - 6, 0.18, this.height / 2);
      swWest.receiveShadow = true;
      this.group.add(swWest);

      const swEast = new THREE.Mesh(swGeo, sidewalkMat);
      swEast.position.set(x + this.roadWidth / 2 + 6, 0.18, this.height / 2);
      swEast.receiveShadow = true;
      this.group.add(swEast);

      // Center dashed yellow lane dividers
      for (let z = 10; z < this.height; z += 35) {
        const lineGeo = new THREE.PlaneGeometry(2.5, 20);
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.09, z);
        this.group.add(line);
      }
    }
  }

  buildParks() {
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.95 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.1, metalness: 0.8 });

    // Central Green Park
    const parkGeo = new THREE.BoxGeometry(330, 0.4, 330);
    const park = new THREE.Mesh(parkGeo, grassMat);
    park.position.set(1025, 0.2, 1025);
    park.receiveShadow = true;
    this.group.add(park);

    // Park Fountain Pond
    const pondGeo = new THREE.CylinderGeometry(40, 40, 0.6, 24);
    const pond = new THREE.Mesh(pondGeo, waterMat);
    pond.position.set(1025, 0.3, 1025);
    this.group.add(pond);

    // Populate Trees
    const treePositions = [
      [900, 900], [1150, 900], [900, 1150], [1150, 1150],
      [960, 960], [1090, 960], [960, 1090], [1090, 1090]
    ];
    for (const pos of treePositions) {
      this.spawnTree(pos[0], pos[1]);
    }
  }

  spawnTree(x, z) {
    const trunkGeo = new THREE.CylinderGeometry(1.5, 2, 12, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e14 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 6, z);
    trunk.castShadow = true;
    this.group.add(trunk);

    const foliageGeo = new THREE.ConeGeometry(9, 18, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e824c, roughness: 0.8 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(x, 18, z);
    foliage.castShadow = true;
    this.group.add(foliage);
  }

  buildCityBuildings() {
    const blockRangesX = [
      { start: 360, end: 640 },
      { start: 860, end: 1190 },
      { start: 1410, end: 1740 },
      { start: 1960, end: 2240 }
    ];

    const blockRangesZ = [
      { start: 360, end: 640 },
      { start: 860, end: 1190 },
      { start: 1410, end: 1740 },
      { start: 1960, end: 2240 }
    ];

    const buildingThemes = [
      { color: 0x2c3e50, trim: 0x34495e, heights: [45, 75, 110] },
      { color: 0x34495e, trim: 0x22313f, heights: [60, 95, 130] },
      { color: 0x243342, trim: 0x1e272e, heights: [40, 70, 85] },
      { color: 0x2d3436, trim: 0x636e72, heights: [50, 80, 120] }
    ];

    let themeIdx = 0;
    for (let bx = 0; bx < blockRangesX.length; bx++) {
      for (let bz = 0; bz < blockRangesZ.length; bz++) {
        // Skip park block
        if (bx === 1 && bz === 1) continue;

        const rx = blockRangesX[bx];
        const rz = blockRangesZ[bz];
        const bw = rx.end - rx.start;
        const bd = rz.end - rz.start;
        const centerX = rx.start + bw / 2;
        const centerZ = rz.start + bd / 2;

        const theme = buildingThemes[themeIdx % buildingThemes.length];
        const height = theme.heights[(bx + bz) % theme.heights.length];
        themeIdx++;

        // Main Tower Mesh
        const bGeo = new THREE.BoxGeometry(bw, height, bd);
        const bMat = new THREE.MeshStandardMaterial({
          color: theme.color,
          roughness: 0.6,
          metalness: 0.25
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(centerX, height / 2, centerZ);
        building.castShadow = true;
        building.receiveShadow = true;
        this.group.add(building);

        // Rooftop Ledge
        const roofGeo = new THREE.BoxGeometry(bw - 12, 4, bd - 12);
        const roofMat = new THREE.MeshStandardMaterial({ color: theme.trim, roughness: 0.8 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(centerX, height + 2, centerZ);
        this.group.add(roof);

        // Rooftop AC / Utility Unit
        const acGeo = new THREE.BoxGeometry(16, 8, 16);
        const acMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(centerX, height + 6, centerZ);
        this.group.add(ac);

        // Collision box record (AABB)
        this.buildings.push({
          minX: rx.start,
          maxX: rx.end,
          minZ: rz.start,
          maxZ: rz.end,
          height: height
        });
      }
    }
  }

  buildStreetlights() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.7 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });

    const spawnLight = (x, z) => {
      const poleGeo = new THREE.CylinderGeometry(0.5, 0.7, 16, 6);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.set(x, 8, z);
      this.group.add(pole);

      const lampGeo = new THREE.SphereGeometry(1.4, 8, 8);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, 16, z);
      this.group.add(lamp);
    };

    for (const x of this.roads.vertical) {
      for (const z of this.roads.horizontal) {
        spawnLight(x - 85, z - 85);
        spawnLight(x + 85, z + 85);
      }
    }
  }

  buildCashPickups() {
    const coords = [
      [500, 700, 200],
      [1025, 1025, 500],
      [1550, 200, 150],
      [2100, 750, 300],
      [1300, 1600, 250],
      [400, 1900, 400],
      [1750, 2200, 350]
    ];

    const caseGeo = new THREE.BoxGeometry(6, 4, 2);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      metalness: 0.4,
      roughness: 0.3
    });

    for (const c of coords) {
      const mesh = new THREE.Mesh(caseGeo, caseMat);
      mesh.position.set(c[0], 4, c[1]);
      this.group.add(mesh);

      this.cashPickups.push({
        x: c[0],
        z: c[1],
        amount: c[2],
        mesh: mesh,
        collected: false
      });
    }
  }

  checkCollision(x, z, radius) {
    for (const b of this.buildings) {
      const nearX = Math.max(b.minX, Math.min(x, b.maxX));
      const nearZ = Math.max(b.minZ, Math.min(z, b.maxZ));
      const dx = x - nearX;
      const dz = z - nearZ;
      if (dx * dx + dz * dz < radius * radius) {
        return {
          collided: true,
          nearX,
          nearZ,
          overlap: radius - Math.hypot(dx, dz)
        };
      }
    }
    return { collided: false };
  }

  update(dt, playerPos) {
    const time = performance.now() * 0.003;

    // Animate Briefcases (rotation + floating bob)
    for (const p of this.cashPickups) {
      if (p.collected) continue;

      p.mesh.rotation.y += 1.8 * dt;
      p.mesh.position.y = 4 + Math.sin(time + p.x) * 1.2;

      // Pickup proximity
      if (Math.hypot(playerPos.x - p.x, playerPos.z - p.z) < 14) {
        p.collected = true;
        p.mesh.visible = false;
        storage.addCash(p.amount);
        audio.playCash();
        gameHUD.showNotification(`Collected 3D Cash Briefcase: +$${p.amount}!`);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.CityMap3D = CityMap3D;
}

