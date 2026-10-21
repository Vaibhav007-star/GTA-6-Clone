/**
 * In-Game Heads-Up Display (HUD) Manager
 * Manages Cash display, Wanted stars, Speedometer, and Notification ticker.
 */

class GameHUD {
  constructor() {
    this.cashEl = document.getElementById('hud-cash');
    this.starsContainer = document.getElementById('hud-stars');
    this.speedContainer = document.getElementById('hud-speed-box');
    this.speedValEl = document.getElementById('hud-speed-val');
    this.notifEl = document.getElementById('hud-notification');
    this.btnActionIcon = document.getElementById('btn-action-icon');
    this.btnActionLabel = document.getElementById('btn-action-label');
    this.notifTimeout = null;
  }

  updateCash(amount) {
    if (this.cashEl) {
      this.cashEl.textContent = `$${String(amount).padStart(6, '0')}`;
    }
  }

  updateWantedStars(stars) {
    if (!this.starsContainer) return;
    const starIcons = this.starsContainer.children;
    for (let i = 0; i < starIcons.length; i++) {
      if (i < stars) {
        starIcons[i].classList.add('active');
      } else {
        starIcons[i].classList.remove('active');
      }
    }
  }

  updateSpeed(speedMph, isDriving) {
    if (!this.speedContainer) return;
    if (isDriving) {
      this.speedContainer.style.display = 'block';
      if (this.speedValEl) this.speedValEl.textContent = `${Math.round(speedMph)} MPH`;
      if (this.btnActionIcon) this.btnActionIcon.textContent = '🚪';
      if (this.btnActionLabel) this.btnActionLabel.textContent = 'EXIT';
    } else {
      this.speedContainer.style.display = 'none';
      if (this.btnActionIcon) this.btnActionIcon.textContent = '🚗';
      if (this.btnActionLabel) this.btnActionLabel.textContent = 'ENTER';
    }
  }

  showNotification(msg) {
    if (!this.notifEl) return;
    this.notifEl.textContent = msg;
    this.notifEl.classList.add('show');

    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      this.notifEl.classList.remove('show');
    }, 3500);
  }
}

const gameHUD = new GameHUD();

if (typeof window !== 'undefined') {
  window.GameHUD = GameHUD;
  window.gameHUD = gameHUD;
}
