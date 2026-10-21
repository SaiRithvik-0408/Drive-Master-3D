import * as THREE from 'three';
import confetti from 'canvas-confetti';

export class MissionManager {
  constructor(soundManager) {
    this.sound = soundManager;
    this.currentMissionId = 'speed_run';
    this.active = false;
    this.timer = 0;
    this.coins = 1250;
    this.overtakes = 0;

    // Checkpoint target
    this.targetPosition = new THREE.Vector3(0, 0, 0);
    this.startPosition = new THREE.Vector3(0, 0, 0);

    this.missions = {
      speed_run: {
        id: 'speed_run',
        title: 'SPEED RUN',
        subtitle: 'Reach the central medical hub before time expires!',
        icon: '⚡',
        timeLimit: 50, // seconds
        startPos: new THREE.Vector3(-4, 0, -180),
        startHeading: 0,
        targetPos: new THREE.Vector3(-4, 0, 240),
        reward: 350,
        desc: 'Distance: 420m • Time Limit: 50s'
      },
      highway_cruise: {
        id: 'highway_cruise',
        title: 'HIGHWAY WEAVE',
        subtitle: 'Cruise at speed and overtake 8 traffic cars without collision!',
        icon: '🛣️',
        timeLimit: 75,
        startPos: new THREE.Vector3(120 - 4, 0, -220),
        startHeading: 0,
        targetPos: new THREE.Vector3(120 - 4, 0, 320),
        targetOvertakes: 8,
        reward: 450,
        desc: 'Overtakes: 8 cars • Safe Distance: 540m'
      },
      precision_parking: {
        id: 'precision_parking',
        title: 'PRECISION PARKING',
        subtitle: 'Maneuver to the plaza, park inside bay #2, and shift to P!',
        icon: '🅿️',
        timeLimit: 60,
        startPos: new THREE.Vector3(-60, 0, -60),
        startHeading: Math.PI / 2,
        targetPos: new THREE.Vector3(-60 - 25 + 24, 0, -60), // Plaza Spot #2
        reward: 500,
        desc: 'Tight turns • Stop inside bay & shift to P'
      },
      vip_chauffeur: {
        id: 'vip_chauffeur',
        title: 'VIP ESCORT',
        subtitle: 'Chauffeur the CEO smoothly. Comfort must stay above 75%!',
        icon: '🎩',
        timeLimit: 70,
        startPos: new THREE.Vector3(4, 0, 180),
        startHeading: Math.PI,
        targetPos: new THREE.Vector3(4, 0, -220),
        reward: 600,
        desc: 'No harsh braking • Avoid crashes • 400m'
      },
      eco_driver: {
        id: 'eco_driver',
        title: 'ECO DRIVER',
        subtitle: 'Limited fuel! Feather the gas pedal and coast to destination.',
        icon: '🌱',
        timeLimit: 80,
        startPos: new THREE.Vector3(-120 + 4, 0, -200),
        startHeading: 0,
        targetPos: new THREE.Vector3(-120 + 4, 0, 160),
        reward: 400,
        desc: 'Start fuel: 35% • Reach destination alive'
      }
    };
  }

  getMission(id) {
    return this.missions[id] || this.missions.speed_run;
  }

  startMission(id, vehicle) {
    this.currentMissionId = id;
    const m = this.getMission(id);
    this.active = true;
    this.timer = m.timeLimit;
    this.overtakes = 0;
    this.targetPosition.copy(m.targetPos);
    this.startPosition.copy(m.startPos);

    vehicle.reset(m.startPos.x, m.startPos.z, m.startHeading);

    if (id === 'eco_driver') {
      vehicle.fuel = 35; // start with low fuel challenge
    } else {
      vehicle.fuel = 100;
    }
    vehicle.comfort = 100;

    this.sound.startEngine();
  }

  update(dt, vehicle, onWin, onFail) {
    if (!this.active) return;

    this.timer -= dt;

    // Fail conditions
    if (this.timer <= 0) {
      this.active = false;
      this.sound.stopEngine();
      onFail('Time Expired!');
      return;
    }

    if (vehicle.fuel <= 0) {
      this.active = false;
      this.sound.stopEngine();
      onFail('Ran Out of Fuel!');
      return;
    }

    if (this.currentMissionId === 'vip_chauffeur' && vehicle.comfort < 60) {
      this.active = false;
      this.sound.stopEngine();
      onFail('VIP is Dissatisfied (Comfort Dropped)!');
      return;
    }

    // Distance to target
    const dist = vehicle.position.distanceTo(this.targetPosition);

    // Win condition check
    if (this.currentMissionId === 'precision_parking') {
      // Must be within 2.5m of parking spot, speed < 1 km/h, and in 'P'
      if (dist < 3.2 && Math.abs(vehicle.speed) < 0.3 && vehicle.gear === 'P') {
        this.triggerWin(vehicle, onWin);
      }
    } else {
      // Standard destination arrival
      if (dist < 9.0) {
        this.triggerWin(vehicle, onWin);
      }
    }
  }

  triggerWin(vehicle, onWin) {
    this.active = false;
    this.sound.stopEngine();
    this.sound.playVictory();

    const m = this.getMission(this.currentMissionId);
    const timeBonus = Math.max(0, Math.round(this.timer * 10));
    const comfortBonus = Math.round(vehicle.comfort * 2);
    const totalReward = m.reward + timeBonus + comfortBonus;
    this.coins += totalReward;

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    onWin({
      mission: m.title,
      timeRemaining: Math.max(0, this.timer).toFixed(1) + 's',
      comfort: Math.round(vehicle.comfort) + '%',
      timeBonus: timeBonus,
      comfortBonus: comfortBonus,
      reward: totalReward,
      totalCoins: this.coins
    });
  }
}
