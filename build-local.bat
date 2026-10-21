@echo off
echo ========================================================
echo       Dr. Driving 3D - Android Build Assistant
echo ========================================================
echo.

echo 1. Building Web Assets...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Syncing Capacitor Android Project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 3. Checking for Java...
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [NOTICE] Java (JDK) was not found in your PATH.
    echo To build locally on your PC:
    echo   Option A: Open the project in Android Studio by running: npx cap open android
    echo   Option B: Install OpenJDK 17 and Android Command Line Tools.
    echo.
    echo Alternatively, push this repo to GitHub to build the APK and AAB automatically via GitHub Actions!
    pause
    exit /b 0
)

echo.
echo 4. Compiling Android APK and AAB with Gradle...
cd android
call gradlew.bat assembleDebug bundleRelease
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gradle build failed!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ========================================================
echo [SUCCESS] Build Complete!
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo AAB location: android\app\build\outputs\bundle\release\app-release.aab
echo ========================================================
pause
