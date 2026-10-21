import * as THREE from 'three';

export class HUD {
  constructor(vehicle, missionManager, soundManager, onCameraToggle) {
    this.vehicle = vehicle;
    this.missions = missionManager;
    this.sound = soundManager;
    this.onCameraToggle = onCameraToggle;

    // Steering wheel drag state
    this.isDraggingWheel = false;
    this.wheelStartAngle = 0;
    this.wheelCurrentAngle = 0; // degrees (-450 to +450)
    this.targetWheelAngle = 0;

    // Keys pressed state
    this.keys = {};

    // Indicators state
    this.indicatorState = 'none'; // 'left', 'right', 'none'
    this.indicatorBlinkTimer = 0;

    this.cacheElements();
    this.bindEvents();
  }

  cacheElements() {
    this.elWheelWrapper = document.getElementById('steering-wheel-wrapper');
    this.elSteeringSvg = document.getElementById('steering-svg');
    this.elHornBtn = document.getElementById('horn-btn');

    this.elGasPedal = document.getElementById('pedal-gas');
    this.elBrakePedal = document.getElementById('pedal-brake');

    this.elGearBtns = document.querySelectorAll('.gear-btn');
    this.elSpeedVal = document.getElementById('speed-val');
    this.elRpmBar = document.getElementById('rpm-fill');
    this.elFuelBar = document.getElementById('fuel-fill');
    this.elComfortBar = document.getElementById('comfort-fill');

    this.elTurnLeft = document.getElementById('turn-left');
    this.elTurnRight = document.getElementById('turn-right');

    this.elGpsDist = document.getElementById('gps-dist');
    this.elGpsArrow = document.getElementById('gps-arrow');
    this.elTimerVal = document.getElementById('timer-val');
    this.elCoinsVal = document.getElementById('coins-val');
    this.elObjectiveBadge = document.getElementById('objective-title');

    this.elRearviewContainer = document.getElementById('rearview-mirror-container');
    this.elReverseOverlay = document.getElementById('reverse-camera-overlay');

    // Modals
    this.modalStart = document.getElementById('modal-start');
    this.modalVictory = document.getElementById('modal-victory');
    this.modalFail = document.getElementById('modal-fail');

    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnNextMission = document.getElementById('btn-next-mission');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnMenu = document.getElementById('btn-menu');
    this.btnMute = document.getElementById('btn-mute');
    this.btnCam = document.getElementById('btn-camera');

    this.colorDots = document.querySelectorAll('.color-dot');
    this.missionCards = document.querySelectorAll('.mission-card');
  }

  bindEvents() {
    // Steering Wheel Pointer Events
    const handlePointerDown = (e) => {
      this.isDraggingWheel = true;
      const rect = this.elWheelWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.wheelStartAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) - this.wheelCurrentAngle;
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
      if (!this.isDraggingWheel) return;
      const rect = this.elWheelWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      let angle = currentAngle - this.wheelStartAngle;

      // Wrap-around normalization
      while (angle < -180) angle += 360;
      while (angle > 180) angle -= 360;

      this.wheelCurrentAngle = THREE.MathUtils.clamp(angle * 2.5, -450, 450);
      this.updateSteeringVisual();
    };

