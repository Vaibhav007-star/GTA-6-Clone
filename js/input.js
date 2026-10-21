/**
 * Input Coordinator
 * Multi-device input: Keyboard (PC) + Touch Joystick & Buttons (Mobile/Tablet)
 */

class InputCoordinator {
  constructor() {
    this.keys = {};
    this.moveVector = { x: 0, y: 0 };
    this.isHandbrake = false;
    this.isHorn = false;
    this.actionTriggered = false;

    // Joystick state
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickKnob = { x: 0, y: 0 };
    this.joystickRadius = 55;

    // Callbacks
    this.onActionPress = null;
    this.onPauseToggle = null;
    this.onMuteToggle = null;

    this.setupKeyboard();
    this.setupTouchControls();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Audio resume on first user interaction
      audio.init();
      audio.resume();

      this.keys[e.code] = true;

      if (e.code === 'KeyF' || e.code === 'Enter') {
        if (!e.repeat && this.onActionPress) {
          this.onActionPress();
        }
      }
      if (e.code === 'KeyP') {
        if (!e.repeat && this.onPauseToggle) {
          this.onPauseToggle();
        }
      }
      if (e.code === 'KeyM') {
        if (!e.repeat && this.onMuteToggle) {
          this.onMuteToggle();
        }
      }
      if (e.code === 'KeyH') {
        this.isHorn = true;
        audio.playHorn();
      }
      if (e.code === 'Space') {
        this.isHandbrake = true;
      }

      // Prevent scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this.isHandbrake = false;
      }
      if (e.code === 'KeyH') {
        this.isHorn = false;
      }
    });
  }

  setupTouchControls() {
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!base || !knob) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      audio.init();
      audio.resume();

      const touch = e.targetTouches[0];
      const rect = base.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.joystickActive = true;
      this.updateJoystick(touch.clientX, touch.clientY, knob);
    };

    const handleTouchMove = (e) => {
      if (!this.joystickActive) return;
      e.preventDefault();
      const touch = e.targetTouches[0];
      this.updateJoystick(touch.clientX, touch.clientY, knob);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      this.joystickActive = false;
      this.moveVector.x = 0;
      this.moveVector.y = 0;
      knob.style.transform = `translate(0px, 0px)`;
    };

    base.addEventListener('touchstart', handleTouchStart, { passive: false });
    base.addEventListener('touchmove', handleTouchMove, { passive: false });
    base.addEventListener('touchend', handleTouchEnd, { passive: false });
    base.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Touch Action Buttons
    const btnAction = document.getElementById('btn-action');
    const btnHandbrake = document.getElementById('btn-handbrake');
    const btnHorn = document.getElementById('btn-horn');

    if (btnAction) {
      btnAction.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.init();
        audio.resume();
        if (this.onActionPress) this.onActionPress();
      }, { passive: false });
      btnAction.addEventListener('click', () => {
        if (this.onActionPress) this.onActionPress();
      });
    }

    if (btnHandbrake) {
      const startHandbrake = (e) => {
        e.preventDefault();
        this.isHandbrake = true;
      };
      const endHandbrake = (e) => {
        e.preventDefault();
        this.isHandbrake = false;
      };
      btnHandbrake.addEventListener('touchstart', startHandbrake, { passive: false });
      btnHandbrake.addEventListener('touchend', endHandbrake, { passive: false });
      btnHandbrake.addEventListener('mousedown', startHandbrake);
      btnHandbrake.addEventListener('mouseup', endHandbrake);
    }

    if (btnHorn) {
      btnHorn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.playHorn();
      }, { passive: false });
      btnHorn.addEventListener('click', () => {
        audio.playHorn();
      });
    }
  }

  updateJoystick(clientX, clientY, knobEl) {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(distance, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    knobEl.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    this.moveVector.x = clampedX / this.joystickRadius;
    this.moveVector.y = clampedY / this.joystickRadius;
  }

  getMovementVector() {
    // If joystick is active on touch
    if (this.joystickActive && (Math.abs(this.moveVector.x) > 0.05 || Math.abs(this.moveVector.y) > 0.05)) {
      return this.moveVector;
    }

    // Keyboard fallback
    let x = 0;
    let y = 0;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;

    const len = Math.hypot(x, y);
    if (len > 0) {
      return { x: x / len, y: y / len };
    }
    return { x: 0, y: 0 };
  }
}

const input = new InputCoordinator();
