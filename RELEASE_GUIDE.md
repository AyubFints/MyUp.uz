# AX-Map (uz.axmap.app) — Production Release Guide

This document provides complete documentation of keystore credentials, cryptographic certificates, Digital Asset Links, Android Trusted Web Activity (TWA) project architecture, build instructions, Google Play Console submission requirements, manual QA protocol, and master E2E verification procedures for publishing AX-Map to the Google Play Store.

---

## 1. Release Application Metadata

| Parameter | Value |
|---|---|
| **Application Name** | AX-Map |
| **Full Title** | AX-Map - Sizga eng yaqinini topib beradi! |
| **Package ID / Application ID** | `uz.axmap.app` |
| **Production Web URL** | `https://myupuz.vercel.app` |
| **TWA Entry URL** | `https://myupuz.vercel.app/?source=pwa` |
| **Release Version Name** | `1.0.0` |
| **Release Version Code** | `1` |
| **Target Android API** | Android 14 (API 34) / Android 15 (API 35) |
| **Minimum Android API** | Android 5.0 Lollipop (API 21) |
| **Release Artifact** | `uz.axmap.app-v1.0.0-release.aab` (Android App Bundle) |

---

## 2. Production Keystore & Certificate Credentials

The production release signing key is stored in the workspace root and must be securely archived for long-term Play Store updates.

| Credential / Parameter | Specification | Notes |
|---|---|---|
| **Keystore File Path** | `c:\Users\user\Desktop\MyUp\axmap-release-key.jks` | Workspace root |
| **Keystore Format** | JKS | Standard Java Keystore |
| **Key Alias** | `axmap` | Release key entry alias |
| **Keystore Store Password** | `AxMap2026ReleasePass!` | Used to unlock the keystore |
| **Key Password** | `AxMap2026ReleasePass!` | Used to access the private key |
| **Key Algorithm** | `RSA` | 2048-bit asymmetric key pair |
| **Signature Algorithm** | `SHA256withRSA` | SHA-256 digest with RSA signature |
| **Validity Period** | `10000` days | Valid until March 28, 2054 |
| **Distinguished Name (dname)** | `CN=AX-Map, OU=Mobile, O=AX-Map, L=Tashkent, ST=Tashkent, C=UZ` | Certificate Subject / Issuer |
| **Serial Number** | `5507831c` | Unique certificate identifier |

### Cryptographic Fingerprints

- **SHA-1 Fingerprint**:
  `EE:7A:D1:39:20:A3:DC:16:E0:7C:F7:73:44:F0:FC:3F:A1:15:85:B3`

- **SHA-256 Certificate Fingerprint (Play Store & AssetLinks)**:
  `55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A`

---

## 3. Digital Asset Links (`assetlinks.json`)

To enable full-screen, address-bar-free Trusted Web Activity verification on Android devices, Google Play and Chrome require a valid statement at `https://myupuz.vercel.app/.well-known/assetlinks.json`.

- **Source File**: `c:\Users\user\Desktop\MyUp\public\.well-known\assetlinks.json`
- **Build Output**: `c:\Users\user\Desktop\MyUp\dist\.well-known\assetlinks.json` (verified byte-for-byte identical)
- **Live URL**: `https://myupuz.vercel.app/.well-known/assetlinks.json`

### Statement Content:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "uz.axmap.app",
      "sha256_cert_fingerprints": [
        "55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A"
      ]
    }
  }
]
```

---

## 4. Android TWA Project Architecture (`android-twa/`)

The TWA project is structured as a standalone Gradle project with Google `androidbrowserhelper` and `@bubblewrap/cli` dual compatibility.

### Project Layout:
```text
android-twa/
├── build.gradle                          # Root Gradle build script (AGP 8.9.1)
├── settings.gradle                       # Includes ':app'
├── gradle.properties                     # JVM args & AndroidX settings
├── gradlew & gradlew.bat                 # Gradle wrapper executables
├── twa-manifest.json                     # Bubblewrap project manifest
├── manifest-checksum.txt                 # SHA-1 checksum for non-interactive builds
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties         # Gradle 8.11.1 distribution
└── app/
    ├── build.gradle                      # App-level build config, signingConfigs & dependencies
    └── src/main/
        ├── AndroidManifest.xml           # LauncherActivity, DelegationService, FileProvider, autoVerify
        ├── java/uz/axmap/app/
        │   ├── Application.java          # Application class
        │   ├── LauncherActivity.java     # Main TWA Launcher Activity with orientation handling
        │   └── DelegationService.java    # Delegation service with LocationDelegationExtraCommandHandler
        └── res/
            ├── drawable*/splash.png      # Splash screens (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
            ├── drawable*/ic_notification_icon.png
            ├── mipmap*/ic_launcher.png   # App launcher icons across all densities
            ├── mipmap*/ic_maskable.png   # Adaptive maskable icons across all densities
            ├── mipmap-anydpi-v26/ic_launcher.xml
            ├── values/strings.xml        # Asset statement linking to https://myupuz.vercel.app
            ├── values/colors.xml         # Brand color definitions
            └── xml/
                ├── filepaths.xml         # FileProvider configuration for splash screens
                └── shortcuts.xml         # Dynamic app shortcuts (Metan, Propan, Elektr)
