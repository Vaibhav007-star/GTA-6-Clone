/**
 * In-Game Heads-Up Display (HUD) Manager
 * Manages Cash display, Wanted stars, Speedometer, Radio stations, Health/Armor, NOS gauge, and Notifications.
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

    // Health, Armor, NOS elements
    this.hpBar = document.getElementById('hud-hp-bar');
    this.armorBar = document.getElementById('hud-armor-bar');
    this.nosContainer = document.getElementById('hud-nos-box');
    this.nosBar = document.getElementById('hud-nos-bar');

    // Radio badge elements
    this.radioNameEl = document.getElementById('hud-radio-name');
    this.radioGenreEl = document.getElementById('hud-radio-genre');
    this.radioBadge = document.getElementById('hud-radio-badge');

    // Stunt banner
    this.stuntBanner = document.getElementById('hud-stunt-banner');
    this.stuntTimeout = null;
  }

  updateCash(amount) {
    if (this.cashEl) {
      this.cashEl.textContent = `$${String(amount).padStart(6, '0')}`;
    }
  }

  updateHealthArmor(hp, armor) {
    if (this.hpBar) {
      const p = Math.max(0, Math.min(100, hp));
      this.hpBar.style.width = `${p}%`;
      this.hpBar.style.background = p > 50 ? '#2ecc71' : (p > 25 ? '#f1c40f' : '#e74c3c');
    }
    if (this.armorBar) {
      this.armorBar.style.width = `${Math.max(0, Math.min(100, armor))}%`;
    }
  }

  updateNOS(nosPercent, isBoosting) {
    if (!this.nosContainer || !this.nosBar) return;
    this.nosBar.style.width = `${Math.max(0, Math.min(100, nosPercent))}%`;
    if (isBoosting) {
      this.nosBar.classList.add('boosting');
    } else {
      this.nosBar.classList.remove('boosting');
    }
  }

  updateRadio(station) {
    if (!station) return;
    if (this.radioNameEl) this.radioNameEl.textContent = station.name;
    if (this.radioGenreEl) this.radioGenreEl.textContent = `(${station.genre})`;
    if (this.radioBadge) {
      this.radioBadge.style.borderColor = station.color || '#ff7675';
      this.radioBadge.classList.add('tuning');
      setTimeout(() => this.radioBadge.classList.remove('tuning'), 400);
    }
    this.showNotification(`Radio: ${station.name} - ${station.genre}`);
  }

  showStuntBanner(text) {
    if (!this.stuntBanner) return;
    this.stuntBanner.textContent = text;
    this.stuntBanner.classList.add('show');
    clearTimeout(this.stuntTimeout);
    this.stuntTimeout = setTimeout(() => {
      this.stuntBanner.classList.remove('show');
    }, 2800);
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
      if (this.nosContainer) this.nosContainer.style.display = 'block';
    } else {
      this.speedContainer.style.display = 'none';
      if (this.btnActionIcon) this.btnActionIcon.textContent = '🚗';
      if (this.btnActionLabel) this.btnActionLabel.textContent = 'ENTER';
      if (this.nosContainer) this.nosContainer.style.display = 'none';
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
