/**
 * Interactive Mission System
 * Dispatches and tracks campaign objectives, timers, checkpoints, and cash payouts.
 */

class MissionSystem {
  constructor() {
    this.activeMission = null;
    this.missionTimer = 0;
    this.currentCheckpointIdx = 0;
    this.dropoffZone = null;
  }

  startMission(missionId) {
    const missions = dataManager.getMissions();
    const mission = missions.find(m => m.id === missionId) || missions[0];

    this.activeMission = mission;
    this.missionTimer = mission.timeLimit || 90;
    this.currentCheckpointIdx = 0;

    if (mission.type === 'CAR_THEFT') {
      this.dropoffZone = { x: 1960, y: 750, radius: 55 };
    } else if (mission.type === 'POLICE_EVADE') {
      if (window.retroGame) {
        window.retroGame.police.triggerCrime(mission.targetStars || 2, 'Mission: Five-Alarm Heat');
      }
    }

    gameHUD.showNotification(`MISSION STARTED: ${mission.title}!`);
    this.updateHUD();
  }

  abortMission() {
    this.activeMission = null;
    this.dropoffZone = null;
    this.updateHUD();
    gameHUD.showNotification('Mission Cancelled.');
  }

  update(dt, game) {
    if (!this.activeMission) return;

    this.missionTimer -= dt;
    this.updateHUD();

    if (this.missionTimer <= 0) {
      gameHUD.showNotification(`MISSION FAILED: Time Ran Out!`);
      this.activeMission = null;
      this.dropoffZone = null;
      this.updateHUD();
      return;
    }

    // 1. CAR THEFT Dropoff Check
    if (this.activeMission.type === 'CAR_THEFT' && this.dropoffZone) {
      if (game.player.isInVehicle) {
        const car = game.player.currentVehicle;
        const dist = Math.hypot(car.x - this.dropoffZone.x, car.y - this.dropoffZone.y);
        if (dist < this.dropoffZone.radius) {
          this.completeMission();
        }
      }
    }

    // 2. CHECKPOINT RACE Check
    if (this.activeMission.type === 'CHECKPOINT_RACE' && this.activeMission.checkpoints) {
      const targetPos = game.player.isInVehicle ? game.player.currentVehicle : game.player;
      const cp = this.activeMission.checkpoints[this.currentCheckpointIdx];
      if (cp && Math.hypot(targetPos.x - cp.x, targetPos.y - cp.y) < 50) {
        audio.playCash();
        this.currentCheckpointIdx++;
        if (this.currentCheckpointIdx >= this.activeMission.checkpoints.length) {
          this.completeMission();
        } else {
          gameHUD.showNotification(`Checkpoint Hit! (${this.currentCheckpointIdx}/${this.activeMission.checkpoints.length})`);
        }
      }
    }

    // 3. POLICE EVADE Check
    if (this.activeMission.type === 'POLICE_EVADE') {
      if (game.police.wantedLevel === 0) {
        this.completeMission();
      }
    }
  }

  completeMission() {
    const reward = this.activeMission.rewardCash;
    storage.addCash(reward);
    audio.playCash();
    gameHUD.showNotification(`MISSION PASSED! Earned +$${reward}`);
    this.activeMission = null;
    this.dropoffZone = null;
    this.updateHUD();
  }

  updateHUD() {
    const box = document.getElementById('mission-hud-box');
    const titleEl = document.getElementById('mission-hud-title');
    const timerEl = document.getElementById('mission-hud-timer');

    if (!box) return;

    if (this.activeMission) {
      box.style.display = 'block';
      if (titleEl) titleEl.textContent = this.activeMission.title;
      if (timerEl) timerEl.textContent = `${Math.ceil(this.missionTimer)}s`;
    } else {
      box.style.display = 'none';
    }
  }

  render(ctx) {
    if (!this.activeMission) return;

    const time = performance.now() * 0.004;

    // Draw Dropoff Zone
    if (this.dropoffZone) {
      const pulse = Math.sin(time) * 6;
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.dropoffZone.x, this.dropoffZone.y, this.dropoffZone.radius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(241, 196, 15, 0.25)';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CHOP SHOP DROPOFF', this.dropoffZone.x, this.dropoffZone.y - this.dropoffZone.radius - 10);
    }

    // Draw Race Checkpoints
    if (this.activeMission.type === 'CHECKPOINT_RACE' && this.activeMission.checkpoints) {
      const cp = this.activeMission.checkpoints[this.currentCheckpointIdx];
      if (cp) {
        const pulse = Math.sin(time) * 8;
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 45 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 210, 211, 0.25)';
        ctx.fill();

        ctx.fillStyle = '#00d2d3';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`CHECKPOINT ${this.currentCheckpointIdx + 1}`, cp.x, cp.y - 55);
      }
    }
  }
}

const missionSystem = new MissionSystem();

if (typeof window !== 'undefined') {
  window.MissionSystem = MissionSystem;
  window.missionSystem = missionSystem;
}

