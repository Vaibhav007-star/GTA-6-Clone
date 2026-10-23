/**
 * 3D Open-World Vice City Map Engine
 * Faithfully recreates the authentic GTA Vice City geography:
 * - South-West: Escobar International Airport with crossing runways, passenger terminal concourse,
 *   air traffic control tower, radar domes, airplane hangars, and parked aircraft.
 * - South-East: Viceport Harbor with container freighter ship, gantry cranes, shipping container stacks,
 *   oil tank farm, warehouses, and chop shop garage.
 * - Center-West: Little Haiti & Little Havana commercial streets, storefronts, and alleys.
 * - North-West: Downtown Vice City with towering skyscrapers, rooftop helipads, and Hyman Memorial Arena.
 * - Central Bay: Starfish Island with Tommy Vercetti's iconic mansion, fountain courtyard, and pool;
 *   Prawn Island with InterGlobal Movie Studios; Leaf Links Golf Course with fairways and sand traps.
 * - East Island: Continuous golden beach, Ocean Beach marina, coastal lighthouse, and Ocean Drive
 *   lined with pastel Art Deco neon boutique hotels and Florida palms.
 * - Biscayne Bay: Tropical turquoise waters, shallow coastal reefs, and 4 major causeway bridges.
 *
 * Optimized for Lenovo LOQ NVIDIA RTX 3050 (6GB VRAM) & 16GB RAM.
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
    this.animatedMeshes = [];
    this.waterMesh = null;
    this.oceanTime = 0;

    // Road & Bridge network definitions
    this.roads = {
      // East Island (Ocean Drive & Cross Avenues)
      beachNorthSouth: [2650, 2450],
      beachEastWest: [500, 900, 1400, 1900, 2400, 2800],

      // West Island (Downtown, Little Haiti, Airport, Port)
      downtownNorthSouth: [500, 850, 1200],
      downtownEastWest: [450, 750, 1100, 1550, 1950, 2400],

      // Causeway Bridges connecting across Biscayne Bay
      causeways: [
        { name: 'North Causeway (Downtown - Prawn - Vice Point)', startX: 1200, endX: 2450, z: 800, width: 80 },
        { name: 'Starfish West Bridge', startX: 1200, endX: 1620, z: 1550, width: 65 },
        { name: 'Starfish East Bridge', startX: 1880, endX: 2450, z: 1550, width: 65 },
        { name: 'South Port Causeway', startX: 1400, endX: 2450, z: 2350, width: 85 }
      ]
    };

    // Shared high-performance materials
    this.roadMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.85 });
    this.runwayMat = new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.9 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.9 });
    this.laneMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    this.runwayStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sandMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.95 });
    this.grassMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.9 });
    this.fairwayMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.85 });
    this.dockMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.9 });
    this.terrainMat = new THREE.MeshStandardMaterial({ color: 0x243342, roughness: 0.9 });

    // Multi-tone Tropical Ocean Water
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      metalness: 0.8,
      roughness: 0.18,
      transparent: true,
      opacity: 0.90
    });

    this.shallowWaterMat = new THREE.MeshStandardMaterial({
      color: 0x00cec9,
      metalness: 0.6,
      roughness: 0.25,
      transparent: true,
      opacity: 0.75
    });

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Build the authentic Vice City 3D World
    this.buildSurroundingOcean();
    this.buildIslandLandmasses();
    this.buildEscobarAirport();
    this.buildViceportHarbor();
    this.buildStarfishIsland();
    this.buildPrawnIsland();
    this.buildLeafLinksGolf();
    this.buildDowntownSkyscrapers();
    this.buildHymanMemorialStadium();
    this.buildLittleHavanaHaiti();
    this.buildOceanDriveHotels();
    this.buildOceanBeachMarinaAndLighthouse();
    this.buildBeachAndLifeguardTowers();
    this.buildRoadNetwork();
    this.buildCausewayBridges();
    this.buildFloridaPalmTrees();
    this.buildStreetlights();
    this.buildCashPickups();
    this.buildStuntRamps();
  }

  /* =========================================================================
   * 1. OCEAN & ISLAND LANDMASSES
   * ========================================================================= */

  buildSurroundingOcean() {
    // Vast deep open ocean
    const oceanGeo = new THREE.PlaneGeometry(7000, 7000, 32, 32);
    this.waterMesh = new THREE.Mesh(oceanGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(this.width / 2, -1.2, this.height / 2);
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // Shallow turquoise reef shelf along East Beach & Bay coasts
    const reefEastGeo = new THREE.PlaneGeometry(600, 2800);
    const reefEast = new THREE.Mesh(reefEastGeo, this.shallowWaterMat);
    reefEast.rotation.x = -Math.PI / 2;
    reefEast.position.set(3150, -0.9, 1550);
    this.group.add(reefEast);

    const reefBayGeo = new THREE.PlaneGeometry(900, 2000);
    const reefBay = new THREE.Mesh(reefBayGeo, this.shallowWaterMat);
    reefBay.rotation.x = -Math.PI / 2;
    reefBay.position.set(1800, -0.95, 1550);
    this.group.add(reefBay);
  }

  buildIslandLandmasses() {
    // 1. East Island (Ocean Drive, Washington Beach, Vice Point)
    const eastIslandGeo = new THREE.BoxGeometry(750, 4.0, 2750);
    const eastIsland = new THREE.Mesh(eastIslandGeo, this.terrainMat);
    eastIsland.position.set(2600, -1.8, 1550);
    eastIsland.receiveShadow = true;
    this.group.add(eastIsland);

    // 2. West Island Mainland (Downtown, Little Haiti, Port, Airport)
    // Main Downtown / Little Haiti Plateau
    const westMainGeo = new THREE.BoxGeometry(1100, 4.0, 1800);
    const westMain = new THREE.Mesh(westMainGeo, this.terrainMat);
    westMain.position.set(800, -1.8, 1100);
    westMain.receiveShadow = true;
    this.group.add(westMain);

    // Airport Tarmac Plateau (South-West)
    const airportBaseGeo = new THREE.BoxGeometry(850, 4.0, 1050);
    const airportBase = new THREE.Mesh(airportBaseGeo, this.dockMat);
    airportBase.position.set(650, -1.8, 2450);
    airportBase.receiveShadow = true;
    this.group.add(airportBase);

    // Viceport Docks Plateau (South-East Mainland extending into Bay)
    const portBaseGeo = new THREE.BoxGeometry(450, 4.0, 950);
    const portBase = new THREE.Mesh(portBaseGeo, this.dockMat);
    portBase.position.set(1280, -1.8, 2450);
    portBase.receiveShadow = true;
    this.group.add(portBase);
  }

  /* =========================================================================
   * 2. ESCOBAR INTERNATIONAL AIRPORT (South-West Mainland)
   * ========================================================================= */

  buildEscobarAirport() {
    const airportGroup = new THREE.Group();

    // 1. Main Crossing Runways
    // Runway 1 (Angled SW to NE: 18/36)
    const rw1Geo = new THREE.PlaneGeometry(90, 850);
    const rw1 = new THREE.Mesh(rw1Geo, this.runwayMat);
    rw1.rotation.x = -Math.PI / 2;
    rw1.rotation.z = 0.28;
    rw1.position.set(620, 0.12, 2450);
    rw1.receiveShadow = true;
    airportGroup.add(rw1);

    // Runway 2 (Intersecting Cross Runway: 09/27)
    const rw2Geo = new THREE.PlaneGeometry(80, 800);
    const rw2 = new THREE.Mesh(rw2Geo, this.runwayMat);
    rw2.rotation.x = -Math.PI / 2;
    rw2.rotation.z = -0.55;
    rw2.position.set(650, 0.14, 2480);
    rw2.receiveShadow = true;
    airportGroup.add(rw2);

    // Dashed White Centerline Stripes on Runway 1
    for (let i = -380; i <= 380; i += 45) {
      const stripeGeo = new THREE.PlaneGeometry(3.5, 24);
      const stripe = new THREE.Mesh(stripeGeo, this.runwayStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.rotation.z = 0.28;
      const sx = 620 - Math.sin(0.28) * i;
      const sz = 2450 + Math.cos(0.28) * i;
      stripe.position.set(sx, 0.16, sz);
      airportGroup.add(stripe);
    }

    // Runway Threshold Piano-Keys (Zebra Stripes at ends)
    [-380, 380].forEach(endOffset => {
      for (let k = -28; k <= 28; k += 8) {
        const keyGeo = new THREE.PlaneGeometry(3.0, 16);
        const key = new THREE.Mesh(keyGeo, this.runwayStripeMat);
        key.rotation.x = -Math.PI / 2;
        key.rotation.z = 0.28;
        const kx = 620 - Math.sin(0.28) * endOffset + Math.cos(0.28) * k;
        const kz = 2450 + Math.cos(0.28) * endOffset + Math.sin(0.28) * k;
        key.position.set(kx, 0.17, kz);
        airportGroup.add(key);
      }
    });

    // 2. Air Traffic Control Tower (Tall cylindrical ATC tower with radar scanner)
    const towerShaftGeo = new THREE.CylinderGeometry(6, 9, 68, 16);
    const towerShaftMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.3 });
    const towerShaft = new THREE.Mesh(towerShaftGeo, towerShaftMat);
    towerShaft.position.set(380, 34, 2150);
    towerShaft.castShadow = true;
    airportGroup.add(towerShaft);

    // Glass Observation Cab
    const cabGeo = new THREE.CylinderGeometry(14, 10, 14, 16);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0984e3, metalness: 0.8, roughness: 0.1 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(380, 72, 2150);
    airportGroup.add(cab);

    // Rotating Radar Scanner Dish on Tower Roof
    const radarDishGeo = new THREE.BoxGeometry(18, 4, 2);
    const radarDishMat = new THREE.MeshStandardMaterial({ color: 0xff3838, metalness: 0.6 });
    const radarDish = new THREE.Mesh(radarDishGeo, radarDishMat);
    radarDish.position.set(380, 82, 2150);
    airportGroup.add(radarDish);
    this.animatedMeshes.push({ mesh: radarDish, rotSpeedY: 2.2 });

    this.buildings.push({
      minX: 360, maxX: 400,
      minZ: 2130, maxZ: 2170,
      height: 75
    });

    // 3. Escobar Passenger Terminal Concourse
    const termMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x74b9ff, metalness: 0.7, roughness: 0.2 });

    const termGeo = new THREE.BoxGeometry(220, 24, 75);
    const terminal = new THREE.Mesh(termGeo, termMat);
    terminal.position.set(550, 12, 2040);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    airportGroup.add(terminal);

    // Terminal Glass Facade
    const glassFrontGeo = new THREE.BoxGeometry(200, 16, 4);
    const glassFront = new THREE.Mesh(glassFrontGeo, glassMat);
    glassFront.position.set(550, 12, 2078);
    airportGroup.add(glassFront);

    // Boarding Jet Bridges (Skybridges extending toward tarmac)
    [480, 550, 620].forEach(jx => {
      const jetwayGeo = new THREE.BoxGeometry(14, 10, 38);
      const jetway = new THREE.Mesh(jetwayGeo, termMat);
      jetway.position.set(jx, 10, 2095);
      jetway.castShadow = true;
      airportGroup.add(jetway);
    });

    this.buildings.push({
      minX: 430, maxX: 670,
      minZ: 2000, maxZ: 2115,
      height: 25
    });

    // 4. Large Aircraft Hangars (Curved/Arched Roofs)
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.5, roughness: 0.5 });
    const hangarXPositions = [820, 940];
    hangarXPositions.forEach(hx => {
      const hBaseGeo = new THREE.BoxGeometry(90, 22, 110);
      const hBase = new THREE.Mesh(hBaseGeo, hangarMat);
      hBase.position.set(hx, 11, 2180);
      hBase.castShadow = true;
      hBase.receiveShadow = true;
      airportGroup.add(hBase);

      // Curved Barrel Vault Roof
      const roofGeo = new THREE.CylinderGeometry(45, 45, 110, 16, 1, false, 0, Math.PI);
      const roof = new THREE.Mesh(roofGeo, hangarMat);
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.set(hx, 22, 2180);
      roof.castShadow = true;
      airportGroup.add(roof);

      this.buildings.push({
        minX: hx - 46, maxX: hx + 46,
        minZ: 2120, maxZ: 2240,
        height: 32
      });
    });

    // 5. Spherical Aviation Radar Domes
    [320, 370].forEach((rx, idx) => {
      const domeGeo = new THREE.SphereGeometry(14, 16, 16);
      const domeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(rx, 14, 2300 + idx * 45);
      dome.castShadow = true;
      airportGroup.add(dome);

      this.buildings.push({
        minX: rx - 14, maxX: rx + 14,
        minZ: 2285 + idx * 45, maxZ: 2315 + idx * 45,
        height: 28
      });
    });

    // 6. Parked Commercial Airliners on Tarmac
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, metalness: 0.4 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.6 });
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.8 });

    const planes = [
      { x: 480, z: 2150, angle: 0.1 },
      { x: 620, z: 2160, angle: -0.2 }
    ];

    planes.forEach(pl => {
      const plane = new THREE.Group();

      // Fuselage
      const fuseGeo = new THREE.CylinderGeometry(4.5, 4.5, 68, 16);
      const fuse = new THREE.Mesh(fuseGeo, planeMat);
      fuse.rotation.x = Math.PI / 2;
      fuse.position.y = 7.5;
      fuse.castShadow = true;
      plane.add(fuse);

      // Nose Cone
      const noseGeo = new THREE.ConeGeometry(4.5, 12, 16);
      const nose = new THREE.Mesh(noseGeo, planeMat);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, 7.5, 40);
      plane.add(nose);

      // Swept Main Wings
      const wingGeo = new THREE.BoxGeometry(64, 1.2, 14);
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.position.set(0, 7.0, 4);
      wings.castShadow = true;
      plane.add(wings);

      // Tail Fin (Vertical Stabilizer)
      const tailGeo = new THREE.BoxGeometry(1.2, 16, 14);
      const tail = new THREE.Mesh(tailGeo, wingMat);
      tail.position.set(0, 15, -28);
      plane.add(tail);

      // Jet Engines under wings
      [-16, 16].forEach(ex => {
        const engGeo = new THREE.CylinderGeometry(2.2, 2.2, 10, 12);
        const eng = new THREE.Mesh(engGeo, engineMat);
        eng.rotation.x = Math.PI / 2;
        eng.position.set(ex, 4.5, 2);
        plane.add(eng);
      });

      plane.position.set(pl.x, 0, pl.z);
      plane.rotation.y = pl.angle;
      airportGroup.add(plane);

      this.buildings.push({
        minX: pl.x - 30, maxX: pl.x + 30,
        minZ: pl.z - 30, maxZ: pl.z + 30,
        height: 18
      });
    });

    this.group.add(airportGroup);
  }

  /* =========================================================================
   * 3. VICEPORT INDUSTRIAL HARBOR (South-East Mainland)
   * ========================================================================= */

  buildViceportHarbor() {
    const portGroup = new THREE.Group();

    // 1. Giant Container Cargo Freighter Ship Moored at the Harbor Pier (X: 1420, Z: 2600)
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.7, metalness: 0.3 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 });
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.4 });

    const shipGroup = new THREE.Group();

    // Ship Hull
    const hullGeo = new THREE.BoxGeometry(38, 22, 210);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(0, 9, 0);
    hull.castShadow = true;
    shipGroup.add(hull);

    // Pointed Bow (Forward)
    const bowGeo = new THREE.ConeGeometry(19, 36, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.rotation.x = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 9, 118);
    shipGroup.add(bow);

    // Cargo Deck with Containers on Ship
    const colors = [0xe74c3c, 0x2980b9, 0x27ae60, 0xf39c12, 0x8e44ad];
    for (let row = -3; row <= 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const cGeo = new THREE.BoxGeometry(9, 8, 24);
        const cMat = new THREE.MeshStandardMaterial({ color: colors[Math.abs(row * 2 + col) % colors.length] });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(col * 11, 24, row * 28 + 15);
        cMesh.castShadow = true;
        shipGroup.add(cMesh);
      }
    }

    // Aft Bridge Tower (Superstructure & Smokestack)
    const bGeo = new THREE.BoxGeometry(32, 24, 28);
    const bMesh = new THREE.Mesh(bGeo, bridgeMat);
    bMesh.position.set(0, 30, -75);
    bMesh.castShadow = true;
    shipGroup.add(bMesh);

    const smokeGeo = new THREE.CylinderGeometry(3.5, 4.5, 18, 12);
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const smokestack = new THREE.Mesh(smokeGeo, smokeMat);
    smokestack.position.set(0, 48, -75);
    shipGroup.add(smokestack);

    shipGroup.position.set(1420, 0, 2580);
    portGroup.add(shipGroup);

    this.buildings.push({
      minX: 1395, maxX: 1445,
      minZ: 2460, maxZ: 2720,
      height: 40
    });

    // 2. Heavy Rail Gantry Cranes (Tall Red Truss Frames over berthing docks)
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xd63031, metalness: 0.7, roughness: 0.3 });
    [2450, 2650].forEach(cz => {
      const craneGroup = new THREE.Group();

      // Main Arch Legs
      const legGeo = new THREE.BoxGeometry(4, 52, 4);
      [-22, 22].forEach(lx => {
        const leg = new THREE.Mesh(legGeo, craneMat);
        leg.position.set(lx, 26, 0);
        leg.castShadow = true;
        craneGroup.add(leg);
      });

      // Top Cantilever Boom
      const boomGeo = new THREE.BoxGeometry(75, 6, 6);
      const boom = new THREE.Mesh(boomGeo, craneMat);
      boom.position.set(8, 52, 0);
      boom.castShadow = true;
      craneGroup.add(boom);

      // Operator Cab
      const cabGeo = new THREE.BoxGeometry(8, 7, 8);
      const cabMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(10, 46, 0);
      craneGroup.add(cab);

      craneGroup.position.set(1340, 0, cz);
      portGroup.add(craneGroup);

      this.buildings.push({
        minX: 1315, maxX: 1365,
        minZ: cz - 12, maxZ: cz + 12,
        height: 55
      });
    });

    // 3. Stacks of Shipping Containers on the Quayside (X: 1150 - 1300, Z: 2150 - 2450)
    const cWidth = 12;
    const cLength = 30;
    const cHeight = 10;
    const stackGeo = new THREE.BoxGeometry(cWidth, cHeight, cLength);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const stackTier = 1 + ((r + c) % 3);
        for (let s = 0; s < stackTier; s++) {
          const colHex = colors[(r * 4 + c + s) % colors.length];
          const mat = new THREE.MeshStandardMaterial({ color: colHex, metalness: 0.4, roughness: 0.5 });
          const cont = new THREE.Mesh(stackGeo, mat);
          const px = 1150 + c * 34;
          const pz = 2150 + r * 42;
          cont.position.set(px, s * cHeight + cHeight / 2, pz);
          cont.castShadow = true;
          portGroup.add(cont);

          this.buildings.push({
            minX: px - cWidth / 2, maxX: px + cWidth / 2,
            minZ: pz - cLength / 2, maxZ: pz + cLength / 2,
            height: (s + 1) * cHeight
          });
        }
      }
    }

    // 4. Cylindrical Oil / Chemical Storage Tank Farm
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.5, roughness: 0.3 });
    const tanks = [
      { x: 1120, z: 2750, r: 24, h: 28 },
      { x: 1190, z: 2750, r: 24, h: 28 },
      { x: 1260, z: 2750, r: 24, h: 28 }
    ];

    tanks.forEach(t => {
      const tGeo = new THREE.CylinderGeometry(t.r, t.r, t.h, 24);
      const tank = new THREE.Mesh(tGeo, tankMat);
      tank.position.set(t.x, t.h / 2, t.z);
      tank.castShadow = true;
      portGroup.add(tank);

      // Warning hazard stripe on tank
      const stripeGeo = new THREE.CylinderGeometry(t.r + 0.2, t.r + 0.2, 3, 24);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd63031 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(t.x, t.h * 0.75, t.z);
      portGroup.add(stripe);

      this.buildings.push({
        minX: t.x - t.r, maxX: t.x + t.r,
        minZ: t.z - t.r, maxZ: t.z + t.r,
        height: t.h
      });
    });

    // 5. Viceport Underground Chop Shop Garage (X: 1250, Z: 2050)
    const garageGeo = new THREE.BoxGeometry(110, 20, 85);
    const garageMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8 });
    const garage = new THREE.Mesh(garageGeo, garageMat);
    garage.position.set(1250, 10, 2050);
    garage.castShadow = true;
    portGroup.add(garage);

    // Glowing Neon Yellow Dropoff Doorway
    const doorGeo = new THREE.BoxGeometry(24, 12, 2);
    const doorMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(1250, 6, 2006);
    portGroup.add(door);

    this.buildings.push({
      minX: 1195, maxX: 1305,
      minZ: 2005, maxZ: 2095,
      height: 20
    });

    this.group.add(portGroup);
  }

  /* =========================================================================
   * 4. STARFISH ISLAND & TOMMY VERCETTI MANSION (Center Bay)
   * ========================================================================= */

  buildStarfishIsland() {
    const starGroup = new THREE.Group();

    // 1. Manicured Island Landmass with stone sea wall
    const islandGeo = new THREE.CylinderGeometry(230, 250, 4.5, 36);
    const island = new THREE.Mesh(islandGeo, this.grassMat);
    island.position.set(1750, -1.6, 1550);
    island.receiveShadow = true;
    starGroup.add(island);

    // Perimeter retaining sea wall
    const wallGeo = new THREE.TorusGeometry(232, 2.5, 8, 36);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, roughness: 0.8 });
    const seaWall = new THREE.Mesh(wallGeo, wallMat);
    seaWall.rotation.x = Math.PI / 2;
    seaWall.position.set(1750, 0.4, 1550);
    starGroup.add(seaWall);

    // 2. Tommy Vercetti Mansion Palace (Spanish Colonial Villa)
    const mansionMat = new THREE.MeshStandardMaterial({ color: 0xf5cd79, roughness: 0.5 }); // Iconic salmon/peach stucco
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.8 });    // Terracotta roof tile
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x00cec9, roughness: 0.1, metalness: 0.8 });

    // Main Central Hall
    const mainHallGeo = new THREE.BoxGeometry(110, 26, 75);
    const mainHall = new THREE.Mesh(mainHallGeo, mansionMat);
    mainHall.position.set(1750, 13, 1540);
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    starGroup.add(mainHall);

    // Terracotta Sloped Hip Roof
    const roofGeo = new THREE.ConeGeometry(75, 15, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(1750, 33, 1540);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    starGroup.add(roof);

    // East & West Wings
    [-65, 65].forEach(wx => {
      const wingGeo = new THREE.BoxGeometry(45, 20, 55);
      const wing = new THREE.Mesh(wingGeo, mansionMat);
      wing.position.set(1750 + wx, 10, 1540);
      wing.castShadow = true;
      wing.receiveShadow = true;
      starGroup.add(wing);

      const wingRoofGeo = new THREE.ConeGeometry(36, 10, 4);
      const wingRoof = new THREE.Mesh(wingRoofGeo, roofMat);
      wingRoof.position.set(1750 + wx, 25, 1540);
      wingRoof.rotation.y = Math.PI / 4;
      starGroup.add(wingRoof);
    });

    // Sweeping Entrance Staircase Portico
    const stairsGeo = new THREE.BoxGeometry(36, 6, 24);
    const stairs = new THREE.Mesh(stairsGeo, mansionMat);
    stairs.position.set(1750, 3, 1492);
    starGroup.add(stairs);

    // Front Roundabout with Multi-tier Fountain
    const fountainBaseGeo = new THREE.CylinderGeometry(18, 20, 3, 20);
    const fountain = new THREE.Mesh(fountainBaseGeo, poolMat);
    fountain.position.set(1750, 1.5, 1445);
    starGroup.add(fountain);

    const fTierGeo = new THREE.CylinderGeometry(7, 9, 4, 16);
    const fTier = new THREE.Mesh(fTierGeo, mansionMat);
    fTier.position.set(1750, 4.5, 1445);
    starGroup.add(fTier);

    // Luxury Swimming Pool on Backyard Deck overlooking the Bay
    const poolGeo = new THREE.BoxGeometry(55, 1.5, 34);
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(1750, 0.6, 1625);
    starGroup.add(pool);

    // Sun Loungers by the pool
    [-18, 0, 18].forEach(lx => {
      const loungerGeo = new THREE.BoxGeometry(5, 2, 10);
      const loungerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const lounger = new THREE.Mesh(loungerGeo, loungerMat);
      lounger.position.set(1750 + lx, 1.2, 1650);
      starGroup.add(lounger);
    });

    this.buildings.push({
      minX: 1675, maxX: 1825,
      minZ: 1480, maxZ: 1600,
      height: 35
    });

    // 3. Neighboring Luxury Villas with Private Boat Docks
    const villas = [
      { x: 1620, z: 1600, w: 42, d: 42, color: 0xff7675 },
      { x: 1880, z: 1600, w: 45, d: 42, color: 0x74b9ff }
    ];

    villas.forEach(v => {
      const vGeo = new THREE.BoxGeometry(v.w, 16, v.d);
      const vMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.6 });
      const villa = new THREE.Mesh(vGeo, vMat);
      villa.position.set(v.x, 8, v.z);
      villa.castShadow = true;
      starGroup.add(villa);

      this.buildings.push({
        minX: v.x - v.w / 2, maxX: v.x + v.w / 2,
        minZ: v.z - v.d / 2, maxZ: v.z + v.d / 2,
        height: 18
      });
    });

    this.group.add(starGroup);
  }

  /* =========================================================================
   * 5. PRAWN ISLAND (North Bay Movie Studios & Mansions)
   * ========================================================================= */

  buildPrawnIsland() {
    const prawnGroup = new THREE.Group();

    // 1. Island Landmass
    const islandGeo = new THREE.CylinderGeometry(150, 170, 4.5, 32);
    const island = new THREE.Mesh(islandGeo, this.grassMat);
    island.position.set(1650, -1.6, 800);
    island.receiveShadow = true;
    prawnGroup.add(island);

    // 2. InterGlobal Movie Studios Soundstage Buildings
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.6 });

    // Stage A & Stage B Soundstages
    [750, 850].forEach((sz, idx) => {
      const sGeo = new THREE.BoxGeometry(90, 24, 65);
      const stage = new THREE.Mesh(sGeo, stageMat);
      stage.position.set(1640, 12, sz);
      stage.castShadow = true;
      stage.receiveShadow = true;
      prawnGroup.add(stage);

      // Soundstage Yellow Studio Door
      const doorGeo = new THREE.BoxGeometry(20, 14, 2);
      const doorMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(1640, 7, sz - 33);
      prawnGroup.add(door);

      this.buildings.push({
        minX: 1590, maxX: 1690,
        minZ: sz - 34, maxZ: sz + 34,
        height: 25
      });
    });

    // 3. Movie Prop on Lot (Sci-Fi Spaceship Prop)
    const saucerGeo = new THREE.CylinderGeometry(14, 18, 4, 16);
    const saucerMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.9, roughness: 0.2 });
    const saucer = new THREE.Mesh(saucerGeo, saucerMat);
    saucer.position.set(1720, 4, 800);
    saucer.castShadow = true;
    prawnGroup.add(saucer);

    this.group.add(prawnGroup);
  }

  /* =========================================================================
   * 6. LEAF LINKS GOLF COURSE (Bay Club Island)
   * ========================================================================= */

  buildLeafLinksGolf() {
    const golfGroup = new THREE.Group();

    // 1. Contoured Golf Fairway Island
    const islandGeo = new THREE.CylinderGeometry(160, 180, 4.5, 32);
    const island = new THREE.Mesh(islandGeo, this.fairwayMat);
    island.position.set(2000, -1.6, 1150);
    island.receiveShadow = true;
    golfGroup.add(island);

    // 2. Sand Traps (Bunkers carved into the greens)
    const bunkerPositions = [
      { x: 1960, z: 1120, r: 16 },
      { x: 2040, z: 1180, r: 20 },
      { x: 2010, z: 1100, r: 14 }
    ];

    bunkerPositions.forEach(b => {
      const bunkerGeo = new THREE.CylinderGeometry(b.r, b.r + 2, 0.4, 16);
      const bunker = new THREE.Mesh(bunkerGeo, this.sandMat);
      bunker.position.set(b.x, 0.2, b.z);
      golfGroup.add(bunker);
    });

    // 3. Water Hazard Lake
    const lakeGeo = new THREE.CylinderGeometry(26, 28, 0.6, 16);
    const lakeMat = new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.2, metalness: 0.6 });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.position.set(1980, 0.15, 1200);
    golfGroup.add(lake);

    // 4. Leaf Links Golf Clubhouse Pavilion
    const clubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const clubRoofMat = new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.5 });

    const clubGeo = new THREE.BoxGeometry(60, 16, 45);
    const clubhouse = new THREE.Mesh(clubGeo, clubMat);
    clubhouse.position.set(2050, 8, 1130);
    clubhouse.castShadow = true;
    golfGroup.add(clubhouse);

    const cRoofGeo = new THREE.ConeGeometry(40, 10, 4);
    const cRoof = new THREE.Mesh(cRoofGeo, clubRoofMat);
    cRoof.position.set(2050, 20, 1130);
    cRoof.rotation.y = Math.PI / 4;
    golfGroup.add(cRoof);

    this.buildings.push({
      minX: 2015, maxX: 2085,
      minZ: 1105, maxZ: 1155,
      height: 22
    });

    this.group.add(golfGroup);
  }

  /* =========================================================================
   * 7. DOWNTOWN VICE CITY & HYMAN MEMORIAL STADIUM (North-West)
   * ========================================================================= */

  buildDowntownSkyscrapers() {
    const downtownGroup = new THREE.Group();

    // High-Rise Financial District Skyscraper Definitions
    const skyscrapers = [
      // Block 1 (North-West Downtown)
      { x: 500, z: 500, w: 140, d: 130, h: 165, color: 0x1e272e, glass: 0x34495e, helipad: true },
      { x: 750, z: 500, w: 160, d: 150, h: 210, color: 0x2c3e50, glass: 0x0984e3, antenna: true }, // VCN Tower
      { x: 1050, z: 500, w: 130, d: 120, h: 145, color: 0x2f3640, glass: 0x74b9ff },

      // Block 2 (Central Downtown)
      { x: 500, z: 850, w: 150, d: 140, h: 130, color: 0x2c3e50, glass: 0x2980b9 },
      { x: 800, z: 850, w: 180, d: 160, h: 190, color: 0x1e272e, glass: 0x487eb0, helipad: true },
      { x: 1100, z: 850, w: 140, d: 140, h: 155, color: 0x34495e, glass: 0x3498db },

      // Block 3 (South Downtown / Little Haiti Border)
      { x: 500, z: 1200, w: 130, d: 120, h: 115, color: 0x2c3e50, glass: 0x576574 },
      { x: 800, z: 1200, w: 150, d: 140, h: 140, color: 0x1e272e, glass: 0x22313f }
    ];

    for (const sky of skyscrapers) {
      // 1. Tower Body
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
      downtownGroup.add(tower);

      // 2. Reflective Curtain Glass Bands
      const glassGeo = new THREE.BoxGeometry(sky.w + 1.5, sky.h * 0.72, sky.d + 1.5);
      const glassMat = new THREE.MeshStandardMaterial({
        color: sky.glass,
        roughness: 0.12,
        metalness: 0.88
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(sky.x, sky.h * 0.45, sky.z);
      downtownGroup.add(glass);

      // 3. Rooftop Helipad
      if (sky.helipad) {
        const padGeo = new THREE.CylinderGeometry(28, 28, 2, 24);
        const padMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(sky.x, sky.h + 1, sky.z);
        downtownGroup.add(pad);
      }

      // 4. Rooftop Radio Antenna with Blinking Red Aviation Beacon
      if (sky.antenna) {
        const antGeo = new THREE.CylinderGeometry(1.0, 1.8, 36, 8);
        const antMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.8 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(sky.x, sky.h + 18, sky.z);
        downtownGroup.add(ant);

        const beaconGeo = new THREE.SphereGeometry(2.0, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(sky.x, sky.h + 36, sky.z);
        downtownGroup.add(beacon);
      }

      // Collision AABB
      this.buildings.push({
        minX: sky.x - sky.w / 2, maxX: sky.x + sky.w / 2,
        minZ: sky.z - sky.d / 2, maxZ: sky.z + sky.d / 2,
        height: sky.h
      });
    }

    this.group.add(downtownGroup);
  }

  buildHymanMemorialStadium() {
    // Massive Arena / Stadium on northern tip of Downtown (X: 750, Z: 240)
    const stadiumGroup = new THREE.Group();

    // Tiered Oval Stadium Arena Structure
    const arenaMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.5 });
    const arenaGeo = new THREE.CylinderGeometry(110, 130, 36, 32);
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(750, 18, 240);
    arena.castShadow = true;
    arena.receiveShadow = true;
    stadiumGroup.add(arena);

    // Dark Sunken Center Dome / Pitch
    const pitchGeo = new THREE.CylinderGeometry(85, 85, 4, 32);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.position.set(750, 36, 240);
    stadiumGroup.add(pitch);

    // Floodlight Masts
    const lightAngles = [0.25, 0.75, 1.25, 1.75];
    lightAngles.forEach(ang => {
      const mastGeo = new THREE.CylinderGeometry(1.2, 1.8, 38, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      const mx = 750 + Math.cos(ang * Math.PI) * 115;
      const mz = 240 + Math.sin(ang * Math.PI) * 115;
      mast.position.set(mx, 40, mz);
      stadiumGroup.add(mast);
    });

    this.buildings.push({
      minX: 620, maxX: 880,
      minZ: 110, maxZ: 370,
      height: 42
    });

    this.group.add(stadiumGroup);
  }

  /* =========================================================================
   * 8. LITTLE HAITI & LITTLE HAVANA (Center-West Mainland)
   * ========================================================================= */

  buildLittleHavanaHaiti() {
    const urbanGroup = new THREE.Group();

    // 2-3 Story Latin Pastel Buildings, Print Works, Auto Repair
    const urbanBlocks = [
      { x: 500, z: 1550, w: 90, d: 75, h: 26, color: 0xf39c12 }, // Kaufman Cabs
      { x: 680, z: 1550, w: 110, d: 80, h: 32, color: 0x16a085 }, // Little Havana Cafe
      { x: 920, z: 1550, w: 95, d: 75, h: 28, color: 0xd35400 },  // Print Works
      { x: 500, z: 1800, w: 100, d: 80, h: 30, color: 0x8e44ad }, // Pawn Shop
      { x: 720, z: 1800, w: 110, d: 85, h: 34, color: 0x27ae60 }, // Phil's Place Depot
      { x: 950, z: 1800, w: 95, d: 80, h: 28, color: 0xc0392b }   // Bodega
    ];

    urbanBlocks.forEach(b => {
      const bGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const bMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.7 });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(b.x, b.h / 2, b.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      urbanGroup.add(bMesh);

      // Storefront Awning Canopy
      const awnGeo = new THREE.BoxGeometry(b.w * 0.7, 2, 10);
      const awnMat = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
      const awning = new THREE.Mesh(awnGeo, awnMat);
      awning.position.set(b.x, 8, b.z + b.d / 2 + 5);
      urbanGroup.add(awning);

      this.buildings.push({
        minX: b.x - b.w / 2, maxX: b.x + b.w / 2,
        minZ: b.z - b.d / 2, maxZ: b.z + b.d / 2,
        height: b.h
      });
    });

    this.group.add(urbanGroup);
  }

  /* =========================================================================
   * 9. OCEAN DRIVE PASTEL ART DECO HOTELS (East Beach Island)
   * ========================================================================= */

  buildOceanDriveHotels() {
    const hotelGroup = new THREE.Group();

    // Iconic pastel Art Deco boutique hotels along Ocean Drive (X: 2520)
    const hotelConfigs = [
      { name: 'The Colony', z: 650, color: 0x55efc4, neon: 0x00cec9, height: 46, width: 110, depth: 90, tower: true },
      { name: 'The Beacon', z: 900, color: 0xff7675, neon: 0xd63031, height: 52, width: 125, depth: 95, tower: true },
      { name: 'Sunray Suites', z: 1150, color: 0xffeaa7, neon: 0xf1c40f, height: 42, width: 110, depth: 85 },
      { name: 'The Cleavelander', z: 1400, color: 0xa29bfe, neon: 0x6c5ce7, height: 58, width: 135, depth: 105, tower: true },
      { name: 'The Cavalier', z: 1650, color: 0x74b9ff, neon: 0x0984e3, height: 48, width: 120, depth: 95 },
      { name: 'South Beach Palace', z: 1900, color: 0xfd79a8, neon: 0xe84393, height: 64, width: 145, depth: 110, tower: true },
      { name: 'The Versace Villa', z: 2150, color: 0xf5cd79, neon: 0xf39c12, height: 38, width: 115, depth: 90 }
    ];

    for (const h of hotelConfigs) {
      const posX = 2520;
      const posZ = h.z;

      // 1. Hotel Main Body
      const hGeo = new THREE.BoxGeometry(h.depth, h.height, h.width);
      const hMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.5, metalness: 0.1 });
      const hotel = new THREE.Mesh(hGeo, hMat);
      hotel.position.set(posX, h.height / 2, posZ);
      hotel.castShadow = true;
      hotel.receiveShadow = true;
      hotelGroup.add(hotel);

      // 2. Art Deco Stepped Spire / Clock Tower
      if (h.tower) {
        const spireGeo = new THREE.CylinderGeometry(7, 12, 18, 16);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(posX + 8, h.height + 9, posZ);
        hotelGroup.add(spire);
      }

      // 3. Glowing Neon Hotel Sign on Facade Facing Ocean Drive
      const signGeo = new THREE.BoxGeometry(2, 6, h.width * 0.6);
      const signMat = new THREE.MeshBasicMaterial({ color: h.neon });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(posX + h.depth / 2 + 1.2, h.height * 0.72, posZ);
      hotelGroup.add(sign);

      // Point Glow on Facade
      const neonLight = new THREE.PointLight(h.neon, 1.2, 55);
      neonLight.position.set(posX + h.depth / 2 + 5, h.height * 0.72, posZ);
      hotelGroup.add(neonLight);

      this.buildings.push({
        minX: posX - h.depth / 2, maxX: posX + h.depth / 2,
        minZ: posZ - h.width / 2, maxZ: posZ + h.width / 2,
        height: h.height
      });
    }

    this.group.add(hotelGroup);
  }

  /* =========================================================================
   * 10. OCEAN BEACH MARINA & LIGHTHOUSE (South-East Island Tip)
   * ========================================================================= */

  buildOceanBeachMarinaAndLighthouse() {
    const obGroup = new THREE.Group();

    // 1. Ocean Beach Lighthouse on Grassy Headland (X: 2700, Z: 2880)
    const lhBaseGeo = new THREE.CylinderGeometry(14, 18, 12, 16);
    const lhBaseMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
    const lhBase = new THREE.Mesh(lhBaseGeo, lhBaseMat);
    lhBase.position.set(2700, 6, 2880);
    obGroup.add(lhBase);

    // Tapered Red-and-White Banded Lighthouse Tower
    const lhTowerGeo = new THREE.CylinderGeometry(6, 12, 52, 16);
    const lhTowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const lhTower = new THREE.Mesh(lhTowerGeo, lhTowerMat);
    lhTower.position.set(2700, 38, 2880);
    lhTower.castShadow = true;
    obGroup.add(lhTower);

    // Red Stripe on Lighthouse
    const redStripeGeo = new THREE.CylinderGeometry(8.5, 9.5, 12, 16);
    const redStripeMat = new THREE.MeshBasicMaterial({ color: 0xd63031 });
    const redStripe = new THREE.Mesh(redStripeGeo, redStripeMat);
    redStripe.position.set(2700, 38, 2880);
    obGroup.add(redStripe);

    // Glass Lantern Room & Beacon Light
    const lanternGeo = new THREE.CylinderGeometry(8, 8, 10, 12);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfffa65 });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(2700, 68, 2880);
    obGroup.add(lantern);

    // Rotating Lighthouse Light Beam
    const beamGeo = new THREE.ConeGeometry(24, 80, 16);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfffa65, transparent: true, opacity: 0.35 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(2700, 68, 2920);
    obGroup.add(beam);
    this.animatedMeshes.push({ mesh: beam, rotSpeedY: 1.8 });

    this.buildings.push({
      minX: 2680, maxX: 2720,
      minZ: 2860, maxZ: 2900,
      height: 72
    });

    // 2. Ocean Beach Marina Wooden Boat Docks (X: 2380, Z: 2650)
    const dockWoodMat = new THREE.MeshStandardMaterial({ color: 0x533827, roughness: 0.9 });
    const mainPierGeo = new THREE.BoxGeometry(16, 2.5, 160);
    const mainPier = new THREE.Mesh(mainPierGeo, dockWoodMat);
    mainPier.position.set(2380, 1.2, 2650);
    obGroup.add(mainPier);

    // Finger piers with luxury yachts
    [2600, 2650, 2700].forEach((pz, idx) => {
      const fingerGeo = new THREE.BoxGeometry(45, 2.0, 8);
      const finger = new THREE.Mesh(fingerGeo, dockWoodMat);
      finger.position.set(2350, 1.2, pz);
      obGroup.add(finger);

      // Moored Speedboat / Yacht
      const yachtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const boatGeo = new THREE.BoxGeometry(12, 6, 26);
      const boat = new THREE.Mesh(boatGeo, yachtMat);
      boat.position.set(2335, 2.5, pz + 12);
      boat.castShadow = true;
      obGroup.add(boat);
    });

    this.group.add(obGroup);
  }

  /* =========================================================================
   * 11. BEACH & LIFEGUARD TOWERS (East Coast)
   * ========================================================================= */

  buildBeachAndLifeguardTowers() {
    const beachGroup = new THREE.Group();

    // 1. Continuous Golden Sand Beach along East Coast (X: 2820 to 3120, Z: 250 to 2850)
    const beachGeo = new THREE.BoxGeometry(320, 1.4, 2650);
    const beach = new THREE.Mesh(beachGeo, this.sandMat);
    beach.position.set(2950, -0.4, 1550);
    beach.receiveShadow = true;
    beachGroup.add(beach);

    // 2. Lifeguard Huts on the Beach (Pastel striped huts on wooden stilts)
    const hutZCoords = [550, 950, 1350, 1750, 2150, 2550];
    const towerColors = [0xff7675, 0x00cec9, 0xfdcb6e, 0x6c5ce7, 0x0984e3, 0x2ecc71];

    hutZCoords.forEach((z, idx) => {
      const hutGeo = new THREE.BoxGeometry(12, 10, 12);
      const hutMat = new THREE.MeshStandardMaterial({ color: towerColors[idx % towerColors.length] });
      const hut = new THREE.Mesh(hutGeo, hutMat);
      hut.position.set(2980, 10, z);
      hut.castShadow = true;
      beachGroup.add(hut);

      // Stilts
      const stiltGeo = new THREE.CylinderGeometry(0.6, 0.6, 10, 6);
      const stiltMat = new THREE.MeshStandardMaterial({ color: 0x4a2e14 });
      const stiltOffsets = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
      for (const off of stiltOffsets) {
        const stilt = new THREE.Mesh(stiltGeo, stiltMat);
        stilt.position.set(2980 + off[0], 5, z + off[1]);
        beachGroup.add(stilt);
      }
    });

    this.group.add(beachGroup);
  }

  /* =========================================================================
   * 12. ROAD NETWORK & CAUSEWAY BRIDGES
   * ========================================================================= */

  buildRoadNetwork() {
    // 1. East Beach Island Roads (Ocean Drive & Cross Avenues)
    for (const x of this.roads.beachNorthSouth) {
      this.createStraightRoad(x, 250, x, 2850, this.roadWidth);
    }
    for (const z of this.roads.beachEastWest) {
      this.createStraightRoad(2400, z, 2750, z, this.roadWidth);
    }

    // 2. West Island Roads (Downtown, Little Haiti, Port grids)
    for (const x of this.roads.downtownNorthSouth) {
      this.createStraightRoad(x, 250, x, 2850, this.roadWidth);
    }
    for (const z of this.roads.downtownEastWest) {
      this.createStraightRoad(350, z, 1350, z, this.roadWidth);
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

      // Safety Guardrails North & South
      const barrierGeo = new THREE.BoxGeometry(length, 2.2, 1.8);
      const northBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      northBarrier.position.set(midX, 4.3, z - bridge.width / 2 + 1);
      this.group.add(northBarrier);

      const southBarrier = new THREE.Mesh(barrierGeo, barrierMat);
      southBarrier.position.set(midX, 4.3, z + bridge.width / 2 - 1);
      this.group.add(southBarrier);

      // Giant Concrete Support Pillars Anchored in Biscayne Bay
      const pillarGeo = new THREE.BoxGeometry(16, 28, bridge.width + 16);
      const numPillars = Math.max(1, Math.floor(length / 260));
      for (let i = 1; i <= numPillars; i++) {
        const px = bridge.startX + (length / (numPillars + 1)) * i;
        const pillar = new THREE.Mesh(pillarGeo, bridgeMat);
        pillar.position.set(px, 11, z);
        pillar.castShadow = true;
        this.group.add(pillar);
      }
    }
  }

  /* =========================================================================
   * 13. FLORIDA PALM TREES, LIGHTS & COLLECTIBLES
   * ========================================================================= */

  buildFloridaPalmTrees() {
    const palmPositions = [];

    // Ocean Drive Palm Rows (along both sides of the boulevard)
    for (let z = 550; z < 2750; z += 65) {
      palmPositions.push([2735, z]);
      palmPositions.push([2565, z]);
    }

    // Starfish Island Palms encircling Tommy's mansion
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      palmPositions.push([1750 + Math.cos(a) * 180, 1550 + Math.sin(a) * 180]);
    }

    // Leaf Links Golf Island Palms
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      palmPositions.push([2000 + Math.cos(a) * 140, 1150 + Math.sin(a) * 140]);
    }

    const trunkGeo = new THREE.CylinderGeometry(1.2, 2.0, 24, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x533827, roughness: 0.9 });

    const frondGeo = new THREE.ConeGeometry(12, 5, 8);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x218c74, roughness: 0.8 });

    for (const pos of palmPositions) {
      const palmGroup = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 12;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
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

    // Streetlights along Ocean Drive, Downtown, and Airport perimeter
    for (const z of [500, 900, 1400, 1900, 2400, 2800]) {
      spawnLight(2730, z);
      spawnLight(1200, z);
      spawnLight(850, z);
      spawnLight(500, z);
    }
  }

  buildCashPickups() {
    // Hidden Vice City cash briefcases across key landmarks
    const coords = [
      [2650, 750, 300],   // Ocean Drive
      [2980, 1350, 450],  // Beach Lifeguard Hut
      [1750, 1540, 1200], // Starfish Island Vercetti Mansion
      [750, 500, 400],    // Downtown Helipad
      [650, 2450, 500],   // Escobar Airport Runway
      [1420, 2580, 750],  // Viceport Container Cargo Ship
      [2700, 2880, 600],  // Ocean Beach Lighthouse
      [1640, 750, 350],   // Prawn Island Movie Soundstage
      [2050, 1130, 400]   // Leaf Links Golf Clubhouse
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

  buildStuntRamps() {
    this.stuntRamps = [
      { x: 620, z: 2550, angle: 0.28, name: 'Escobar Runway Super Launch' },
      { x: 1550, z: 1550, angle: Math.PI / 2, name: 'Starfish Canal Leap' },
      { x: 2420, z: 2650, angle: -Math.PI / 2, name: 'Ocean Beach Marina Jump' },
      { x: 850, z: 750, angle: 0, name: 'Downtown Financial Rooftop Launch' }
    ];

    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.5 });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x1e272e });

    for (const r of this.stuntRamps) {
      const rampGroup = new THREE.Group();

      // Sloped wedge box
      const wGeo = new THREE.BoxGeometry(16, 5.5, 24);
      const wedge = new THREE.Mesh(wGeo, rampMat);
      wedge.rotation.x = -0.22;
      wedge.position.set(0, 2.5, 0);
      wedge.castShadow = true;
      wedge.receiveShadow = true;
      rampGroup.add(wedge);

      // Warning hazard stripes
      for (let s = -8; s <= 8; s += 4) {
        const strGeo = new THREE.PlaneGeometry(16, 1.8);
        const str = new THREE.Mesh(strGeo, stripeMat);
        str.rotation.x = -Math.PI / 2 - 0.22;
        str.position.set(0, 2.8 + s * 0.18, s);
        rampGroup.add(str);
      }

      rampGroup.position.set(r.x, 0, r.z);
      rampGroup.rotation.y = r.angle;
      this.group.add(rampGroup);
    }
  }

  checkStuntRamp(x, z) {
    if (!this.stuntRamps) return false;
    for (const r of this.stuntRamps) {
      if (Math.hypot(x - r.x, z - r.z) < 18) {
        return true;
      }
    }
    return false;
  }

  checkPayAndSpray(x, z) {
    // Chop Shop Garage trigger coordinates
    return Math.hypot(x - 1250, z - 2050) < 32;
  }

  /* =========================================================================
   * 14. COLLISION DETECTION & UPDATE LOOP
   * ========================================================================= */

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

    // Animate radar dish, lighthouse beam
    for (const a of this.animatedMeshes) {
      if (a.rotSpeedY) a.mesh.rotation.y += a.rotSpeedY * dt;
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
        gameHUD.showNotification(`Picked up Vice City Cash: +$${p.amount}!`);
      }
    }

    // Ocean Hazard Water Check: If player drives/walks into deep ocean water outside islands/bridges
    const isInEast = (player.x >= 2250 && player.x <= 3150 && player.z >= 200 && player.z <= 2980);
    const isInWest = (player.x >= 200 && player.x <= 1520 && player.z >= 100 && player.z <= 3000);
    const isInStarfish = Math.hypot(player.x - 1750, player.z - 1550) < 240;
    const isInPrawn = Math.hypot(player.x - 1650, player.z - 800) < 170;
    const isInLeafLinks = Math.hypot(player.x - 2000, player.z - 1150) < 180;

    const isOnBridge = (
      // North Causeway
      (player.x >= 1200 && player.x <= 2450 && Math.abs(player.z - 800) < 50) ||
      // Starfish West Bridge
      (player.x >= 1200 && player.x <= 1650 && Math.abs(player.z - 1550) < 45) ||
      // Starfish East Bridge
      (player.x >= 1850 && player.x <= 2450 && Math.abs(player.z - 1550) < 45) ||
      // South Port Causeway
      (player.x >= 1400 && player.x <= 2450 && Math.abs(player.z - 2350) < 55)
    );

    if (!isInEast && !isInWest && !isInStarfish && !isInPrawn && !isInLeafLinks && !isOnBridge) {
      // Fallen into Biscayne Bay! Safely rescue back to nearest roadway
      audio.playCrash(0.6);
      gameHUD.showNotification('Fell into Biscayne Bay! Rescued to Ocean Drive.');
      if (player.isInVehicle) {
        player.currentVehicle.x = 2650;
        player.currentVehicle.z = 1500;
        player.currentVehicle.speed = 0;
      } else {
        player.x = 2650;
        player.z = 1500;
        player.y = 0;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.CityMap3D = CityMap3D;
}