    const handlePointerUp = () => {
      this.isDraggingWheel = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    this.elWheelWrapper.addEventListener('pointerdown', handlePointerDown);

    // Horn button
    this.elHornBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.playHorn();
    });

    // Pedals Pointer Events
    const setupPedal = (el, type) => {
      const press = (e) => {
        e.preventDefault();
        el.classList.add('pressed');
        if (type === 'gas') this.vehicle.throttle = 1.0;
        if (type === 'brake') this.vehicle.brake = 1.0;
      };
      const release = (e) => {
        e.preventDefault();
        el.classList.remove('pressed');
        if (type === 'gas') this.vehicle.throttle = 0.0;
        if (type === 'brake') this.vehicle.brake = 0.0;
      };

      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
    };

    setupPedal(this.elGasPedal, 'gas');
    setupPedal(this.elBrakePedal, 'brake');

    // Gear Shifter Buttons
    this.elGearBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gear = btn.dataset.gear;
        this.setGear(gear);
      });
    });

    // Turn Indicators
    this.elTurnLeft.addEventListener('click', () => this.toggleIndicator('left'));
    this.elTurnRight.addEventListener('click', () => this.toggleIndicator('right'));

    // Camera Switcher
    this.btnCam.addEventListener('click', () => {
      if (this.onCameraToggle) this.onCameraToggle();
    });

    // Audio Toggle
    this.btnMute.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.btnMute.textContent = isMuted ? '🔇' : '🔊';
    });

    // Menu Button
    this.btnMenu.addEventListener('click', () => {
      this.openStartMenu();
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.handleKeyboard();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.handleKeyboard();
    });

    // Mission Select Cards
    this.missionCards.forEach(card => {
      card.addEventListener('click', () => {
        this.missionCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.missions.currentMissionId = card.dataset.mission;
      });
    });

    // Garage Color Dots
    this.colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = parseInt(dot.dataset.color, 16);
        this.vehicle.setCarColor(color);
      });
    });

    // Modal Action Buttons
    this.btnStartGame.addEventListener('click', () => {
      this.modalStart.classList.add('hidden');
      this.missions.startMission(this.missions.currentMissionId, this.vehicle);
      this.updateMissionUI();
    });

    this.btnNextMission.addEventListener('click', () => {
      this.modalVictory.classList.add('hidden');
      const missionKeys = Object.keys(this.missions.missions);
      const currIdx = missionKeys.indexOf(this.missions.currentMissionId);
      const nextId = missionKeys[(currIdx + 1) % missionKeys.length];
      this.missions.startMission(nextId, this.vehicle);
      this.updateMissionUI();
    });

    this.btnRetry.addEventListener('click', () => {
      this.modalFail.classList.add('hidden');
      this.missions.startMission(this.missions.currentMissionId, this.vehicle);
      this.updateMissionUI();
    });
  }

  handleKeyboard() {
    // Gas / Throttle
    if (this.keys['KeyW'] || this.keys['ArrowUp']) {
      this.vehicle.throttle = 1.0;
      this.elGasPedal.classList.add('pressed');
    } else if (!this.elGasPedal.matches(':active')) {
      this.vehicle.throttle = 0.0;
      this.elGasPedal.classList.remove('pressed');
    }

    // Brake / Reverse
    if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['Space']) {
      this.vehicle.brake = 1.0;
      this.elBrakePedal.classList.add('pressed');
    } else if (!this.elBrakePedal.matches(':active')) {
      this.vehicle.brake = 0.0;
      this.elBrakePedal.classList.remove('pressed');
    }

    // Horn
    if (this.keys['KeyH']) {
      this.sound.playHorn();
    }

    // Quick Gear Shifts: P, R, N, D
    if (this.keys['KeyP']) this.setGear('P');
    if (this.keys['KeyR']) this.setGear('R');
    if (this.keys['KeyN']) this.setGear('N');
    if (this.keys['KeyD']) this.setGear('D');

    // Indicators: Q = Left, E = Right
    if (this.keys['KeyQ']) this.toggleIndicator('left');
    if (this.keys['KeyE']) this.toggleIndicator('right');
  }

  setGear(gear) {
    this.vehicle.setGear(gear);
    this.elGearBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gear === gear);
    });

    if (gear === 'R') {
      this.elReverseOverlay.style.display = 'block';
    } else {
      this.elReverseOverlay.style.display = 'none';
    }
  }

  toggleIndicator(side) {
    if (this.indicatorState === side) {
      this.indicatorState = 'none';
      this.elTurnLeft.classList.remove('active');
      this.elTurnRight.classList.remove('active');
    } else {
      this.indicatorState = side;
      this.sound.playIndicatorClick(true);
      if (side === 'left') {
        this.elTurnLeft.classList.add('active');
        this.elTurnRight.classList.remove('active');
      } else {
        this.elTurnRight.classList.add('active');
        this.elTurnLeft.classList.remove('active');
      }
    }
  }

  updateSteeringVisual() {
    this.elSteeringSvg.style.transform = `rotate(${this.wheelCurrentAngle}deg)`;
    // Convert -450...+450 degrees to wheel turn angle ~ -0.6 to +0.6 rad
    const normalized = (this.wheelCurrentAngle / 450) * 0.58;
    this.vehicle.steeringAngle = normalized;
  }

  update(dt, cameraMode) {
    // Keyboard steering smoothing
    if (!this.isDraggingWheel) {
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
        this.targetWheelAngle = THREE.MathUtils.clamp(this.targetWheelAngle - (dt * 900), -450, 450);
      } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
        this.targetWheelAngle = THREE.MathUtils.clamp(this.targetWheelAngle + (dt * 900), -450, 450);
      } else {
        // Auto-center spring
        this.targetWheelAngle = THREE.MathUtils.lerp(this.targetWheelAngle, 0, dt * 10);
      }
      this.wheelCurrentAngle = THREE.MathUtils.lerp(this.wheelCurrentAngle, this.targetWheelAngle, dt * 14);
      this.updateSteeringVisual();
    }

    // Rearview mirror visibility
    this.elRearviewContainer.style.display = cameraMode === 'cockpit' ? 'block' : 'none';

    // Dashboard digital readout & gauges
    const speed = Math.abs(this.vehicle.speedKmh);
    this.elSpeedVal.textContent = speed;

    const rpmPercent = Math.min((speed / 120) * 100 + (this.vehicle.throttle * 25), 100);
    this.elRpmBar.style.width = `${rpmPercent}%`;

    this.elFuelBar.style.width = `${Math.max(0, this.vehicle.fuel)}%`;
    this.elComfortBar.style.width = `${Math.max(0, this.vehicle.comfort)}%`;

    // Indicators sound tick
    if (this.indicatorState !== 'none') {
      this.indicatorBlinkTimer += dt;
      if (this.indicatorBlinkTimer > 0.45) {
        this.indicatorBlinkTimer = 0;
        this.sound.playIndicatorClick(false);
      }
    }

    // GPS Banner update
    if (this.missions.active) {
      const dist = Math.round(this.vehicle.position.distanceTo(this.missions.targetPosition));
      this.elGpsDist.textContent = `${dist}m`;

      // Calculate relative bearing to target
      const forward = new THREE.Vector3(Math.sin(this.vehicle.heading), 0, Math.cos(this.vehicle.heading));
      const toTarget = new THREE.Vector3().subVectors(this.missions.targetPosition, this.vehicle.position).normalize();
      const dot = forward.dot(toTarget);
      const crossY = forward.x * toTarget.z - forward.z * toTarget.x;

      if (dist < 15) {
        this.elGpsArrow.textContent = '🎯';
        this.elGpsArrow.style.transform = 'none';
      } else if (crossY > 0.3) {
        this.elGpsArrow.textContent = '➡️';
        this.elGpsArrow.style.transform = 'none';
      } else if (crossY < -0.3) {
        this.elGpsArrow.textContent = '⬅️';
        this.elGpsArrow.style.transform = 'none';
      } else {
        this.elGpsArrow.textContent = '⬆️';
        this.elGpsArrow.style.transform = 'none';
      }

      // Mission Timer
      const remaining = Math.max(0, this.missions.timer);
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toFixed(1).padStart(4, '0');
      this.elTimerVal.textContent = `${mins}:${secs}`;
    }

    // Coins counter
    this.elCoinsVal.textContent = this.missions.coins.toLocaleString();
  }

  updateMissionUI() {
    const m = this.missions.getMission(this.missions.currentMissionId);
    this.elObjectiveBadge.textContent = `${m.icon} ${m.title}`;
  }

  openStartMenu() {
    this.modalStart.classList.remove('hidden');
    this.missions.active = false;
    this.sound.stopEngine();
  }

  showVictory(stats) {
    document.getElementById('victory-mission-name').textContent = stats.mission;
    document.getElementById('victory-time').textContent = stats.timeRemaining;
    document.getElementById('victory-comfort').textContent = stats.comfort;
    document.getElementById('victory-bonus').textContent = `+${stats.timeBonus + stats.comfortBonus}`;
    document.getElementById('victory-reward').textContent = `+🪙 ${stats.reward}`;
    this.modalVictory.classList.remove('hidden');
  }

  showFail(reason) {
    document.getElementById('fail-reason').textContent = reason;
    this.modalFail.classList.remove('hidden');
  }
}
