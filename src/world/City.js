import * as THREE from 'three';

export class City {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Bounding boxes for buildings & barriers
    this.parkingSpots = []; // Target parking bay locations
    this.trafficLights = [];

    this.roadWidth = 16.0; // 4 lanes total (2 each direction)
    this.blockSize = 120.0;
    this.gridCount = 4; // 4x4 blocks

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildCity();
  }

  buildCity() {
    this.createGround();
    this.createRoadNetwork();
    this.createBuildings();
    this.createStreetFurniture();
    this.createParkingPlaza();
  }

  createGround() {
    const size = (this.gridCount + 2) * this.blockSize;
    const groundGeo = new THREE.PlaneGeometry(size, size);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  createRoadNetwork() {
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1
    });

    const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteDashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

    const totalSpan = this.gridCount * this.blockSize;
    const halfSpan = totalSpan / 2;

    // Build grid avenues and cross streets
    for (let i = 0; i <= this.gridCount; i++) {
      const coord = -halfSpan + (i * this.blockSize);

      // East-West Road (Z axis aligned)
      const roadGeoZ = new THREE.PlaneGeometry(this.roadWidth, totalSpan + this.blockSize);
      const roadZ = new THREE.Mesh(roadGeoZ, asphaltMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(coord, 0.01, 0);
      roadZ.receiveShadow = true;
      this.group.add(roadZ);

      // North-South Road (X axis aligned)
      const roadGeoX = new THREE.PlaneGeometry(totalSpan + this.blockSize, this.roadWidth);
      const roadX = new THREE.Mesh(roadGeoX, asphaltMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.01, coord);
      roadX.receiveShadow = true;
      this.group.add(roadX);

      // Center Yellow Dividing Line on Z road
      const yellowLineGeo = new THREE.PlaneGeometry(0.2, totalSpan + this.blockSize);
      const yellowLineZ = new THREE.Mesh(yellowLineGeo, yellowLineMat);
      yellowLineZ.rotation.x = -Math.PI / 2;
      yellowLineZ.position.set(coord, 0.02, 0);
      this.group.add(yellowLineZ);

      // Center Yellow Dividing Line on X road
      const yellowLineGeoX = new THREE.PlaneGeometry(totalSpan + this.blockSize, 0.2);
      const yellowLineX = new THREE.Mesh(yellowLineGeoX, yellowLineMat);
      yellowLineX.rotation.x = -Math.PI / 2;
      yellowLineX.position.set(0, 0.02, coord);
      this.group.add(yellowLineX);

      // Dashed lane lines (2 per road for 4-lane avenue)
      for (let offset of [-4.0, 4.0]) {
        // Dashed lines along Z
        for (let z = -halfSpan; z <= halfSpan; z += 10) {
          const dashGeo = new THREE.PlaneGeometry(0.18, 4.0);
          const dash = new THREE.Mesh(dashGeo, whiteDashMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(coord + offset, 0.02, z);
          this.group.add(dash);
        }

        // Dashed lines along X
        for (let x = -halfSpan; x <= halfSpan; x += 10) {
          const dashGeo = new THREE.PlaneGeometry(4.0, 0.18);
          const dash = new THREE.Mesh(dashGeo, whiteDashMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(x, 0.02, coord + offset);
          this.group.add(dash);
        }
      }

      // Concrete Curbs & Sidewalks
      const sidewalkWidth = 4.0;
      const curbGeoZ = new THREE.BoxGeometry(sidewalkWidth, 0.25, totalSpan + this.blockSize);

      const curbZL = new THREE.Mesh(curbGeoZ, curbMat);
      curbZL.position.set(coord - (this.roadWidth / 2) - (sidewalkWidth / 2), 0.12, 0);
      this.group.add(curbZL);

      const curbZR = new THREE.Mesh(curbGeoZ, curbMat);
      curbZR.position.set(coord + (this.roadWidth / 2) + (sidewalkWidth / 2), 0.12, 0);
      this.group.add(curbZR);
    }
  }

  createBuildings() {
    const colors = [0x1e293b, 0x334155, 0x475569, 0x0f172a, 0x1e1b4b, 0x064e3b, 0x312e81];
    const totalSpan = this.gridCount * this.blockSize;
    const halfSpan = totalSpan / 2;
    const halfRoad = this.roadWidth / 2 + 3.0;

    for (let bx = 0; bx < this.gridCount; bx++) {
      for (let bz = 0; bz < this.gridCount; bz++) {
        // Skip one corner block for the designated Parking Lot & Hospital plaza
        if (bx === 1 && bz === 1) continue;

        const blockCenterX = -halfSpan + (bx * this.blockSize) + (this.blockSize / 2);
        const blockCenterZ = -halfSpan + (bz * this.blockSize) + (this.blockSize / 2);

        // Subdivide block into 4 to 6 unique architectural buildings
        const subSlots = [
          { dx: -24, dz: -24, w: 42, d: 42 },
          { dx: 24, dz: -24, w: 42, d: 42 },
          { dx: -24, dz: 24, w: 42, d: 42 },
          { dx: 24, dz: 24, w: 42, d: 42 }
        ];

        subSlots.forEach((slot, idx) => {
          const height = 30 + ((bx * 7 + bz * 13 + idx * 19) % 75);
          const col = colors[(bx + bz + idx) % colors.length];

          const bMat = new THREE.MeshStandardMaterial({
            color: col,
            roughness: 0.4,
            metalness: 0.6
          });

          const bGeo = new THREE.BoxGeometry(slot.w, height, slot.d);
          const bMesh = new THREE.Mesh(bGeo, bMat);
          const posX = blockCenterX + slot.dx;
          const posZ = blockCenterZ + slot.dz;
          bMesh.position.set(posX, height / 2, posZ);
          bMesh.castShadow = true;
          bMesh.receiveShadow = true;
          this.group.add(bMesh);

          // Add glowing window bands / trim
          const windowBandGeo = new THREE.BoxGeometry(slot.w + 0.2, 0.4, slot.d + 0.2);
          const windowMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
          for (let h = 4; h < height - 2; h += 6) {
            const band = new THREE.Mesh(windowBandGeo, windowMat);
            band.position.set(posX, h, posZ);
            this.group.add(band);
          }

          // Register collision bounding box (with safety margin)
          this.colliders.push({
            minX: posX - (slot.w / 2),
            maxX: posX + (slot.w / 2),
            minZ: posZ - (slot.d / 2),
            maxZ: posZ + (slot.d / 2)
          });
        });
      }
    }
  }

  createStreetFurniture() {
    const totalSpan = this.gridCount * this.blockSize;
    const halfSpan = totalSpan / 2;
    const offset = (this.roadWidth / 2) + 1.2;

    const lampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // Place street lamps along avenues
    for (let i = 0; i <= this.gridCount; i++) {
      const coord = -halfSpan + (i * this.blockSize);
      for (let pos = -halfSpan + 20; pos <= halfSpan - 20; pos += 40) {
        // Lamp on Z road
        this.addStreetLamp(coord - offset, pos, lampMat, bulbMat, Math.PI / 2);
        this.addStreetLamp(coord + offset, pos, lampMat, bulbMat, -Math.PI / 2);

        // Lamp on X road
        this.addStreetLamp(pos, coord - offset, lampMat, bulbMat, 0);
        this.addStreetLamp(pos, coord + offset, lampMat, bulbMat, Math.PI);
      }
    }
  }

  addStreetLamp(x, z, postMat, bulbMat, rotY) {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(x, 0, z);
    lampGroup.rotation.y = rotY;

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8);
    const pole = new THREE.Mesh(poleGeo, postMat);
    pole.position.y = 2.75;
    lampGroup.add(pole);

    // Arm
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 1.4);
    const arm = new THREE.Mesh(armGeo, postMat);
    arm.position.set(0, 5.4, 0.6);
    lampGroup.add(arm);

    // Bulb fixture
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0, 5.25, 1.2);
    lampGroup.add(bulb);

    this.group.add(lampGroup);
  }

  createParkingPlaza() {
    // Located at block (1, 1)
    const totalSpan = this.gridCount * this.blockSize;
    const halfSpan = totalSpan / 2;
    const plazaX = -halfSpan + (1 * this.blockSize) + (this.blockSize / 2);
    const plazaZ = -halfSpan + (1 * this.blockSize) + (this.blockSize / 2);

    // Plaza asphalt surface
    const plazaGeo = new THREE.PlaneGeometry(90, 90);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(plazaX, 0.02, plazaZ);
    this.group.add(plaza);

    // Yellow Parking Bays
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const bayW = 3.2;
    const bayL = 6.0;

    // 6 angled parking spots
    for (let i = 0; i < 5; i++) {
      const spotX = plazaX - 25 + (i * 12);
      const spotZ = plazaZ;

      // Lines
      const lineL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, bayL), yellowMat);
      lineL.rotation.x = -Math.PI / 2;
      lineL.position.set(spotX - (bayW / 2), 0.03, spotZ);
      this.group.add(lineL);

      const lineR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, bayL), yellowMat);
      lineR.rotation.x = -Math.PI / 2;
      lineR.position.set(spotX + (bayW / 2), 0.03, spotZ);
      this.group.add(lineR);

      const lineBack = new THREE.Mesh(new THREE.PlaneGeometry(bayW, 0.2), yellowMat);
      lineBack.rotation.x = -Math.PI / 2;
      lineBack.position.set(spotX, 0.03, spotZ - (bayL / 2));
      this.group.add(lineBack);

      this.parkingSpots.push({
        x: spotX,
        z: spotZ,
        width: bayW,
        length: bayL,
        id: i
      });
    }

    // Glowing target marker for the designated parking spot (Spot #2)
    const targetSpot = this.parkingSpots[2];
    const markerGeo = new THREE.PlaneGeometry(bayW - 0.4, bayL - 0.4);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.parkingMarker = new THREE.Mesh(markerGeo, markerMat);
    this.parkingMarker.rotation.x = -Math.PI / 2;
    this.parkingMarker.position.set(targetSpot.x, 0.04, targetSpot.z);
    this.group.add(this.parkingMarker);
  }

  // Fast AABB Collision detection
  checkCollision(pos, radius = 1.0) {
    for (let c of this.colliders) {
      if (
        pos.x + radius > c.minX &&
        pos.x - radius < c.maxX &&
        pos.z + radius > c.minZ &&
        pos.z - radius < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }
}
