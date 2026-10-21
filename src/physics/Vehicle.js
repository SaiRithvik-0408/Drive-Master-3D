import * as THREE from 'three';

export class Vehicle {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.sound = soundManager;

    // Kinematics & state
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // rotation around Y (radians)
    this.speed = 0; // m/s (1 m/s = 3.6 km/h)
    this.speedKmh = 0;

    // Controls input
    this.steeringAngle = 0; // target wheel turn angle in radians
    this.currentSteer = 0;  // smoothed steering angle
    this.throttle = 0;      // 0 to 1
    this.brake = 0;         // 0 to 1
    this.gear = 'D';        // 'P', 'R', 'N', 'D'
    this.indicator = 'none'; // 'left', 'right', 'hazard', 'none'
    this.headlightsOn = true;

    // Vehicle Specs
    this.wheelBase = 2.6; // distance between front & rear axles
    this.width = 1.85;
    this.length = 4.2;
    this.height = 1.4;
    this.maxSpeedForward = 33.3; // ~120 km/h
    this.maxSpeedReverse = 8.5;  // ~30 km/h
    this.accelRate = 14.0;       // m/s^2
    this.brakeRate = 26.0;       // m/s^2
    this.friction = 3.0;         // rolling resistance

    // Dynamics & feel
    this.suspensionPitch = 0;
    this.suspensionRoll = 0;
    this.fuel = 100; // 0 to 100%
    this.comfort = 100; // 0 to 100%

    // 3D Meshes
    this.mesh = new THREE.Group();
    this.bodyMesh = null;
    this.interiorMesh = null;
    this.cockpitCameraAnchor = new THREE.Object3D();
    this.frontLeftWheel = null;
    this.frontRightWheel = null;
    this.rearLeftWheel = null;
    this.rearRightWheel = null;
    this.brakeLights = [];
    this.headlightBeams = [];

    this.carColor = 0xf59e0b; // signature amber gold