```

### Key Libraries:
- `com.google.androidbrowserhelper:androidbrowserhelper:2.7.4`
- `com.google.androidbrowserhelper:locationdelegation:1.1.2`

---

## 5. Build and Signing Instructions

### 5.1 Web App & PWA Production Build
Before building the native Android bundle or running the E2E verification suite, compile and lint the web distribution:

```powershell
cd c:\Users\user\Desktop\MyUp
npm run build
npm run lint
```

#### Pre-Release Web Artifact Checklist:
- [ ] `dist/index.html` generated with `<link rel="manifest" href="/manifest.json" />` and theme color `#0284c7`.
- [ ] `dist/manifest.json` present with package ID `uz.axmap.app` and shortcuts.
- [ ] `dist/sw.js` present with Cache-First asset caching and map tile bypass rules.
- [ ] `dist/.well-known/assetlinks.json` present and byte-for-byte identical to public assetlinks.
- [ ] `dist/icons/` contains all 5 PNG icons (192x192, 512x512, maskable icons, play-store icon).
- [ ] `dist/assets/` contains code-split chunks: `PrivacyPolicyPage-*.js`, `MapView-*.js`, and `NavigationMode-*.js`.

### 5.2 Build Prerequisites & Environment Variables:
- Java Development Kit 17 (Eclipse Temurin 17 x64)
- Android SDK Command-line tools (API 34/35 platform and build-tools)
- Node.js 18+ (for web bundling and Bubblewrap CLI)

```powershell
$env:JAVA_HOME = "C:\Users\user\.bubblewrap\jdk\jdk-17.0.11+9"
$env:ANDROID_HOME = "C:\Users\user\.bubblewrap\android_sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = "AxMap2026ReleasePass!"
$env:BUBBLEWRAP_KEY_PASSWORD = "AxMap2026ReleasePass!"
```

### 5.3 Option A: Gradle Wrapper Build (Direct)
```powershell
cd c:\Users\user\Desktop\MyUp\android-twa
.\gradlew.bat bundleRelease
```
The pre-configured `signingConfigs.release` in `app/build.gradle` signs the bundle with `axmap-release-key.jks`.

### 5.4 Option B: Bubblewrap CLI Build
```powershell
cd c:\Users\user\Desktop\MyUp\android-twa
npx @bubblewrap/cli build --manifest twa-manifest.json
```

### 5.5 Release Binary Location:
- Workspace root: `c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab`

---

## 6. Cryptographic 3-Way Verification Procedure

Run the following modernized JDK 17 commands to independently verify the signature, certificate, and integrity of the release bundle:

### 1. Verify JAR Signature:
```powershell
& "C:\Users\user\.bubblewrap\jdk\jdk-17.0.11+9\bin\jarsigner.exe" -verify -verbose -certs c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab
```
*Expected Result*: Output confirms signed by `CN=AX-Map, OU=Mobile, O=AX-Map, L=Tashkent, ST=Tashkent, C=UZ` and ends with `jar verified.`

### 2. Verify Certificate SHA-256 Fingerprint:
```powershell
& "C:\Users\user\.bubblewrap\jdk\jdk-17.0.11+9\bin\keytool.exe" -printcert -jarfile c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab
```
*Expected Result*: SHA-256 equals `55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A`.

### 3. Verify Internal Bundle Structure:
Verify that the `.aab` ZIP archive contains:
- `base/manifest/AndroidManifest.xml`
- `base/dex/classes.dex`
- `base/resources.pb`
- `META-INF/*.RSA` or `META-INF/*.SF`

---

## 7. Google Play Console Upload & Submission Checklist

### 7.1 Play App Signing & Digital Asset Links Dual-Fingerprint
Google Play mandates Google Play App Signing for all new applications uploaded via `.aab`.
1. Upload `uz.axmap.app-v1.0.0-release.aab` to Google Play Console.
2. In Google Play Console, navigate to **Release > Setup > App Integrity**.
3. Under **App signing key certificate**, locate the **SHA-256 certificate fingerprint**.
4. If Google generated a distinct app signing key from your upload key fingerprint (`55:BC:55:2E:...`), update `public/.well-known/assetlinks.json` to include **both** fingerprints:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "uz.axmap.app",
      "sha256_cert_fingerprints": [
        "55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A",
        "<GOOGLE_PLAY_DERIVED_SHA256_FINGERPRINT>"
      ]
    }
  }
]
```
5. Deploy to Vercel and verify online using Google's AssetLinks check API:
   `https://digitalassetlinks.googleapis.com/v1/statements:check?source.web.site=https://myupuz.vercel.app&relation=delegate_permission/common.handle_all_urls&target.android_app.package_name=uz.axmap.app`

