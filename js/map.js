/**
 * City Map Generator & Renderer
 * Procedural retro open-world city grid with buildings, roads, parks, and cash pickups.
 */

class CityMap {
  constructor() {
    this.width = CONFIG.WORLD_WIDTH;
    this.height = CONFIG.WORLD_HEIGHT;
    this.roadWidth = CONFIG.ROAD_WIDTH;

    this.buildings = [];
    this.parks = [];
    this.roads = { vertical: [], horizontal: [] };
    this.cashPickups = [];

    this.generateLayout();
  }

  generateLayout() {
    // Road coordinates across the map
    this.roads.vertical = [250, 750, 1300, 1850, 2350];
    this.roads.horizontal = [250, 750, 1300, 1850, 2350];

    // City block buildings (bounding boxes for collision & rendering)
    const blockRangesX = [
      { start: 360, end: 640 },
      { start: 860, end: 1190 },
      { start: 1410, end: 1740 },
      { start: 1960, end: 2240 }
    ];

    const blockRangesY = [
      { start: 360, end: 640 },
      { start: 860, end: 1190 },
      { start: 1410, end: 1740 },
      { start: 1960, end: 2240 }
    ];

    // Park blocks
    this.parks.push(
      { x: 860, y: 860, w: 330, h: 330 },
      { x: 1960, y: 1960, w: 280, h: 280 }
    );

    // Populate buildings in non-park blocks
    const buildingColors = [
      { base: '#2c3e50', roof: '#34495e', trim: '#e67e22' },
      { base: '#34495e', roof: '#475e77', trim: '#3498db' },
      { base: '#22313f', roof: '#2c3e50', trim: '#e74c3c' },
      { base: '#2c2c54', roof: '#40407a', trim: '#f1c40f' }
    ];

    let colorIdx = 0;
    for (let bx = 0; bx < blockRangesX.length; bx++) {
      for (let by = 0; by < blockRangesY.length; by++) {
        // Skip park locations
        if ((bx === 1 && by === 1) || (bx === 3 && by === 3)) continue;

        const rx = blockRangesX[bx];
        const ry = blockRangesY[by];
        const bw = rx.end - rx.start;
        const bh = ry.end - ry.start;

        const scheme = buildingColors[colorIdx % buildingColors.length];
        colorIdx++;

        this.buildings.push({
          x: rx.start,
          y: ry.start,
          w: bw,
          h: bh,
          color: scheme.base,
          roofColor: scheme.roof,
          trimColor: scheme.trim
        });
      }
    }

    // Seed cash pickups throughout alleys and sidewalk corners
    this.spawnPickups();
  }

  spawnPickups() {
    this.cashPickups = [
      { x: 500, y: 700, amount: 200, collected: false },
      { x: 1025, y: 1025, amount: 500, collected: false }, // Park center
      { x: 1550, y: 200, amount: 150, collected: false },
      { x: 2100, y: 750, amount: 300, collected: false },
      { x: 1300, y: 1600, amount: 250, collected: false },
      { x: 400, y: 1900, amount: 400, collected: false },
      { x: 1750, y: 2200, amount: 350, collected: false }
    ];
  }

  checkBuildingCollision(x, y, radius) {
    for (const b of this.buildings) {
      // Circle vs AABB collision
      const nearestX = Math.max(b.x, Math.min(x, b.x + b.w));
      const nearestY = Math.max(b.y, Math.min(y, b.y + b.h));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < radius * radius) {
        return {
          collided: true,
          building: b,
          nearestX,
          nearestY,
          overlapDist: radius - Math.hypot(dx, dy)
        };
      }
    }
    return { collided: false };
  }

  render(ctx, camera) {
    // 1. Base urban asphalt & grass background
    ctx.fillStyle = CONFIG.COLORS.GROUND;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Parks
    ctx.fillStyle = CONFIG.COLORS.GRASS;
    for (const park of this.parks) {
      ctx.fillRect(park.x, park.y, park.w, park.h);

      // Fountain / pond in park 1
      if (park.x === 860) {
        ctx.fillStyle = CONFIG.COLORS.WATER;
        ctx.beginPath();
        ctx.arc(park.x + park.w / 2, park.y + park.h / 2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CONFIG.COLORS.GRASS;
      }
    }

    // 3. Roads & Sidewalks (Horizontal)
    for (const y of this.roads.horizontal) {
      // Sidewalks
      ctx.fillStyle = CONFIG.COLORS.SIDEWALK;
      ctx.fillRect(0, y - this.roadWidth / 2 - 12, this.width, this.roadWidth + 24);

      // Asphalt
      ctx.fillStyle = CONFIG.COLORS.ROAD;
      ctx.fillRect(0, y - this.roadWidth / 2, this.width, this.roadWidth);

      // Center dashed yellow lane line
      ctx.strokeStyle = CONFIG.COLORS.ROAD_MARKING;
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 16]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Roads & Sidewalks (Vertical)
    for (const x of this.roads.vertical) {
      // Sidewalks
      ctx.fillStyle = CONFIG.COLORS.SIDEWALK;
      ctx.fillRect(x - this.roadWidth / 2 - 12, 0, this.roadWidth + 24, this.height);

      // Asphalt
      ctx.fillStyle = CONFIG.COLORS.ROAD;
      ctx.fillRect(x - this.roadWidth / 2, 0, this.roadWidth, this.height);

      // Center dashed yellow lane line
      ctx.strokeStyle = CONFIG.COLORS.ROAD_MARKING;
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 16]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Crosswalks at intersections
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 4;
    const half = this.roadWidth / 2;
    for (const x of this.roads.vertical) {
      for (const y of this.roads.horizontal) {
        // Draw crosswalk zebra stripes
        for (let o = -half + 12; o < half - 10; o += 14) {
          ctx.beginPath();
          ctx.moveTo(x + o, y - half - 10);
          ctx.lineTo(x + o, y - half);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x + o, y + half);
          ctx.lineTo(x + o, y + half + 10);
          ctx.stroke();
        }
      }
    }

    // 6. Buildings with drop shadows and rooftop air units
    for (const b of this.buildings) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(b.x + 10, b.y + 10, b.w, b.h);

      // Main structure
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Inner roof deck
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(b.x + 14, b.y + 14, b.w - 28, b.h - 28);

      // Rooftop feature (helipad or utility)
      ctx.fillStyle = b.trimColor;
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 22, 0, Math.PI * 2);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }

    // 7. Cash Pickups (Floating briefcases)
    const time = performance.now() * 0.003;
    for (const p of this.cashPickups) {
      if (p.collected) continue;
      const bob = Math.sin(time + p.x) * 4;

      // Glow circle
      ctx.fillStyle = 'rgba(46, 204, 113, 0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + bob, 16, 0, Math.PI * 2);
      ctx.fill();

      // Briefcase body
      ctx.fillStyle = '#27ae60';
      ctx.fillRect(p.x - 10, p.y - 7 + bob, 20, 14);

      // Handle
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 4, p.y - 11 + bob, 8, 4);

      // Cash symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', p.x, p.y + bob);
    }
  }
}
