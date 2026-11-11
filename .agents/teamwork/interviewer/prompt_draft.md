Prepare the AX-Map web application (`c:\Users\user\Desktop\MyUp`, production URL `https://myupuz.vercel.app`) for production release on Google Play Store as an Android App Bundle (.aab) with Package ID `uz.axmap.app` using Trusted Web Activity (TWA) / Progressive Web App (PWA) standards, while maintaining full web browser functionality without regressions.

Working directory: c:\Users\user\Desktop\MyUp
Integrity mode: development

## Requirements

### R1. Progressive Web App (PWA) Assets and Compliance
Configure full PWA capabilities for the web application at `c:\Users\user\Desktop\MyUp`:
- Create and link a standard `manifest.json` configured for `uz.axmap.app` (specifying name, short name, start URL, standalone display mode, theme and background colors).
- Generate and place compliant application icons in all standard sizes (including maskable icons and 512x512 store icon).
- Configure a service worker that caches core static assets for performance without interfering with live API requests or interactive map tile loading.

### R2. Privacy Policy Page
Implement a dedicated, responsive privacy policy page within the React application accessible at route `/privacy`, detailing required Google Play disclosures (including geolocation / location data handling, service station search, and user data safety) with navigation back to the main map.

### R3. Trusted Web Activity (TWA) and Android App Bundle (.aab) Generation
Set up a TWA Android project targeting `https://myupuz.vercel.app` with Package ID `uz.axmap.app`:
- Generate a new production release keystore (e.g. `axmap-release-key.jks`) and document all required credentials (keystore path, password, key alias, and key password).
- Build the signed release Android App Bundle (.aab) ready for direct upload to Google Play Console.
- Generate the Digital Asset Links file (`.well-known/assetlinks.json`) containing the release signing certificate's SHA-256 fingerprint, and place it in the public web assets directory for deployment.

### R4. Web Compatibility and Zero-Regression Guarantee
Ensure all existing web features (map rendering, station filtering, search, routing, details view) remain 100% operational in desktop and mobile web browsers with zero runtime regressions or broken layouts.

## Acceptance Criteria

### PWA Standards and Build
- [ ] `npm run build` completes successfully with zero compile or bundling errors.
- [ ] `manifest.json` is present in `public/` and referenced in `index.html`, validating all required PWA manifest fields.
- [ ] App icons in required dimensions (e.g., 192x192, 512x512, maskable) are present and correctly referenced.
- [ ] Service worker registers cleanly in browser environments without throwing uncaught runtime errors or breaking external tile requests.

### Privacy Policy Page
- [ ] Navigating to `/privacy` loads the React privacy policy view with clear statements regarding location permissions and data handling.
- [ ] The `/privacy` view includes working navigation back to the primary map interface.

### TWA and Android Release Artifacts
- [ ] A signed release Android App Bundle file (`.aab`) exists in the output directory and verifies with `jarsigner` / `bundletool` or Android build tooling.
- [ ] Release keystore file exists with clear documentation of alias and passwords.
- [ ] `assetlinks.json` is generated at `public/.well-known/assetlinks.json` containing the exact SHA-256 fingerprint matching the release keystore.

### Functional Integrity
- [ ] Existing map interactions, search functionality, station markers, and routing functions operate identically to their pre-task baseline.
- [ ] Verification steps and build commands are fully documented in a concise release readme or guide.
