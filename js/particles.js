/**
 * Visual Effects: Drift Skid Marks and Smoke Particles
 */

class SkidMarkManager {
  constructor(maxMarks = 400) {
    this.marks = [];
    this.maxMarks = maxMarks;
  }

  addMark(x, y) {
    this.marks.push({ x, y, alpha: 0.6 });
    if (this.marks.length > this.maxMarks) {
      this.marks.shift();
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0a0a0a';
    for (const m of this.marks) {
      ctx.globalAlpha = m.alpha;
      ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1.0;
  }
}

class ParticleManager {
  constructor(maxParticles = 80) {
    this.particles = [];
    this.maxParticles = maxParticles;
  }

  spawnSmoke(x, y) {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() * 8 - 4),
      y: y + (Math.random() * 8 - 4),
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      radius: 4 + Math.random() * 4,
      alpha: 0.5,
      life: 0.6
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += 8 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.6 * 0.5);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      ctx.fillStyle = `rgba(200, 200, 200, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

if (typeof window !== 'undefined') {
  window.SkidMarkManager = SkidMarkManager;
  window.ParticleManager = ParticleManager;
}

