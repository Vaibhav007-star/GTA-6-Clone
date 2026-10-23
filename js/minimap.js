/**
 * Live Tactical Radar Mini-Map
 * Renders Vice City's authentic geography:
 * - West Mainland: Downtown, Little Haiti/Havana, Escobar Airport with crossing runways, and Viceport docks.
 * - Central Bay: Starfish Island, Prawn Island, Leaf Links Golf Course.
 * - East Island: Ocean Drive, Washington Beach, continuous golden sand beach, and Ocean Beach lighthouse.
 * - Causeway Bridges spanning Biscayne Bay.
 * - Live dynamic blips: Player, drivable vehicles, civilian traffic, police pursuers, and cash briefcases.
 */

class MiniMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.scale = 0.052; // World to radar scale factor
  }

  render(cityMap, player, vehicles, traffic, police) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Tropical Ocean Water Base (Biscayne Bay)
    ctx.fillStyle = 'rgba(0, 75, 110, 0.94)';
    ctx.fillRect(0, 0, w, h);

    // Center radar around player
    const target = player.isInVehicle ? player.currentVehicle : player;
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const offsetX = target.x * this.scale;
    const offsetY = target.y * this.scale;

    // Helper conversion
    const toRX = (wx) => wx * this.scale - offsetX;
    const toRY = (wy) => wy * this.scale - offsetY;

    // 2. Draw Islands
    // West Mainland (Downtown & Little Haiti)
    ctx.fillStyle = 'rgba(34, 47, 62, 0.96)';
    ctx.fillRect(toRX(250), toRY(200), (1350 - 250) * this.scale, (2000 - 200) * this.scale);

    // Escobar Airport Tarmac (South-West)
    ctx.fillStyle = 'rgba(24, 28, 32, 0.98)';
    ctx.fillRect(toRX(250), toRY(2000), (1100 - 250) * this.scale, (2950 - 2000) * this.scale);

    // Viceport Docks (South-East Mainland)
    ctx.fillStyle = 'rgba(45, 52, 54, 0.98)';
    ctx.fillRect(toRX(1100), toRY(2000), (1480 - 1100) * this.scale, (2900 - 2000) * this.scale);

    // Escobar Crossing Runways on Radar
    ctx.strokeStyle = 'rgba(15, 15, 15, 0.9)';
    ctx.lineWidth = 6 * this.scale * 16;
    // Runway 1
    ctx.beginPath();
    ctx.moveTo(toRX(350), toRY(2850));
    ctx.lineTo(toRX(850), toRY(2150));
    ctx.stroke();
    // Runway 2
    ctx.beginPath();
    ctx.moveTo(toRX(400), toRY(2200));
    ctx.lineTo(toRX(950), toRY(2800));
    ctx.stroke();

    // Runway White Centerline Dashes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toRX(350), toRY(2850));
    ctx.lineTo(toRX(850), toRY(2150));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toRX(400), toRY(2200));
    ctx.lineTo(toRX(950), toRY(2800));
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Hyman Memorial Stadium at North Tip
    ctx.fillStyle = 'rgba(236, 240, 241, 0.9)';
    ctx.beginPath();
    ctx.arc(toRX(750), toRY(240), 95 * this.scale, 0, Math.PI * 2);
    ctx.fill();

    // Container Cargo Ship at Viceport Pier
    ctx.fillStyle = 'rgba(192, 57, 43, 0.9)';
    ctx.fillRect(toRX(1405), toRY(2480), 30 * this.scale, 190 * this.scale);

    // Starfish Island (Center Bay)
    ctx.fillStyle = 'rgba(39, 174, 96, 0.95)';
    ctx.beginPath();
    ctx.arc(toRX(1750), toRY(1550), 220 * this.scale, 0, Math.PI * 2);
    ctx.fill();
    // Tommy's Mansion on Starfish
    ctx.fillStyle = 'rgba(245, 205, 121, 0.95)';
    ctx.fillRect(toRX(1710), toRY(1510), 80 * this.scale, 60 * this.scale);

    // Prawn Island (North Bay Movie Studios)
    ctx.fillStyle = 'rgba(46, 204, 113, 0.95)';
    ctx.beginPath();
    ctx.arc(toRX(1650), toRY(800), 150 * this.scale, 0, Math.PI * 2);
    ctx.fill();

    // Leaf Links Golf Club Island
    ctx.fillStyle = 'rgba(46, 204, 113, 0.95)';
    ctx.beginPath();
    ctx.arc(toRX(2000), toRY(1150), 160 * this.scale, 0, Math.PI * 2);
    ctx.fill();
    // Sand Traps (Bunkers)
    ctx.fillStyle = 'rgba(245, 205, 121, 0.9)';
    ctx.beginPath();
    ctx.arc(toRX(1960), toRY(1120), 16 * this.scale, 0, Math.PI * 2);
    ctx.arc(toRX(2040), toRY(1180), 20 * this.scale, 0, Math.PI * 2);
    ctx.fill();

    // East Island (Ocean Drive, Washington Beach, Vice Point)
    ctx.fillStyle = 'rgba(34, 47, 62, 0.96)';
    ctx.fillRect(toRX(2350), toRY(200), (2850 - 2350) * this.scale, (2900 - 200) * this.scale);

    // Continuous Golden Beach along East Coast
    ctx.fillStyle = 'rgba(245, 205, 121, 0.88)';
    ctx.fillRect(toRX(2850), toRY(200), (3120 - 2850) * this.scale, (2850 - 200) * this.scale);

    // Ocean Beach Lighthouse on Southern Bluff
    ctx.fillStyle = 'rgba(214, 48, 49, 0.95)';
    ctx.beginPath();
    ctx.arc(toRX(2700), toRY(2880), 20 * this.scale, 0, Math.PI * 2);
    ctx.fill();

    // 3. Causeway Bridges across Biscayne Bay
    ctx.fillStyle = 'rgba(87, 101, 116, 0.98)';
    const bridges = [
      { x1: 1200, x2: 2450, y: 800, w: 80 },  // North Causeway
      { x1: 1200, x2: 1620, y: 1550, w: 65 }, // Starfish West Bridge
      { x1: 1880, x2: 2450, y: 1550, w: 65 }, // Starfish East Bridge
      { x1: 1400, x2: 2450, y: 2350, w: 85 }  // South Port Causeway
    ];
    for (const b of bridges) {
      const bx = toRX(b.x1);
      const by = toRY(b.y - b.w / 2);
      const bw = (b.x2 - b.x1) * this.scale;
      const bh = b.w * this.scale;
      ctx.fillRect(bx, by, bw, bh);
    }

    // Main City Avenues
    ctx.fillStyle = 'rgba(75, 101, 132, 0.85)';
    const nAvenues = [2650, 2450, 500, 850, 1200];
    for (const rx of nAvenues) {
      const rxScaled = toRX(rx);
      ctx.fillRect(rxScaled - 3, -h / 2, 6, h);
    }

    // Cross Streets
    const eStreets = [500, 900, 1400, 1900, 2400, 450, 750, 1100, 1550, 1950];
    for (const ry of eStreets) {
      const ryScaled = toRY(ry);
      ctx.fillRect(-w / 2, ryScaled - 3, w, 6);
    }

    // 4. Cash Briefcase Pickups (Green)
    ctx.fillStyle = '#2ecc71';
    if (cityMap && cityMap.cashPickups) {
      for (const p of cityMap.cashPickups) {
        if (p.collected) continue;
        const px = toRX(p.x);
        const py = toRY(p.z !== undefined ? p.z : p.y);
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Parked / Drivable Cars (Yellow Dots)
    ctx.fillStyle = '#f1c40f';
    for (const v of vehicles) {
      if (v.isDrivenByPlayer) continue;
      const vx = toRX(v.x);
      const vy = toRY(v.z !== undefined ? v.z : v.y);
      ctx.fillRect(vx - 2, vy - 2, 4, 4);
    }

    // 6. Civilian Traffic (Cyan/Purple)
    ctx.fillStyle = '#00d2d3';
    for (const tv of traffic.vehicles) {
      const tx = toRX(tv.x);
      const ty = toRY(tv.z !== undefined ? tv.z : tv.y);
      ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
    }

    // 7. Police Pursuers (Flashing Red/Blue)
    const time = performance.now();
    const isRed = Math.floor(time / 200) % 2 === 0;
    ctx.fillStyle = isRed ? '#ff3838' : '#3498db';
    for (const cop of police.policeUnits) {
      const cx = toRX(cop.x);
      const cy = toRY(cop.z !== undefined ? cop.z : cop.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Player in Center (Crisp White Arrow with Direction Heading)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    const heading = target.angle;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(heading) * 12, -Math.cos(heading) * 12);
    ctx.stroke();

    ctx.restore();

    // Radar Frame Vignette Border
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }
}

if (typeof window !== 'undefined') {
  window.MiniMap = MiniMap;
}
