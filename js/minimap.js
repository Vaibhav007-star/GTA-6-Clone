/**
 * Live Radar Mini-Map
 * Renders a real-time tactical radar overview of roads, player, vehicles, and police.
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

    // 1. Radar background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // Center radar around player
    const target = player.isInVehicle ? player.currentVehicle : player;
    ctx.save();
    ctx.translate(w / 2, h / 2);

    const offsetX = target.x * this.scale;
    const offsetY = target.y * this.scale;

    // 2. Draw roads
    ctx.fillStyle = 'rgba(51, 65, 85, 0.9)';
    const roadThickness = cityMap.roadWidth * this.scale;

    for (const rx of cityMap.roads.vertical) {
      const rxScaled = rx * this.scale - offsetX;
      ctx.fillRect(rxScaled - roadThickness / 2, -h / 2, roadThickness, h);
    }
    for (const ry of cityMap.roads.horizontal) {
      const ryScaled = ry * this.scale - offsetY;
      ctx.fillRect(-w / 2, ryScaled - roadThickness / 2, w, roadThickness);
    }

    // 3. Draw Cash Pickups (Green)
    ctx.fillStyle = '#2ecc71';
    for (const p of cityMap.cashPickups) {
      if (p.collected) continue;
      const px = p.x * this.scale - offsetX;
      const py = p.y * this.scale - offsetY;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Parked / Driveable Cars (Yellow)
    ctx.fillStyle = '#f1c40f';
    for (const v of vehicles) {
      if (v.isDrivenByPlayer) continue;
      const vx = v.x * this.scale - offsetX;
      const vy = v.y * this.scale - offsetY;
      ctx.fillRect(vx - 2, vy - 2, 4, 4);
    }

    // 5. Draw Civilian Traffic (Cyan/Purple)
    ctx.fillStyle = '#9b59b6';
    for (const tv of traffic.vehicles) {
      const tx = tv.x * this.scale - offsetX;
      const ty = tv.y * this.scale - offsetY;
      ctx.fillRect(tx - 1.5, ty - 1.5, 3, 3);
    }

    // 6. Draw Police Pursuers (Flashing Red/Blue)
    const time = performance.now();
    const isRed = Math.floor(time / 200) % 2 === 0;
    ctx.fillStyle = isRed ? '#e74c3c' : '#3498db';
    for (const cop of police.policeUnits) {
      const cx = cop.x * this.scale - offsetX;
      const cy = cop.y * this.scale - offsetY;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Draw Player in Center (White arrow indicating heading)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Direction pointer
    const heading = target.angle;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(heading) * 8, -Math.cos(heading) * 8);
    ctx.stroke();

    ctx.restore();

    // Radar border & crosshairs
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
  }
}

if (typeof window !== 'undefined') {
  window.MiniMap = MiniMap;
}