### 7.2 Store Listing Assets
- **App Icon**: 512x512 PNG (located at `public/icons/play-store-512x512.png`).
- **Feature Graphic**: 1024x500 PNG/JPEG.
- **Phone Screenshots**: At least 2 screenshots (min 320px, max 3840px, 16:9 or 9:16).
- **Short Description (max 80 chars)**:
  `O'zbekiston bo'ylab metan, propan, benzin va elektr quvvatlash shahobchalari xaritasi.`
- **Full Description**:
  ```text
  AX-Map — O'zbekiston bo'ylab eng yaqin metan (CNG), propan (LPG), benzin zapravkalari hamda elektr quvvatlash stansiyalarini (EV) real vaqtda topish va yo'l yo'nalishini olish uchun qulay ilova.

  Asosiy imkoniyatlar:
  - Real vaqtdagi gaz bosimi (bar) va navbat holati haqida ma'lumotlar.
  - Yoqilg'i turlari bo'yicha qulay filtrlash: Metan, Propan, Benzin, Elektr.
  - Turn-by-turn navigatsiya va OSRM orqali qisqa yo'nalish hisoblash.
  - Oflayn ishlash imkoniyati (Service Worker orqali).
  - To'liq shaffoflik va xavfsizlik: orqa fonda joylashuv kuzatilmaydi (No background tracking).
  ```

### 7.3 Google Play Data Safety & App Content Form Responses
- **Privacy Policy URL**: `https://myupuz.vercel.app/privacy`
- **Location Data**:
  - *Data collected?* Yes, **Approximate location** and **Precise location**.
  - *Is it collected or shared?* **Collected only** (never shared with 3rd parties).
  - *Is data processed ephemerally?* **Yes** — location is processed in memory solely to display the nearest stations and compute routes, then discarded.
  - *Is data required or optional?* **Optional** (users can use the app without granting GPS by panning the map).
  - *Purpose:* **App functionality** (mapping and navigation).
  - *Background tracking:* **NO** (`ACCESS_BACKGROUND_LOCATION` is neither requested nor used).
- **User Account & Data Deletion**:
  - In-app profile deletion and email requests to `support@axmap.uz` or `@axmap_admin`.
- **Target Audience & Content**:
  - Target age group: 18 and older.
  - Ads: Declare appropriately according to ad banner configuration.
  - News App: No.
  - Financial Services: No.

---

## 8. Manual QA & Zero-Regression Test Protocol

Run these manual validation checks before submitting releases:

| # | Feature / Area | Verification Steps | Expected Result |
|---|----------------|--------------------|-----------------|
| 1 | **Map Rendering** | Open `https://myupuz.vercel.app`, pan, pinch-to-zoom, rotate. | Map tiles load smoothly without WebGL errors or black squares. |
| 2 | **Marker Clustering** | Zoom out to country level; zoom into Tashkent. | Station markers cluster or hide below LOD zoom; uncluster smoothly on zoom. |
| 3 | **Fuel Filters** | Click filter pills: "Metan", "Propan", "Benzin", "Elektr". | Map displays only stations offering the selected fuel type. |
| 4 | **Station Search** | Enter "Shaffof" or an address in the search bar. | Matching stations are filtered and listed immediately. |
| 5 | **Station Details** | Click any station marker on the map. | Bottom sheet modal opens with station name, fuel prices, pressure (bar), and action buttons. |
| 6 | **OSRM Navigation** | In station modal, tap "Yo'nalish olish" (Navigate). | Route polyline draws on map, step instructions display distance and ETA; "Yopish" exits navigation mode cleanly. |
| 7 | **Privacy Policy Route** | Navigate to `/privacy` directly or tap menu -> "Maxfiylik siyosati". | Responsive privacy policy renders with full location disclosures; "Asosiy xaritaga qaytish" returns to map session. |
| 8 | **PWA Offline Mode** | In DevTools Network tab, select "Offline", reload `/`. | App shell loads from Service Worker cache; external map tiles fail gracefully without crashing app. |

---

## 9. Automated Master E2E Verification Command

To run the complete automated test suite validating all 30 features across the web app, PWA, privacy policy, keystore, and Android `.aab` bundle:

```powershell
node scripts/verify-release-e2e.mjs
```

### Passing Criteria:
- Output displays `🌟 ALL ACCEPTANCE CRITERIA VERIFIED 100% CLEAN!`
- Total assertions evaluated: 140+
- Zero test failures (`Failed: 0`).
- Process terminates with exit code `0`.
