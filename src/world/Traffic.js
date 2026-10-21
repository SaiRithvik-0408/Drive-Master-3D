import * as THREE from 'three';

export class Traffic {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.carCount = 18;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.spawnTraffic();
  }

  spawnTraffic() {
    const laneOffsets = [-4.0, 4.0]; // lanes on each avenue
    const types = ['sedan', 'taxi', 'suv', 'van'];
    const colors = [0xef4444, 0x3b82f6, 0xffffff, 0x10b981, 0x64748b, 0x8b5cf6];

    for (let i = 0; i < this.carCount; i++) {
      const type = types[i % types.length];
      const isNorthSouth = Math.random() > 0.5;
      const lane = laneOffsets[Math.floor(Math.random() * laneOffsets.length)];
      const direction = lane > 0 ? 1 : -1; // lane direction

      let carMesh;
      let width = 1.8;
      let length = 4.0;
      let height = 1.4;

      if (type === 'taxi') {
        carMesh = this.createCarMesh(0xfacc15, 1.8, 4.0, 1.35, true);
      } else if (type === 'suv') {
        carMesh = this.createCarMesh(0x1e293b, 2.0, 4.5, 1.6);
        width = 2.0; length = 4.5; height = 1.6;
      } else if (type === 'van') {
        carMesh = this.createCarMesh(0xe2e8f0, 2.0, 4.8, 2.0);
        width = 2.0; length = 4.8; height = 2.0;
      } else {
        const col = colors[Math.floor(Math.random() * colors.length)];
        carMesh = this.createCarMesh(col, 1.8, 4.0, 1.35);
      }

      this.group.add(carMesh);

      // Random starting coordinates along major road corridors
      const corridor = (Math.floor(Math.random() * 4) - 2) * 120;
      let posX = 0;
      let posZ = 0;
      let heading = 0;

      if (isNorthSouth) {
        posX = corridor + lane;
        posZ = (Math.random() - 0.5) * 400;
        heading = direction === 1 ? 0 : Math.PI;
      } else {
        posX = (Math.random() - 0.5) * 400;
        posZ = corridor + lane;
        heading = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
      }

      carMesh.position.set(posX, 0, posZ);
      carMesh.rotation.y = heading;

      this.cars.push({
        mesh: carMesh,
        speed: 7 + Math.random() * 5, // ~25 to 45 km/h
        targetSpeed: 7 + Math.random() * 5,
        heading: heading,
        width: width,
        length: length,
        isNorthSouth: isNorthSouth,
        direction: direction,
        corridor: corridor,
        lane: lane
      });
    }
  }

  createCarMesh(colorHex, w, l, h, isTaxi = false) {
    const carGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.6,
      roughness: 0.3
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8
    });

    // Lower chassis
    const bodyGeo = new THREE.BoxGeometry(w, h * 0.45, l);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = (h * 0.45) / 2 + 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    carGroup.add(body);

    // Upper cabin
    const cabinGeo = new THREE.BoxGeometry(w * 0.88, h * 0.48, l * 0.55);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, h * 0.7, -l * 0.05);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Headlights & Taillights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const headGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const hl1 = new THREE.Mesh(headGeo, headMat);
    hl1.position.set(-w * 0.35, 0.45, l / 2);
    const hl2 = new THREE.Mesh(headGeo, headMat);
    hl2.position.set(w * 0.35, 0.45, l / 2);
    carGroup.add(hl1);
    carGroup.add(hl2);

    const tl1 = new THREE.Mesh(headGeo, tailMat);
    tl1.position.set(-w * 0.35, 0.45, -l / 2);
    const tl2 = new THREE.Mesh(headGeo, tailMat);
    tl2.position.set(w * 0.35, 0.45, -l / 2);
    carGroup.add(tl1);
    carGroup.add(tl2);

    // Taxi roof sign
    if (isTaxi) {
      const signGeo = new THREE.BoxGeometry(0.6, 0.2, 0.3);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, h + 0.15, -l * 0.05);
      carGroup.add(sign);
    }

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    const wheelPositions = [
      [-w / 2, 0.3, l * 0.32],
      [w / 2, 0.3, l * 0.32],
      [-w / 2, 0.3, -l * 0.32],
      [w / 2, 0.3, -l * 0.32]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      carGroup.add(wheel);
    });

    return carGroup;
  }

  update(dt, playerPos) {
    this.cars.forEach(car => {
      // Forward direction vector
      const forward = new THREE.Vector3(
        Math.sin(car.heading),
        0,
        Math.cos(car.heading)
      );

      // Check distance to player in front
      const toPlayer = new THREE.Vector3().subVectors(playerPos, car.mesh.position);
      const distToPlayer = toPlayer.length();
      const dotPlayer = forward.dot(toPlayer.clone().normalize());

      let shouldBrake = false;

      // If player is directly ahead within 14 meters, brake
      if (dotPlayer > 0.8 && distToPlayer < 14) {
        shouldBrake = true;
      }

      // Check distance to other traffic ahead
      for (let other of this.cars) {
        if (other === car) continue;
        const toOther = new THREE.Vector3().subVectors(other.mesh.position, car.mesh.position);
        const distOther = toOther.length();
        if (distOther < 12 && forward.dot(toOther.clone().normalize()) > 0.85) {
          shouldBrake = true;
          break;
        }
      }

      // Adjust speed
      if (shouldBrake) {
        car.speed = Math.max(0, car.speed - (dt * 15));
      } else {
        car.speed = THREE.MathUtils.lerp(car.speed, car.targetSpeed, dt * 2);
      }

      // Move car
      car.mesh.position.addScaledVector(forward, car.speed * dt);

      // Despawn & wrap if too far from player
      const distFromPlayer = car.mesh.position.distanceTo(playerPos);
      if (distFromPlayer > 260) {
        // Move ahead of player in travel direction
        const spawnDist = 180 + Math.random() * 50;
        const respawnPos = playerPos.clone().addScaledVector(forward, spawnDist);
        if (car.isNorthSouth) {
          car.mesh.position.set(car.corridor + car.lane, 0, respawnPos.z);
        } else {
          car.mesh.position.set(respawnPos.x, 0, car.corridor + car.lane);
        }
      }
    });
  }

  checkCollision(playerPos, playerRadius = 1.4) {
    for (let car of this.cars) {
      const dist = car.mesh.position.distanceTo(playerPos);
      if (dist < playerRadius + (car.width / 2)) {
        return car;
      }
    }
    return null;
  }
}
