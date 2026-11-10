# AX-Map (uz.axmap.app) — Production Release Guide

This document provides complete documentation of keystore credentials, cryptographic certificates, Digital Asset Links, Android Trusted Web Activity (TWA) project architecture, build instructions, and verification procedures for publishing AX-Map to the Google Play Store.

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

### Build Prerequisites:
- Java Development Kit 17 (Eclipse Temurin 17 x64)
- Android SDK Command-line tools (API 34/35 platform and build-tools)
- Node.js 18+ (for web bundling and Bubblewrap CLI)

### Environment Variables:
```powershell
$env:JAVA_HOME = "C:\Users\user\.bubblewrap\jdk\jdk-17.0.11+9"
$env:ANDROID_HOME = "C:\Users\user\.bubblewrap\android_sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = "AxMap2026ReleasePass!"
$env:BUBBLEWRAP_KEY_PASSWORD = "AxMap2026ReleasePass!"
```

### Option A: Gradle Wrapper Build (Direct)
```powershell
cd c:\Users\user\Desktop\MyUp\android-twa
.\gradlew.bat bundleRelease
```
The pre-configured `signingConfigs.release` in `app/build.gradle` signs the bundle with `axmap-release-key.jks`.

### Option B: Bubblewrap CLI Build
```powershell
cd c:\Users\user\Desktop\MyUp\android-twa
npx @bubblewrap/cli build --manifest twa-manifest.json
```

### Release Binary Location:
- Workspace root: `c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab`

---

## 6. Cryptographic 3-Way Verification Procedure

Run the following commands to independently verify the signature and integrity of the release bundle:

### 1. Verify JAR Signature:
```powershell
jarsigner -verify -verbose -certs c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab
```
*Expected Result*: Output ends with `jar verified.`

### 2. Verify Certificate SHA-256 Fingerprint:
```powershell
& "C:\Program Files\Java\jre-1.8\bin\keytool.exe" -printcert -jarfile c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab
```
*Expected Result*: SHA-256 equals `55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A`

### 3. Verify Internal Bundle Structure:
Verify that the `.aab` ZIP archive contains:
- `base/manifest/AndroidManifest.xml`
- `base/dex/classes.dex`
- `base/resources.pb`
- `META-INF/*.RSA` or `META-INF/*.SF`

---

## 7. Google Play Console Upload Checklist

1. [ ] Log in to **Google Play Console** at `https://play.google.com/console`.
2. [ ] Select or create application with Package ID `uz.axmap.app`.
3. [ ] Under **App Integrity**, review Play App Signing.
   *(Note: If Play App Signing manages your signing key, also add Google's derived SHA-256 fingerprint to `assetlinks.json`)*.
4. [ ] Navigate to **Production** (or **Internal Testing**) -> **Create new release**.
5. [ ] Upload `uz.axmap.app-v1.0.0-release.aab`.
6. [ ] Enter Release Notes:
   ```text
   AX-Map v1.0.0:
   - Initial release of AX-Map for Android.
   - Real-time search and filtering for Metan (CNG), Propan (LPG), Benzin, and Electric charging stations across Uzbekistan.
   - Turn-by-turn navigation and road directions.
   - Comprehensive privacy policy and zero background location tracking.
   ```
7. [ ] Confirm App Content requirements:
   - **Privacy Policy URL**: `https://myupuz.vercel.app/privacy`
   - **Location Disclosures**: Foreground location only (for nearby station discovery and route calculation). No background location tracking.
8. [ ] Save and roll out release.
