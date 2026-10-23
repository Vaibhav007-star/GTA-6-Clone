/**
 * Live Tactical Radar Mini-Map
 * Renders Vice Island's coastlines, beaches, bay, causeway bridges, roads, vehicles, and police units.
 */

class MiniMap {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.scale = 0.055; // World to radar scale factor
  }

  render(cityMap, player, vehicles, traffic, police) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Ocean Water Base
    ctx.fillStyle = 'rgba(0, 65, 95, 0.92)';
    ctx.fillRect(0, 0, w, h);

    // Center radar around player
    const target = player.isInVehicle ? player.currentVehicle : player;
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const offsetX = target.x * this.scale;
    const offsetY = target.y * this.scale;

    // 2. Draw Islands
    // West Island (Downtown & Port)
    const westX = (850 - 575) * this.scale - offsetX;
    const westY = (1550 - 1300) * this.scale - offsetY;
    const westW = 1150 * this.scale;
    const westH = 2600 * this.scale;
    ctx.fillStyle = 'rgba(34, 47, 62, 0.96)';
    ctx.fillRect(westX, westY, westW, westH);

    // East Island (Beach & Ocean Drive)
    const eastX = (2525 - 525) * this.scale - offsetX;
    const eastY = (1550 - 1300) * this.scale - offsetY;
    const eastW = 1050 * this.scale;
    const eastH = 2600 * this.scale;
    ctx.fillStyle = 'rgba(34, 47, 62, 0.96)';
    ctx.fillRect(eastX, eastY, eastW, eastH);

    // Golden Beach Strip along East coast
    const beachX = (2900 - 160) * this.scale - offsetX;
    const beachY = (1550 - 1350) * this.scale - offsetY;
    const beachW = 320 * this.scale;
    const beachH = 2700 * this.scale;
    ctx.fillStyle = 'rgba(245, 205, 121, 0.85)';
    ctx.fillRect(beachX, beachY, beachW, beachH);

    // Starfish Island (Center Bay)
    const starX = 1700 * this.scale - offsetX;
    const starY = 1500 * this.scale - offsetY;
    const starR = 200 * this.scale;
    ctx.fillStyle = 'rgba(39, 174, 96, 0.95)';
    ctx.beginPath();
    ctx.arc(starX, starY, starR, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Roads & Causeway Bridges
    ctx.fillStyle = 'rgba(75, 101, 132, 0.95)';

    // Causeway Bridges over the Bay
    const bridges = [
      { x1: 1350, x2: 2200, y: 800, w: 90 },
      { x1: 1350, x2: 1550, y: 1500, w: 70 },
      { x1: 1850, x2: 2200, y: 1500, w: 70 },
      { x1: 1350, x2: 2200, y: 2200, w: 90 }
    ];
    for (const b of bridges) {
      const bx = b.x1 * this.scale - offsetX;
      const by = (b.y - b.w / 2) * this.scale - offsetY;
      const bw = (b.x2 - b.x1) * this.scale;
      const bh = b.w * this.scale;
      ctx.fillRect(bx, by, bw, bh);
    }

    // Ocean Drive & Beach Avenues
    const nAvenues = [2600, 2200, 500, 950, 1350];
    for (const rx of nAvenues) {
      const rxScaled = rx * this.scale - offsetX;
      ctx.fillRect(rxScaled - 4, -h / 2, 8, h);
    }

    // Cross Streets
    const eStreets = [600, 1100, 1600, 2100, 2600, 450, 800, 1200, 2200];
    for (const ry of eStreets) {
      const ryScaled = ry * this.scale - offsetY;
      ctx.fillRect(-w / 2, ryScaled - 4, w, 8);
    }

    // 4. Draw Cash Briefcase Pickups (Green)
    ctx.fillStyle = '#2ecc71';
    if (cityMap && cityMap.cashPickups) {
      for (const p of cityMap.cashPickups) {
        if (p.collected) continue;
        const px = p.x * this.scale - offsetX;
        const py = p.y * this.scale - offsetY;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Draw Parked / Drivable Cars (Yellow dots)
    ctx.fillStyle = '#f1c40f';
    for (const v of vehicles) {
      if (v.isDrivenByPlayer) continue;
      const vx = v.x * this.scale - offsetX;
      const vy = v.y * this.scale - offsetY;
      ctx.fillRect(vx - 2, vy - 2, 4, 4);
    }

    // 6. Draw Civilian Traffic (Cyan/Purple)
    ctx.fillStyle = '#9b59b6';
    for (const tv of traffic.vehicles) {
      const tx = tv.x * this.scale - offsetX;
      const ty = tv.y * this.scale - offsetY;
      ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
    }

    // 7. Draw Police Pursuers (Flashing Red/Blue)
    const time = performance.now();
    const isRed = Math.floor(time / 200) % 2 === 0;
    ctx.fillStyle = isRed ? '#ff3838' : '#3498db';
    for (const cop of police.policeUnits) {
      const cx = cop.x * this.scale - offsetX;
      const cy = cop.y * this.scale - offsetY;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Draw Player in Center (White arrow with heading)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    const heading = target.angle;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(heading) * 8, -Math.cos(heading) * 8);
    ctx.stroke();

    ctx.restore();

    // Radar border & crosshairs
    ctx.strokeStyle = 'rgba(0, 210, 211, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, w, h);
  }
}

if (typeof window !== 'undefined') {
  window.MiniMap = MiniMap;
}
