/**
 * 3D Open-World Vice Island Map Engine
 * Recreates the iconic coastal Miami / Vice City island geography:
 * - Ocean Drive beachfront with golden sand, lifeguard huts, and pastel Art Deco hotels.
 * - Biscayne Bay with animated ocean water and causeway bridges connecting the islands.
 * - Downtown Vice skyscraper financial district with rooftop helipads and neon antennas.
 * - Starfish luxury villa island with private swimming pools and fountain roundabouts.
 * - Vice Port shipping container docks and chop-shop industrial garage.
 * - Florida palm trees and streetlights optimized for RTX 3050 GPUs.
 */

class CityMap3D {
  constructor(scene) {
    this.scene = scene;
    this.width = CONFIG.WORLD_WIDTH || 3200;
    this.height = CONFIG.WORLD_HEIGHT || 3200;
    this.roadWidth = CONFIG.ROAD_WIDTH || 150;

    this.buildings = [];
    this.colliders = [];
    this.cashPickups = [];
    this.palmTrees = [];
    this.waterMesh = null;
    this.oceanTime = 0;

    // Road network definitions
    this.roads = {
      // East Island (Beach & Ocean Drive)
      beachNorthSouth: [2600, 2200],
      beachEastWest: [600, 1100, 1600, 2100, 2600],

      // West Island (Downtown & Port)
      downtownNorthSouth: [500, 950, 1350],
      downtownEastWest: [450, 800, 1200, 1600, 2200, 2650],

      // Causeway Bridges connecting East & West islands over the bay
      causeways: [
        { name: 'North Causeway', startX: 1350, endX: 2200, z: 800, width: 90 },
        { name: 'Starfish West Bridge', startX: 1350, endX: 1550, z: 1500, width: 70 },
        { name: 'Starfish East Bridge', startX: 1850, endX: 2200, z: 1500, width: 70 },
        { name: 'South Port Causeway', startX: 1350, endX: 2200, z: 2200, width: 90 }
      ]
    };

    // Shared materials
    this.roadMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.85 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.9 });
    this.laneMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.sandMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.95 });
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x006288,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88
    });

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildSurroundingOcean();
    this.buildIslandLandmasses();
    this.buildRoadNetwork();
    this.buildCausewayBridges();
    this.buildOceanDriveHotels();
    this.buildDowntownSkyscrapers();
    this.buildStarfishLuxuryMansion();
    this.buildPortContainerDocks();
    this.buildBeachAndLifeguardTowers();
    this.buildFloridaPalmTrees();
    this.buildStreetlights();
    this.buildCashPickups();
  }

  buildSurroundingOcean() {
    // Vast ocean plane surrounding the islands
    const oceanGeo = new THREE.PlaneGeometry(6000, 6000, 64, 64);
    this.waterMesh = new THREE.Mesh(oceanGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(this.width / 2, -1.2, this.height / 2);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);
  }

  buildIslandLandmasses() {
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x243342, roughness: 0.9 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.9 });

    // 1. East Island (Beach & Ocean Drive Island)
    const eastIslandGeo = new THREE.BoxGeometry(1050, 4.0, 2600);
    const eastIsland = new THREE.Mesh(eastIslandGeo, terrainMat);
    eastIsland.position.set(2525, -1.8, 1550);
    eastIsland.receiveShadow = true;
    this.group.add(eastIsland);

    // 2. West Island (Downtown Vice & Port Island)
    const westIslandGeo = new THREE.BoxGeometry(1150, 4.0, 2600);
    const westIsland = new THREE.Mesh(westIslandGeo, terrainMat);
    westIsland.position.set(850, -1.8, 1550);
    westIsland.receiveShadow = true;
    this.group.add(westIsland);

    // 3. Starfish Island (Mansion Island in the center of the bay)
    const starfishGeo = new THREE.CylinderGeometry(190, 210, 4.5, 32);
    const starfish = new THREE.Mesh(starfishGeo, grassMat);
    starfish.position.set(1700, -1.6, 1500);
    starfish.receiveShadow = true;
    this.group.add(starfish);
  }

  buildRoadNetwork() {
    // 1. East Island Roads (Ocean Drive & Cross Avenues)
    for (const x of this.roads.beachNorthSouth) {
      this.createStraightRoad(x, 250, x, 2850, this.roadWidth);
    }
    for (const z of this.roads.beachEastWest) {
      this.createStraightRoad(2000, z, 2850, z, this.roadWidth);
    }

    // 2. West Island Roads (Downtown & Port Grids)
    for (const x of this.roads.downtownNorthSouth) {
      this.createStraightRoad(x, 250, x, 2850, this.roadWidth);
    }
    for (const z of this.roads.downtownEastWest) {
      this.createStraightRoad(350, z, 1400, z, this.roadWidth);
    }
  }

  createStraightRoad(x1, z1, x2, z2, width) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const angle = Math.atan2(dx, dz);

    // Asphalt surface
    const roadGeo = new THREE.PlaneGeometry(width, length);
    const road = new THREE.Mesh(roadGeo, this.roadMat);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = angle;
    road.position.set(midX, 0.08, midZ);
    road.receiveShadow = true;
    this.group.add(road);

    // Elevated Sidewalks
    const swGeo = new THREE.BoxGeometry(14, 0.4, length);
    const leftSw = new THREE.Mesh(swGeo, this.sidewalkMat);
    leftSw.position.set(midX - Math.cos(angle) * (width / 2 + 7), 0.2, midZ + Math.sin(angle) * (width / 2 + 7));
    leftSw.rotation.y = -angle;
    leftSw.receiveShadow = true;
    this.group.add(leftSw);

    const rightSw = new THREE.Mesh(swGeo, this.sidewalkMat);
    rightSw.position.set(midX + Math.cos(angle) * (width / 2 + 7), 0.2, midZ - Math.sin(angle) * (width / 2 + 7));
    rightSw.rotation.y = -angle;
    rightSw.receiveShadow = true;
    this.group.add(rightSw);

    // Center Dashed Yellow Lane Divider
    const numDashes = Math.floor(length / 32);
    for (let i = 0; i < numDashes; i++) {
      const t = (i + 0.5) / numDashes;
      const lx = x1 + dx * t;
      const lz = z1 + dz * t;
      const dashGeo = new THREE.PlaneGeometry(2.5, 18);
      const dash = new THREE.Mesh(dashGeo, this.laneMat);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = angle;
      dash.position.set(lx, 0.12, lz);
      this.group.add(dash);
    }
  }

  buildCausewayBridges() {
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.7, metalness: 0.4 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.6 });

    for (const bridge of this.roads.causeways) {
      const length = bridge.endX - bridge.startX;
      const midX = (bridge.startX + bridge.endX) / 2;
      const z = bridge.z;

      // Bridge Deck
      const deckGeo = new THREE.BoxGeometry(length, 2.5, bridge.width);
      const deck = new THREE.Mesh(deckGeo, bridgeMat);
      deck.position.set(midX, 2.0, z);
      deck.receiveShadow = true;
      this.group.add(deck);

      // Asphalt on Bridge
      const roadGeo = new THREE.PlaneGeometry(bridge.width - 6, length);
      const road = new THREE.Mesh(roadGeo, this.roadMat);
      road.rotation.x = -Math.PI / 2;
      road.rotation.z = Math.PI / 2;
      road.position.set(midX, 3.3, z);
      this.group.add(road);

      // Safety Barriers North & South
      const barrierGeo = new THREE.BoxGeometry(length, 2.0, 1.8);
      const northBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      northBarrier.position.set(midX, 4.2, z - bridge.width / 2 + 1);
      this.group.add(northBarrier);

      const southBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      southBarrier.position.set(midX, 4.2, z + bridge.width / 2 - 1);
      this.group.add(southBarrier);

      // Giant Suspension Support Pillars in the Bay
      const pillarGeo = new THREE.BoxGeometry(16, 26, bridge.width + 18);
      const numPillars = Math.max(1, Math.floor(length / 280));
      for (let i = 1; i <= numPillars; i++) {
        const px = bridge.startX + (length / (numPillars + 1)) * i;
        const pillar = new THREE.Mesh(pillarGeo, bridgeMat);
        pillar.position.set(px, 10, z);
        pillar.castShadow = true;
        this.group.add(pillar);
      }
    }
  }

  buildOceanDriveHotels() {
    // Iconic pastel Art Deco boutique hotels along Ocean Drive (X: 2420)
    const hotelConfigs = [
      { name: 'The Flamingo', z: 750, color: 0xff7675, neon: 0xff3838, height: 42, width: 120, depth: 95 },
      { name: 'Ocean View Palms', z: 1000, color: 0x55efc4, neon: 0x00d2d3, height: 50, width: 130, depth: 105 },
      { name: 'Sunray Suites', z: 1250, color: 0xffeaa7, neon: 0xf1c40f, height: 38, width: 110, depth: 90 },
      { name: 'Neon Tropicana', z: 1500, color: 0xa29bfe, neon: 0x6c5ce7, height: 56, width: 140, depth: 110 },
      { name: 'The Deauville', z: 1750, color: 0x74b9ff, neon: 0x0984e3, height: 46, width: 125, depth: 100 },
      { name: 'South Beach Palace', z: 2000, color: 0xfd79a8, neon: 0xe84393, height: 62, width: 150, depth: 120 }
    ];

    for (const h of hotelConfigs) {
      const posX = 2420;
      const posZ = h.z;

      // 1. Hotel Main Body
      const hGeo = new THREE.BoxGeometry(h.depth, h.height, h.width);
      const hMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.6, metalness: 0.1 });
      const hotel = new THREE.Mesh(hGeo, hMat);
      hotel.position.set(posX, h.height / 2, posZ);
      hotel.castShadow = true;
      hotel.receiveShadow = true;
      this.group.add(hotel);

      // 2. Art Deco Curved Roof Spire / Crown
      const crownGeo = new THREE.CylinderGeometry(8, 14, 12, 16);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.set(posX + 10, h.height + 6, posZ);
      this.group.add(crown);

      // 3. Glowing Neon Hotel Sign on Facade
      const signGeo = new THREE.BoxGeometry(2, 6, h.width * 0.6);
      const signMat = new THREE.MeshBasicMaterial({ color: h.neon });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(posX + h.depth / 2 + 1.2, h.height * 0.75, posZ);
      this.group.add(sign);

      // Neon Spot Glow
      const neonLight = new THREE.PointLight(h.neon, 1.2, 50);
      neonLight.position.set(posX + h.depth / 2 + 6, h.height * 0.75, posZ);
      this.group.add(neonLight);

      // Collision AABB
      this.buildings.push({
        minX: posX - h.depth / 2,
        maxX: posX + h.depth / 2,
        minZ: posZ - h.width / 2,
        maxZ: posZ + h.width / 2,
        height: h.height
      });
    }
  }

  buildDowntownSkyscrapers() {
    // Downtown Vice High-Rise towers
    const skyscrapers = [
      { x: 500, z: 600, w: 160, d: 150, h: 140, color: 0x1e272e, glass: 0x34495e },
      { x: 750, z: 600, w: 150, d: 140, h: 165, color: 0x2c3e50, glass: 0x475e77, helipad: true },
      { x: 1150, z: 600, w: 140, d: 130, h: 125, color: 0x2f3640, glass: 0x22313f },
      { x: 500, z: 1000, w: 150, d: 140, h: 110, color: 0x2c3e50, glass: 0x2980b9 },
      { x: 750, z: 1000, w: 180, d: 160, h: 180, color: 0x1e272e, glass: 0x0984e3, helipad: true },
      { x: 1150, z: 1000, w: 140, d: 150, h: 135, color: 0x34495e, glass: 0x3498db },
      { x: 500, z: 1400, w: 140, d: 130, h: 120, color: 0x2c3e50, glass: 0x74b9ff },
      { x: 750, z: 1400, w: 160, d: 150, h: 150, color: 0x1e272e, glass: 0x487eb0 }
    ];

    for (const sky of skyscrapers) {
      // 1. Tower Base & Structure
      const sGeo = new THREE.BoxGeometry(sky.w, sky.h, sky.d);
      const sMat = new THREE.MeshStandardMaterial({
        color: sky.color,
        roughness: 0.35,
        metalness: 0.65
      });
      const tower = new THREE.Mesh(sGeo, sMat);
      tower.position.set(sky.x, sky.h / 2, sky.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      this.group.add(tower);

      // 2. Reflective Glass Stripes
      const glassGeo = new THREE.BoxGeometry(sky.w + 1, sky.h * 0.75, sky.d + 1);
      const glassMat = new THREE.MeshStandardMaterial({
        color: sky.glass,
        roughness: 0.15,
        metalness: 0.85
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(sky.x, sky.h * 0.45, sky.z);
      this.group.add(glass);

      // 3. Rooftop Helipad
      if (sky.helipad) {
        const padGeo = new THREE.CylinderGeometry(26, 26, 2, 24);
        const padMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(sky.x, sky.h + 1, sky.z);
        this.group.add(pad);
      }

      // 4. Rooftop Radio Antenna with Blinking Red Aviation Beacon
      const antGeo = new THREE.CylinderGeometry(0.8, 1.4, 28, 8);
      const antMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.8 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(sky.x, sky.h + 14, sky.z);
      this.group.add(ant);

      const beaconGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(sky.x, sky.h + 28, sky.z);
      this.group.add(beacon);

      // Collision AABB
      this.buildings.push({
        minX: sky.x - sky.w / 2,
        maxX: sky.x + sky.w / 2,
        minZ: sky.z - sky.d / 2,
        maxZ: sky.z + sky.d / 2,
        height: sky.h
      });
    }
  }

  buildStarfishLuxuryMansion() {
    // Luxury Starfish Island Mansion Villa (X: 1700, Z: 1500)
    const mansionMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.4 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.7 }); // Terracotta tile
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x00a8ff, roughness: 0.1, metalness: 0.8 });

    // Main Mansion Palace
    const mGeo = new THREE.BoxGeometry(110, 24, 75);
    const mansion = new THREE.Mesh(mGeo, mansionMat);
    mansion.position.set(1700, 12, 1490);
    mansion.castShadow = true;
    mansion.receiveShadow = true;
    this.group.add(mansion);

    // Terracotta Sloped Roof
    const rGeo = new THREE.ConeGeometry(75, 14, 4);
    const roof = new THREE.Mesh(rGeo, roofMat);
    roof.position.set(1700, 31, 1490);
    roof.rotation.y = Math.PI / 4;
    this.group.add(roof);

    // Swimming Pool on Mansion Deck
    const poolGeo = new THREE.BoxGeometry(45, 1.2, 28);
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(1700, 0.6, 1565);
    this.group.add(pool);

    // Front Roundabout Fountain
    const fountainGeo = new THREE.CylinderGeometry(16, 18, 4, 16);
    const fountain = new THREE.Mesh(fountainGeo, poolMat);
    fountain.position.set(1700, 2, 1410);
    this.group.add(fountain);

    this.buildings.push({
      minX: 1645,
      maxX: 1755,
      minZ: 1450,
      maxZ: 1530,
      height: 30
    });
  }

  buildPortContainerDocks() {
    // South-West Industrial Port (X: 400 to 1200, Z: 2000 to 2800)
    const containerColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0xe67e22];
    const cWidth = 14;
    const cLength = 34;
    const cHeight = 12;

    const cGeo = new THREE.BoxGeometry(cWidth, cHeight, cLength);

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const stackHeight = 1 + ((row + col) % 3);
        for (let s = 0; s < stackHeight; s++) {
          const cColor = containerColors[(row * 3 + col + s) % containerColors.length];
          const cMat = new THREE.MeshStandardMaterial({ color: cColor, metalness: 0.5, roughness: 0.5 });
          const container = new THREE.Mesh(cGeo, cMat);
          const px = 550 + col * 42;
          const pz = 2100 + row * 48;
          container.position.set(px, s * cHeight + cHeight / 2, pz);
          container.castShadow = true;
          this.group.add(container);

          this.buildings.push({
            minX: px - cWidth / 2,
            maxX: px + cWidth / 2,
            minZ: pz - cLength / 2,
            maxZ: pz + cLength / 2,
            height: (s + 1) * cHeight
          });
        }
      }
    }

    // Industrial Chop Shop Garage (X: 950, Z: 2450)
    const garageGeo = new THREE.BoxGeometry(110, 22, 90);
    const garageMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8 });
    const garage = new THREE.Mesh(garageGeo, garageMat);
    garage.position.set(950, 11, 2450);
    garage.castShadow = true;
    this.group.add(garage);

    // Glowing Neon Yellow Dropoff Bay
    const dropGeo = new THREE.BoxGeometry(22, 12, 2);
    const dropMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const dropBay = new THREE.Mesh(dropGeo, dropMat);
    dropBay.position.set(950, 6, 2404);
    this.group.add(dropBay);

    this.buildings.push({
      minX: 895,
      maxX: 1005,
      minZ: 2405,
      maxZ: 2495,
      height: 22
    });
  }

  buildBeachAndLifeguardTowers() {
    // 1. Golden Sand Beach along East Coast (X: 2750 to 3050, Z: 200 to 2900)
    const beachGeo = new THREE.BoxGeometry(320, 1.2, 2700);
    const beach = new THREE.Mesh(beachGeo, this.sandMat);
    beach.position.set(2900, -0.4, 1550);
    beach.receiveShadow = true;
    this.group.add(beach);

    // 2. Lifeguard Towers on the Beach (Pastel colors)
    const hutZCoords = [700, 1150, 1600, 2050, 2500];
    const towerColors = [0xff7675, 0x00cec9, 0xfdcb6e, 0x6c5ce7, 0x0984e3];

    hutZCoords.forEach((z, idx) => {
      const hutGeo = new THREE.BoxGeometry(12, 10, 12);
      const hutMat = new THREE.MeshStandardMaterial({ color: towerColors[idx % towerColors.length] });
      const hut = new THREE.Mesh(hutGeo, hutMat);
      hut.position.set(2920, 10, z);
      hut.castShadow = true;
      this.group.add(hut);

      // Stilts
      const stiltGeo = new THREE.CylinderGeometry(0.6, 0.6, 10, 6);
      const stiltMat = new THREE.MeshStandardMaterial({ color: 0x4a2e14 });
      const stiltOffsets = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
      for (const off of stiltOffsets) {
        const stilt = new THREE.Mesh(stiltGeo, stiltMat);
        stilt.position.set(2920 + off[0], 5, z + off[1]);
        this.group.add(stilt);
      }
    });
  }

  buildFloridaPalmTrees() {
    // Palm tree locations along Ocean Drive, beach promenade, and Starfish Island
    const palmPositions = [];

    // Ocean Drive Palm Tree rows (X: 2680 & X: 2520)
    for (let z = 600; z < 2800; z += 65) {
      palmPositions.push([2685, z]);
      palmPositions.push([2515, z]);
    }

    // Starfish Island Palms
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      palmPositions.push([1700 + Math.cos(a) * 160, 1500 + Math.sin(a) * 160]);
    }

    const trunkGeo = new THREE.CylinderGeometry(1.2, 2.0, 24, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x533827, roughness: 0.9 });

    const frondGeo = new THREE.ConeGeometry(12, 5, 8);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x218c74, roughness: 0.8 });

    for (const pos of palmPositions) {
      const palmGroup = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 12;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15; // Natural lean
      trunk.castShadow = true;
      palmGroup.add(trunk);

      const fronds = new THREE.Mesh(frondGeo, frondMat);
      fronds.position.y = 23;
      fronds.castShadow = true;
      palmGroup.add(fronds);

      palmGroup.position.set(pos[0], 0, pos[1]);
      this.group.add(palmGroup);
      this.palmTrees.push(palmGroup);
    }
  }

  buildStreetlights() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2d3436, metalness: 0.8 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });

    const spawnLight = (x, z) => {
      const poleGeo = new THREE.CylinderGeometry(0.5, 0.8, 18, 6);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.set(x, 9, z);
      this.group.add(pole);

      const lampGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, 18, z);
      this.group.add(lamp);
    };

    // Streetlights along Ocean Drive and Downtown Avenues
    for (const z of [600, 1100, 1600, 2100, 2600]) {
      spawnLight(2680, z);
      spawnLight(1350, z);
      spawnLight(950, z);
      spawnLight(500, z);
    }
  }

  buildCashPickups() {
    const coords = [
      [2600, 750, 250],   // Ocean Drive
      [2920, 1150, 400],  // Beach Lifeguard Hut
      [1700, 1500, 1000], // Starfish Island Villa
      [750, 600, 350],    // Downtown Helipad
      [1750, 800, 300],   // North Causeway Bridge
      [950, 2450, 500],   // Chop Shop Port Garage
      [2600, 2200, 300]   // South Beach Hotel
    ];

    const caseGeo = new THREE.BoxGeometry(6, 4, 2);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      metalness: 0.5,
      roughness: 0.25
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

  update(dt, player) {
    this.oceanTime += dt;

    // Animate subtle ocean water shimmer
    if (this.waterMesh) {
      this.waterMesh.position.y = -1.2 + Math.sin(this.oceanTime * 1.5) * 0.25;
    }

    // Animate cash briefcases
    for (const p of this.cashPickups) {
      if (p.collected) continue;

      p.mesh.rotation.y += 1.8 * dt;
      p.mesh.position.y = 4.0 + Math.sin(this.oceanTime * 2.5 + p.x) * 1.2;

      const pDist = Math.hypot(player.x - p.x, player.z - p.z);
      if (pDist < 16) {
        p.collected = true;
        p.mesh.visible = false;
        storage.addCash(p.amount);
        audio.playCash();
        gameHUD.showNotification(`Picked up Vice Island Cash: +$${p.amount}!`);
      }
    }

    // Ocean Hazard Check: If player drives/walks into deep ocean water outside bridges
    const isInEast = (player.x >= 1950 && player.x <= 3150 && player.z >= 200 && player.z <= 3000);
    const isInWest = (player.x >= 250 && player.x <= 1450 && player.z >= 200 && player.z <= 3000);
    const isInStarfish = Math.hypot(player.x - 1700, player.z - 1500) < 220;
    const isOnBridge = (
      (player.x >= 1350 && player.x <= 2200 && Math.abs(player.z - 800) < 55) ||
      (player.x >= 1350 && player.x <= 2200 && Math.abs(player.z - 1500) < 45) ||
      (player.x >= 1350 && player.x <= 2200 && Math.abs(player.z - 2200) < 55)
    );

    if (!isInEast && !isInWest && !isInStarfish && !isOnBridge) {
      // In the ocean! Respawn safely onto the nearest bridge/roadway
      audio.playCrash(0.6);
      gameHUD.showNotification('Fell into Biscayne Bay! Rescued to Ocean Drive.');
      if (player.isInVehicle) {
        player.currentVehicle.x = 2600;
        player.currentVehicle.z = 1500;
        player.currentVehicle.speed = 0;
      } else {
        player.x = 2600;
        player.z = 1500;
        player.y = 0;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.CityMap3D = CityMap3D;
}
