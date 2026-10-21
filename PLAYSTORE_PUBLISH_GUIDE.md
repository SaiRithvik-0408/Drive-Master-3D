# Google Play Store Publishing Guide for Drive Master 3D

This guide walks you through building your **Android App Bundle (.aab)** and publishing it to the **Google Play Console**.

---

## 1. Important Play Store Requirements

1. **Format**: Google Play requires **Android App Bundle (.aab)** for all new apps (not `.apk`). The `.apk` is used for testing on your phone directly.
2. **Package ID**: Configured as `com.karna.drivemaster3d` in `capacitor.config.json` and `android/app/build.gradle`.
3. **Target SDK**: Configured as `targetSdkVersion = 36` (exceeds Google Play's required Android 14 / API 34+ requirement).
4. **Orientation**: Locked to **Landscape** in `AndroidManifest.xml` for driving simulation.

---

## 2. Generating the Build (.aab & .apk)

Choose one of two ways to build:

### Option A: Zero-Install Cloud Build (Fastest & Free via GitHub Actions)
You do not need to install Android Studio or Java on your PC.

1. Initialize a git repository and push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Dr Driving 3D game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dr-driving-3d.git
   git push -u origin main
   ```
2. In your GitHub repository:
   * Go to the **Actions** tab.
   * The workflow **"Build Android APK and Play Store AAB"** will automatically run.
   * Once finished (~2 minutes), download the artifacts:
     * **`dr-driving-debug-apk`**: Download and install directly on your Android phone to test.
     * **`dr-driving-playstore-aab`**: The bundle to upload directly to Google Play Console.

---

### Option B: Local Build via Android Studio
1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open your terminal in this directory and run:
   ```bash
   npx cap open android
   ```
3. Android Studio will open the `android` folder automatically.
4. Go to the top menu: **Build > Generate Signed Bundle / APK...**
5. Select **Android App Bundle**, click **Next**.
6. Create a new Key Store:
   * **Key store path**: Choose a safe location (e.g., `my-release-key.jks`).
   * **Password**: Set a strong password (keep this safe; you'll need it for future updates).
   * **Alias**: `drdriving`
   * Fill in your name/organization.
7. Select **release** build variant and click **Create**.
8. Your signed `.aab` will be generated in `android/app/release/`.

---

## 3. Submitting to Google Play Console

### Step 1: Create Your App
1. Go to the [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   * **App name**: `Dr. Driving 3D: City Simulator` (or your preferred name)
   * **Default language**: English (United States)
   * **App or Game**: Game
   * **Free or Paid**: Free

### Step 2: Set Up Store Listing
Under **Grow > Store presence > Main store listing**:
* **Short description**: `Realistic 3D casual city car driving simulator with missions, manual transmission, and parking.`
* **Full description**:
  ```text
  Experience the ultimate 3D driving simulation game!
  
  Features:
  - Realistic cockpit view with dynamic rearview mirror
  - Interactive sports steering wheel with auto-centering
  - Complete transmission controls: Drive (D), Reverse (R), Park (P), Neutral (N)
  - 5 Exciting Game Modes: Speed Run, Highway Weave, Precision Parking, VIP Chauffeur, and Eco Driver
  - Dynamic city with multi-lane avenues and intelligent AI traffic
  - Realistic engine sound synthesizer, horns, brake skids, and reverse beepers
  - Garage customizer with multiple car paint options
  ```
* **Graphics required**:
  * **App Icon**: 512 × 512 px (PNG)
  * **Feature Graphic**: 1024 × 500 px (PNG/JPEG)
  * **Screenshots**: At least 2 landscape screenshots (16:9 ratio, minimum 1080p).

### Step 3: Complete App Content Questionnaires
Navigate to **Policy and programs > App content** and complete:
* **Privacy Policy**: If needed, generate a free standard policy via [privacypolicies.com](https://www.privacypolicies.com/).
* **Target Audience**: 13+ or General Audience.
* **Content Rating**: Complete the IARC questionnaire (select "Simulation Game", no violence).
* **Ads & Data Safety**: Declare whether you show ads (None currently).

### Step 4: Create a Release
1. Go to **Release > Production** (or **Closed testing** / **Internal testing** first to test with friends).
2. Click **Create new release**.
3. Under **App bundles**, drag & drop the generated `.aab` file (`app-release.aab`).
4. Enter a release name (e.g., `1.0.0 (1)`) and release notes:
   * *Initial release of Dr. Driving 3D Simulator.*
5. Click **Next** > **Review release** > **Start rollout to Production**!

Google usually reviews new developer submissions within 1–3 business days.