    this.buildCar();
    this.scene.add(this.mesh);
  }

  buildCar() {
    // Car Body Material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.carColor,
      metalness: 0.8,
      roughness: 0.25,
      envMapIntensity: 1.2
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.4,
      roughness: 0.6
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1
    });

    // Lower Chassis
    const lowerBodyGeo = new THREE.BoxGeometry(1.8, 0.55, 4.2);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
    lowerBody.position.y = 0.52;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    this.mesh.add(lowerBody);
    this.bodyMesh = lowerBody;

    // Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 0.98, -0.2);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Front Windshield
    const windshieldGeo = new THREE.BoxGeometry(1.56, 0.52, 0.05);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 0.96, 0.92);
    windshield.rotation.x = -Math.PI / 5;
    this.mesh.add(windshield);

    // Rear Windshield
    const rearGlass = new THREE.Mesh(windshieldGeo, glassMat);
    rearGlass.position.set(0, 0.96, -1.32);
    rearGlass.rotation.x = Math.PI / 4.8;
    this.mesh.add(rearGlass);

    // Side Windows
    const sideGlassGeo = new THREE.BoxGeometry(1.62, 0.45, 1.8);
    const sideGlass = new THREE.Mesh(sideGlassGeo, glassMat);
    sideGlass.position.set(0, 0.96, -0.2);
    this.mesh.add(sideGlass);

    // Bumpers
    const frontBumperGeo = new THREE.BoxGeometry(1.82, 0.28, 0.25);
    const frontBumper = new THREE.Mesh(frontBumperGeo, darkTrimMat);
    frontBumper.position.set(0, 0.38, 2.15);
    this.mesh.add(frontBumper);

    const rearBumper = new THREE.Mesh(frontBumperGeo, darkTrimMat);
    rearBumper.position.set(0, 0.38, -2.15);
    this.mesh.add(rearBumper);

    // Front Grille
    const grilleGeo = new THREE.BoxGeometry(0.9, 0.2, 0.05);
    const grille = new THREE.Mesh(grilleGeo, darkTrimMat);
    grille.position.set(0, 0.45, 2.24);
    this.mesh.add(grille);

    // Headlights
    const lightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const headL = new THREE.Mesh(lightGeo, headlightMat);
    headL.position.set(-0.65, 0.55, 2.12);
    this.mesh.add(headL);

    const headR = new THREE.Mesh(lightGeo, headlightMat);
    headR.position.set(0.65, 0.55, 2.12);
    this.mesh.add(headR);

    // Spotlight beams for night/tunnel immersion
    const beamL = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 6, 0.4, 1.0);
    beamL.position.set(-0.65, 0.55, 2.12);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.65, 0.1, 15);
    this.mesh.add(beamL);
    this.mesh.add(targetL);
    beamL.target = targetL;
    this.headlightBeams.push(beamL);

    const beamR = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 6, 0.4, 1.0);
    beamR.position.set(0.65, 0.55, 2.12);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.65, 0.1, 15);
    this.mesh.add(beamR);
    this.mesh.add(targetR);
    beamR.target = targetR;
    this.headlightBeams.push(beamR);

    // Taillights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    const tailL = new THREE.Mesh(lightGeo, tailMat);
    tailL.position.set(-0.65, 0.58, -2.12);
    this.mesh.add(tailL);
    this.brakeLights.push(tailMat);

    const tailR = new THREE.Mesh(lightGeo, tailMat);
    tailR.position.set(0.65, 0.58, -2.12);
    this.mesh.add(tailR);
    this.brakeLights.push(tailMat);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.2, 0.12, 0.12);
    const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
    mirrorL.position.set(-0.95, 0.85, 0.65);
    this.mesh.add(mirrorL);

    const mirrorR = new THREE.Mesh(mirrorGeo, bodyMat);
    mirrorR.position.set(0.95, 0.85, 0.65);
    this.mesh.add(mirrorR);

    // Interior Cockpit Dashboard & Steering Column
    const dashGeo = new THREE.BoxGeometry(1.4, 0.3, 0.5);
    const dash = new THREE.Mesh(dashGeo, darkTrimMat);
    dash.position.set(0, 0.75, 0.5);
    this.mesh.add(dash);

    // Driver's eye camera anchor (standard left-hand or center-offset seat)
    this.cockpitCameraAnchor.position.set(-0.35, 1.05, -0.05);
    this.mesh.add(this.cockpitCameraAnchor);

    // Wheels
    this.frontLeftWheel = this.createWheel(-0.92, 0.33, 1.35);
    this.frontRightWheel = this.createWheel(0.92, 0.33, 1.35);
    this.rearLeftWheel = this.createWheel(-0.92, 0.33, -1.35);
    this.rearRightWheel = this.createWheel(0.92, 0.33, -1.35);

    this.mesh.add(this.frontLeftWheel);
    this.mesh.add(this.frontRightWheel);
    this.mesh.add(this.rearLeftWheel);
    this.mesh.add(this.rearRightWheel);
  }

  createWheel(x, y, z) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 20);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.25, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.2
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    return wheelGroup;
  }

  setCarColor(hexColor) {
    this.carColor = hexColor;
    if (this.bodyMesh && this.bodyMesh.material) {
      this.bodyMesh.material.color.setHex(hexColor);
    }
  }

  setGear(newGear) {
    if (this.gear === newGear) return;
    this.gear = newGear;
    this.sound.playGearShift();

    if (this.gear === 'R') {
      this.sound.startReverseBeep();
    } else {
      this.sound.stopReverseBeep();
    }
  }

  update(dt, city, traffic) {
    // Smooth steering input
    const steerSpeed = 6.0;
    this.currentSteer = THREE.MathUtils.lerp(this.currentSteer, this.steeringAngle, dt * steerSpeed);

    // Steer front wheels visual rotation
    this.frontLeftWheel.rotation.y = this.currentSteer;
    this.frontRightWheel.rotation.y = this.currentSteer;

    // Gas & Brake forces
    let driveForce = 0;
    if (this.gear === 'D') {
      driveForce = this.throttle * this.accelRate;
    } else if (this.gear === 'R') {
      driveForce = -this.throttle * (this.accelRate * 0.6);
    } else if (this.gear === 'P') {
      // Park applies full locking brake
      this.speed = 0;
      driveForce = 0;
    }

    // Braking force opposes movement direction
    let brakeForce = 0;
    if (this.gear === 'P') {
      brakeForce = 50.0;
    } else if (this.brake > 0) {
      brakeForce = this.brake * this.brakeRate;
      if (Math.abs(this.speed) > 10 && this.brake > 0.8) {
        this.sound.playBrakeSkid();
      }
    }

    // Apply acceleration and deceleration
    if (this.gear !== 'P') {
      if (driveForce !== 0) {
        this.speed += driveForce * dt;
      }

      // Rolling friction
      const frictionForce = Math.sign(this.speed) * this.friction * dt;
      if (Math.abs(frictionForce) > Math.abs(this.speed)) {
        this.speed = 0;
      } else {
        this.speed -= frictionForce;
      }

      // Braking
      if (brakeForce > 0) {
        const brakeDecel = Math.sign(this.speed) * brakeForce * dt;
        if (Math.abs(brakeDecel) > Math.abs(this.speed)) {
          this.speed = 0;
        } else {
          this.speed -= brakeDecel;
        }
      }

      // Clamp speed limits
      this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeedReverse, this.maxSpeedForward);
    }

    // Steering turn calculation (Ackerman approximation)
    if (Math.abs(this.speed) > 0.05) {
      // Angular velocity = (speed / wheelbase) * tan(steer)
      const turnRadius = this.wheelBase / Math.max(Math.tan(this.currentSteer), 0.001);
      const angularVelocity = (this.speed / turnRadius);
      this.heading += angularVelocity * dt;
    }

    // Update position along heading
    const forward = new THREE.Vector3(
      Math.sin(this.heading),
      0,
      Math.cos(this.heading)
    );

    const prevPos = this.position.clone();
    this.position.addScaledVector(forward, this.speed * dt);

    // Collision check against city buildings and sidewalks
    const collidedCity = city.checkCollision(this.position, 1.2);
    if (collidedCity) {
      // Revert position and stop/bounce
      this.position.copy(prevPos);
      if (Math.abs(this.speed) > 4) {
        this.sound.playCrash();
        this.comfort = Math.max(0, this.comfort - 25);
      }
      this.speed = -this.speed * 0.3;
    }

    // Collision check against traffic cars
    const collidedCar = traffic.checkCollision(this.position, 1.6);
    if (collidedCar) {
      this.position.copy(prevPos);
      this.sound.playCrash();
      this.comfort = Math.max(0, this.comfort - 35);
      this.speed = -this.speed * 0.4;
    }

    // Update 3D mesh transforms
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    // Suspension dynamics (subtle chassis pitch & roll)
    const accelG = driveForce - (brakeForce * Math.sign(this.speed));
    this.suspensionPitch = THREE.MathUtils.lerp(this.suspensionPitch, -accelG * 0.004, dt * 8);
    const lateralG = (this.speed * this.speed * Math.sin(this.currentSteer)) * 0.003;
    this.suspensionRoll = THREE.MathUtils.lerp(this.suspensionRoll, -lateralG, dt * 8);

    if (this.bodyMesh) {
      this.bodyMesh.rotation.x = this.suspensionPitch;
      this.bodyMesh.rotation.z = this.suspensionRoll;
    }

    // Spin wheels with travel speed
    const wheelCircumference = 2 * Math.PI * 0.33;
    const wheelRotDelta = (this.speed * dt / wheelCircumference) * Math.PI * 2;
    this.frontLeftWheel.children[0].rotation.x += wheelRotDelta;
    this.frontRightWheel.children[0].rotation.x += wheelRotDelta;
    this.rearLeftWheel.children[0].rotation.x += wheelRotDelta;
    this.rearRightWheel.children[0].rotation.x += wheelRotDelta;

    // Update brake lights visual glow
    const isBraking = this.brake > 0.1 || this.gear === 'P';
    this.brakeLights.forEach(mat => {
      mat.emissive.setHex(isBraking ? 0xef4444 : 0x7f1d1d);
      mat.emissiveIntensity = isBraking ? 2.5 : 0.4;
    });

    // Speed in km/h for UI and audio
    this.speedKmh = Math.round(this.speed * 3.6);

    // Fuel consumption
    if (this.throttle > 0 && Math.abs(this.speed) > 0.1) {
      this.fuel = Math.max(0, this.fuel - (dt * 0.15 * this.throttle));
    }

    // Audio update
    const rpmRatio = Math.min(Math.abs(this.speedKmh) / 120, 1.0);
    this.sound.updateEngine(this.speedKmh, this.throttle, rpmRatio);
  }

  reset(x = 0, z = 0, heading = 0) {
    this.position.set(x, 0, z);
    this.heading = heading;
    this.speed = 0;
    this.speedKmh = 0;
    this.steeringAngle = 0;
    this.currentSteer = 0;
    this.throttle = 0;
    this.brake = 0;
    this.gear = 'D';
    this.fuel = 100;
    this.comfort = 100;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;
  }
}
