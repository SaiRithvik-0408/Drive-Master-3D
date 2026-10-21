# Drive Master 3D 🚗💨

**Drive Master 3D** is a realistic casual 3D city car driving simulation game built with Three.js, Vite, and Capacitor for Web, Android, and Google Play Store deployment.

---

## 🎮 Key Features

* **3 Camera Perspectives**:
  * **Cockpit View**: Realistic driver's seat perspective with a live rendered **Rearview Mirror** showing traffic approaching from behind.
  * **Chase View**: Dynamic 3rd-person follow camera with turn sway and acceleration tilt.
  * **Top-Down View**: Tactical high-angle overview for precision parking maneuvers.
* **Authentic Controls**:
  * **Interactive Steering Wheel**: Responsive mouse/touch drag, `A`/`D` steering, realistic spring-to-center physics, and center horn button.
  * **Automatic/Manual Shifter**: Drive (`D`), Reverse (`R` with parking guide lines and backup beeper), Neutral (`N`), and Park (`P`).
  * **Pedals**: Brushed aluminum Throttle (`W`) and Brake (`S`/`Space`) with depression animations.
  * **Turn Indicators**: Left (`Q`) and Right (`E`) indicators with audio tick-tock.
* **5 Mission Modes**:
  1. **Speed Run**: Time-attack checkpoint rush through city traffic.
  2. **Highway Weave**: High-speed overtaking challenge.
  3. **Precision Parking**: Tight cornering into marked plaza parking bays.
  4. **VIP Escort**: Smooth chauffeur drive monitoring G-forces and passenger comfort.
  5. **Eco Driver**: Limited fuel survival challenge.
* **Dynamic 3D City & Traffic**:
  * Multi-lane avenues, intersections, skyscrapers, street lamps, and sidewalks.
  * AI Traffic system: Sedans, Taxis, SUVs, and Vans that obey lanes and brake for obstacles.
* **Web Audio Synthesizer**:
  * Zero-dependency procedural audio engine generating engine pitch scaled to RPM/speed, tire screech, dual-tone car horn, reverse beeps, and crash impacts.

---

## 🚀 Quick Start (Local Web Server)

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 📱 Android & Google Play Store

* **Application ID**: `com.karna.drivemaster3d`
* **Target SDK**: Android 14+ (API Level 36)
* **Orientation**: Locked Landscape

### Automated Cloud Build (GitHub Actions)
Whenever code is pushed to this repository:
1. GitHub Actions automatically sets up JDK 17, Android SDK 34, and Gradle.
2. It compiles both:
   * **`drive-master-debug-apk`**: Downloadable `.apk` for direct testing on Android devices.
   * **`drive-master-playstore-aab`**: Google Play Store compliant App Bundle (`.aab`).
3. Download artifacts directly from the **Actions** tab on GitHub.

See [PLAYSTORE_PUBLISH_GUIDE.md](./PLAYSTORE_PUBLISH_GUIDE.md) for complete Play Console submission steps.
