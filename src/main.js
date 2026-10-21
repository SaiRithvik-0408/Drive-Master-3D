import * as THREE from 'three';
import { SoundManager } from './audio/SoundManager.js';
import { Vehicle } from './physics/Vehicle.js';
import { City } from './world/City.js';
import { Traffic } from './world/Traffic.js';
import { MissionManager } from './game/MissionManager.js';
import { HUD } from './ui/HUD.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas3d = document.getElementById('canvas3d');
    this.rearviewCanvas = document.getElementById('rearview-canvas');

    // Camera modes: 'cockpit', 'chase', 'topdown'
    this.cameraMode = 'chase';

    // Systems
    this.sound = new SoundManager();
    this.missionManager = new MissionManager(this.sound);

    this.initScene();
    this.initLights();

    this.city = new City(this.scene);
    this.traffic = new Traffic(this.scene);
    this.vehicle = new Vehicle(this.scene, this.sound);

    this.initWaypointMarker();
    this.initHUD();

    this.clock = new THREE.Clock();
    this.bindWindowResize();

    // Start render loop
    this.animate();
  }

  initScene() {
    // 3D Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);
    this.scene.fog = new THREE.FogExp2(0x090d16, 0.0045);

    // Main Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      800
    );

    // Rearview Mirror Camera
    this.rearviewCamera = new THREE.PerspectiveCamera(50, 200 / 56, 0.2, 200);

    // Main Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas3d,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Rearview Mirror Renderer
    this.rearviewRenderer = new THREE.WebGLRenderer({
      canvas: this.rearviewCanvas,
      antialias: false
    });
    this.rearviewRenderer.setSize(200, 56);
  }

  initLights() {
    // Ambient Sky illumination
    const ambient = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.9);
    this.scene.add(ambient);

    // Sun / Moonlight Directional
    this.sun = new THREE.DirectionalLight(0xfffbeb, 1.8);
    this.sun.position.set(60, 100, 40);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 300;

    const shadowDist = 45;
    this.sun.shadow.camera.left = -shadowDist;
    this.sun.shadow.camera.right = shadowDist;
    this.sun.shadow.camera.top = shadowDist;
    this.sun.shadow.camera.bottom = -shadowDist;
    this.sun.shadow.bias = -0.0005;

    this.scene.add(this.sun);
  }

  initWaypointMarker() {
    this.waypointGroup = new THREE.Group();

    // Glowing beam
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 50, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.4
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 25;
    this.waypointGroup.add(beam);

    // Ground target ring
    const ringGeo = new THREE.RingGeometry(3.5, 4.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    this.waypointGroup.add(ring);

    this.scene.add(this.waypointGroup);
  }

  initHUD() {
    this.hud = new HUD(
      this.vehicle,
      this.missionManager,
      this.sound,
      () => this.cycleCamera()
    );
  }

  cycleCamera() {
    if (this.cameraMode === 'cockpit') {
      this.cameraMode = 'chase';
    } else if (this.cameraMode === 'chase') {
      this.cameraMode = 'topdown';
    } else {
      this.cameraMode = 'cockpit';
    }

    const modeLabels = {
      cockpit: '🎥 COCKPIT',
      chase: '🎥 CHASE',
      topdown: '🎥 TOP-DOWN'
    };
    document.getElementById('btn-camera').textContent = modeLabels[this.cameraMode];
  }

  updateCamera(dt) {
    const vPos = this.vehicle.position;
    const heading = this.vehicle.heading;

    // Follow sun position with car for optimal shadow detail
    this.sun.position.set(vPos.x + 50, 100, vPos.z + 30);
    this.sun.target.position.copy(vPos);
    this.sun.target.updateMatrixWorld();

    if (this.cameraMode === 'cockpit') {
      // Attached to vehicle interior anchor
      const anchorPos = new THREE.Vector3();
      this.vehicle.cockpitCameraAnchor.getWorldPosition(anchorPos);
      this.camera.position.copy(anchorPos);

      // Look straight ahead out the windshield
      const lookDist = 40.0;
      const targetLook = new THREE.Vector3(
        anchorPos.x + Math.sin(heading) * lookDist,
        anchorPos.y - 0.2,
        anchorPos.z + Math.cos(heading) * lookDist
      );
      this.camera.lookAt(targetLook);

      // Hide car exterior roof in cockpit for unobstructed view
      if (this.vehicle.bodyMesh) {
        this.vehicle.bodyMesh.visible = true;
      }
    } else if (this.cameraMode === 'chase') {
      // Smooth dynamic third-person chase camera
      const chaseDist = 7.2;
      const chaseHeight = 2.7;

      const idealCamPos = new THREE.Vector3(
        vPos.x - Math.sin(heading) * chaseDist,
        vPos.y + chaseHeight,
        vPos.z - Math.cos(heading) * chaseDist
      );

      this.camera.position.lerp(idealCamPos, dt * 10.0);

      const lookAhead = 14.0;
      const targetLook = new THREE.Vector3(
        vPos.x + Math.sin(heading) * lookAhead,
        vPos.y + 1.2,
        vPos.z + Math.cos(heading) * lookAhead
      );
      this.camera.lookAt(targetLook);
    } else if (this.cameraMode === 'topdown') {
      // High tactical overview
      const topHeight = 22.0;
      const idealCamPos = new THREE.Vector3(
        vPos.x - Math.sin(heading) * 4.0,
        vPos.y + topHeight,
        vPos.z - Math.cos(heading) * 4.0
      );
      this.camera.position.lerp(idealCamPos, dt * 8.0);
      this.camera.lookAt(vPos.x, vPos.y, vPos.z);
    }

    // Rearview Mirror Camera update (Faces backward from driver's seat)
    if (this.cameraMode === 'cockpit') {
      const anchorPos = new THREE.Vector3();
      this.vehicle.cockpitCameraAnchor.getWorldPosition(anchorPos);
      this.rearviewCamera.position.set(anchorPos.x, anchorPos.y + 0.25, anchorPos.z);

      const rearLook = new THREE.Vector3(
        anchorPos.x - Math.sin(heading) * 35.0,
        anchorPos.y,
        anchorPos.z - Math.cos(heading) * 35.0
      );
      this.rearviewCamera.lookAt(rearLook);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);

    // Update vehicle physics & city collisions
    this.vehicle.update(dt, this.city, this.traffic);

    // Update AI traffic cars
    this.traffic.update(dt, this.vehicle.position);

    // Update missions
    this.missionManager.update(
      dt,
      this.vehicle,
      (stats) => this.hud.showVictory(stats),
      (reason) => this.hud.showFail(reason)
    );

    // Update Waypoint position and rotation
    if (this.missionManager.active) {
      this.waypointGroup.visible = true;
      this.waypointGroup.position.copy(this.missionManager.targetPosition);
      this.waypointGroup.children[1].rotation.z += dt * 1.5;
    } else {
      this.waypointGroup.visible = false;
    }

    // Update Camera
    this.updateCamera(dt);

    // Update HUD
    this.hud.update(dt, this.cameraMode);

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Render Rearview Mirror in cockpit mode
    if (this.cameraMode === 'cockpit') {
      this.rearviewRenderer.render(this.scene, this.rearviewCamera);
    }
  }

  bindWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
