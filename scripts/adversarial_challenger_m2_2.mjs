/**
 * Milestone 2 Challenger 2 Empirical Test Suite
 * Adversarial Stress-Test of AssetLinks, TWA Manifest, Deep Links & Web Zero-Regression
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT_DIR = path.resolve('c:/Users/user/Desktop/MyUp');
const PUBLIC_ASSETLINKS = path.join(ROOT_DIR, 'public/.well-known/assetlinks.json');
const DIST_ASSETLINKS = path.join(ROOT_DIR, 'dist/.well-known/assetlinks.json');
const ANDROID_DIR = path.join(ROOT_DIR, 'android-twa');
const MANIFEST_PATH = path.join(ANDROID_DIR, 'app/src/main/AndroidManifest.xml');
const SHORTCUTS_PATH = path.join(ANDROID_DIR, 'app/src/main/res/xml/shortcuts.xml');
const STRINGS_PATH = path.join(ANDROID_DIR, 'app/src/main/res/values/strings.xml');
const GRADLE_APP_PATH = path.join(ANDROID_DIR, 'app/build.gradle');
const TWA_MANIFEST_PATH = path.join(ANDROID_DIR, 'twa-manifest.json');
const LAUNCHER_JAVA_PATH = path.join(ANDROID_DIR, 'app/src/main/java/uz/axmap/app/LauncherActivity.java');
const KEYSTORE_PATH = path.join(ROOT_DIR, 'axmap-release-key.jks');
const RELEASE_AAB_PATH = path.join(ROOT_DIR, 'uz.axmap.app-v1.0.0-release.aab');

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    results.push({ name: testName, status: 'PASS', details });
    console.log(`[PASS] ${testName}${details ? ` -> ${details}` : ''}`);
  } else {
    failedTests++;
    results.push({ name: testName, status: 'FAIL', details });
    console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

console.log('='.repeat(80));
console.log('AX-MAP MILESTONE 2 EMPIRICAL CHALLENGER SUITE 2');
console.log('='.repeat(80));

// =========================================================================
// SECTION 1: Digital Asset Links Live Compatibility & Schema
// =========================================================================
console.log('\n--- 1. Digital Asset Links Live Compatibility ---');

let assetLinksJson = null;
try {
  assert(fs.existsSync(PUBLIC_ASSETLINKS), 'public/.well-known/assetlinks.json exists');
  const rawContent = fs.readFileSync(PUBLIC_ASSETLINKS, 'utf-8');
  assert(rawContent.length > 0, 'assetlinks.json is non-empty', `${rawContent.length} bytes`);
  
  // Adversarial check: verify no illegal trailing commas before parsing
  assert(!/,\s*([}\]])/.test(rawContent), 'assetlinks.json contains no trailing commas (RFC 8259 strict compliance)');
  
  assetLinksJson = JSON.parse(rawContent);
  assert(Array.isArray(assetLinksJson), 'assetlinks.json root is JSON Array', `Type: ${typeof assetLinksJson}`);
  assert(assetLinksJson.length >= 1, 'assetlinks.json contains at least 1 statement', `Count: ${assetLinksJson.length}`);
} catch (err) {
  assert(false, 'assetlinks.json parsing error', err.message);
}

if (assetLinksJson && assetLinksJson.length > 0) {
  const statement = assetLinksJson[0];
  
  // Relation checks
  assert(Array.isArray(statement.relation), 'statement.relation is an array');
  assert(statement.relation.includes('delegate_permission/common.handle_all_urls'),
    'statement.relation includes delegate_permission/common.handle_all_urls',
    JSON.stringify(statement.relation));
  
  // Target checks
  assert(typeof statement.target === 'object' && statement.target !== null, 'statement.target is an object');
  assert(statement.target.namespace === 'android_app',
    'statement.target.namespace is "android_app"',
    `Got: ${statement.target?.namespace}`);
  assert(statement.target.package_name === 'uz.axmap.app',
    'statement.target.package_name is "uz.axmap.app"',
    `Got: ${statement.target?.package_name}`);
  
  // Fingerprints checks
  assert(Array.isArray(statement.target.sha256_cert_fingerprints),
    'statement.target.sha256_cert_fingerprints is an array');
  assert(statement.target.sha256_cert_fingerprints.length >= 1,
    'sha256_cert_fingerprints has at least 1 fingerprint',
    `Count: ${statement.target?.sha256_cert_fingerprints?.length}`);
  
  const fpRegex = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
  let allFpValid = true;
  for (const fp of statement.target.sha256_cert_fingerprints) {
    if (!fpRegex.test(fp)) {
      allFpValid = false;
      console.error(`Invalid fingerprint format: ${fp}`);
    }
  }
  assert(allFpValid, 'All sha256_cert_fingerprints strictly match uppercase colon-separated hex format (32 bytes)',
    statement.target.sha256_cert_fingerprints[0]);

  // Keystore fingerprint matching check
  try {
    assert(fs.existsSync(KEYSTORE_PATH), 'axmap-release-key.jks exists at workspace root');
    
    // Find keytool executable
    const keytoolCandidates = [
      'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe',
      'C:\\Program Files\\Java\\jre-1.8\\bin\\keytool.exe',
      'keytool'
    ];
    let keytoolExe = keytoolCandidates.find(p => fs.existsSync(p)) || 'keytool';
    
    const keytoolCmd = `"${keytoolExe}" -list -v -keystore "${KEYSTORE_PATH}" -alias axmap -storepass AxMap2026ReleasePass!`;
    const keytoolOut = execSync(keytoolCmd, { encoding: 'utf-8' });
    const match = keytoolOut.match(/SHA256:\s*([0-9A-F:]+)/i);
    assert(match !== null, 'Successfully extracted SHA-256 fingerprint from release keystore');
    
    if (match) {
      const keystoreSha256 = match[1].trim().toUpperCase();
      const assetlinksSha256 = statement.target.sha256_cert_fingerprints[0].toUpperCase();
      assert(keystoreSha256 === assetlinksSha256,
        'Keystore SHA-256 fingerprint matches assetlinks.json fingerprint exactly',
        `Keystore: ${keystoreSha256} vs AssetLinks: ${assetlinksSha256}`);
    }
  } catch (err) {
    assert(false, 'Keystore fingerprint verification execution failed', err.message);
  }
}

// Byte-for-byte check between public and dist
console.log('\n--- Checking dist/.well-known/assetlinks.json Byte-for-Byte Fidelity ---');
try {
  assert(fs.existsSync(DIST_ASSETLINKS), 'dist/.well-known/assetlinks.json exists after build');
  const pubBuf = fs.readFileSync(PUBLIC_ASSETLINKS);
  const distBuf = fs.readFileSync(DIST_ASSETLINKS);
  
  const pubHash = crypto.createHash('sha256').update(pubBuf).digest('hex');
  const distHash = crypto.createHash('sha256').update(distBuf).digest('hex');
  
  assert(Buffer.compare(pubBuf, distBuf) === 0,
    'dist/.well-known/assetlinks.json is byte-for-byte identical to public/.well-known/assetlinks.json',
    `Byte diff: ${Buffer.compare(pubBuf, distBuf)}`);
  assert(pubHash === distHash,
    'SHA-256 checksums of public and dist assetlinks.json match',
    `Pub Hash: ${pubHash} == Dist Hash: ${distHash}`);
  assert(pubBuf.length === distBuf.length,
    'File lengths are identical',
    `Length: ${pubBuf.length} bytes`);
} catch (err) {
  assert(false, 'Byte-for-byte assetlinks comparison failed', err.message);
}

// =========================================================================
// SECTION 2: TWA Deep Linking & Intent Filters
// =========================================================================
console.log('\n--- 2. TWA Deep Linking & Intent Filters ---');

try {
  assert(fs.existsSync(MANIFEST_PATH), 'android-twa/app/src/main/AndroidManifest.xml exists');
  const manifestXml = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  
  // Check LauncherActivity registration
  assert(manifestXml.includes('android:name=".LauncherActivity"'),
    'AndroidManifest.xml registers LauncherActivity (.LauncherActivity)');
  
  // Check autoVerify intent-filter
  const hasAutoVerifyFilter = /<intent-filter\s+android:autoVerify="true">[\s\S]*?<\/intent-filter>/.test(manifestXml);
  assert(hasAutoVerifyFilter, 'AndroidManifest.xml has an intent-filter with android:autoVerify="true"');
  
  // Extract autoVerify filter content
  const filterMatch = manifestXml.match(/<intent-filter\s+android:autoVerify="true">([\s\S]*?)<\/intent-filter>/);
  if (filterMatch) {
    const filterBody = filterMatch[1];
    
    assert(filterBody.includes('android:name="android.intent.action.VIEW"'),
      'Intent-filter contains action android.intent.action.VIEW');
    assert(filterBody.includes('android:name="android.intent.category.DEFAULT"'),
      'Intent-filter contains category android.intent.category.DEFAULT');
    assert(filterBody.includes('android:name="android.intent.category.BROWSABLE"'),
      'Intent-filter contains category android.intent.category.BROWSABLE');
    assert(/<data[\s\S]*?android:scheme="https"/.test(filterBody),
      'Intent-filter data tag contains android:scheme="https"');
    assert(/<data[\s\S]*?android:host="@string\/hostName"/.test(filterBody),
      'Intent-filter data tag contains android:host="@string/hostName"');
  }

  // Check build.gradle hostName mapping
  assert(fs.existsSync(GRADLE_APP_PATH), 'android-twa/app/build.gradle exists');
  const gradleContent = fs.readFileSync(GRADLE_APP_PATH, 'utf-8');
  assert(/hostName:\s*['"]myupuz\.vercel\.app['"]/.test(gradleContent),
    'build.gradle configures twaManifest.hostName as "myupuz.vercel.app"');
  assert(/resValue\s+['"]string['"],\s*['"]hostName['"],\s*twaManifest\.hostName/.test(gradleContent),
    'build.gradle declares resValue string "hostName" from twaManifest.hostName');

  // Check strings.xml resource integrity
  assert(fs.existsSync(STRINGS_PATH), 'android-twa/app/src/main/res/values/strings.xml exists');
  const stringsContent = fs.readFileSync(STRINGS_PATH, 'utf-8');
  
  // Verify assetStatements in strings.xml references myupuz.vercel.app
  assert(stringsContent.includes('https://myupuz.vercel.app'),
    'strings.xml assetStatements references https://myupuz.vercel.app');
  assert(stringsContent.includes('delegate_permission/common.handle_all_urls'),
    'strings.xml assetStatements includes delegate_permission/common.handle_all_urls');

  // Parse strings.xml resources
  const stringResources = new Map();
  const stringRegex = /<string\s+name="([^"]+)">([^<]*)<\/string>/g;
  let strMatch;
  while ((strMatch = stringRegex.exec(stringsContent)) !== null) {
    stringResources.set(strMatch[1], strMatch[2].trim());
  }
  assert(stringResources.size > 0, 'strings.xml contains parsed string resources', `Count: ${stringResources.size}`);

  // Check shortcuts.xml
  assert(fs.existsSync(SHORTCUTS_PATH), 'android-twa/app/src/main/res/xml/shortcuts.xml exists');
  const shortcutsXml = fs.readFileSync(SHORTCUTS_PATH, 'utf-8');
  
  // Parse individual shortcuts
  const shortcutRegex = /<shortcut\s+([\s\S]*?)<\/shortcut>/g;
  let scMatch;
  let shortcutCount = 0;
  let allShortcutsValid = true;

  while ((scMatch = shortcutRegex.exec(shortcutsXml)) !== null) {
    shortcutCount++;
    const scBody = scMatch[1];
    
    const idMatch = scBody.match(/android:shortcutId="([^"]+)"/);
    const shortLabelMatch = scBody.match(/android:shortcutShortLabel="@string\/([^"]+)"/);
    const longLabelMatch = scBody.match(/android:shortcutLongLabel="@string\/([^"]+)"/);
    const intentActionMatch = scBody.match(/android:action="([^"]+)"/);
    const targetPkgMatch = scBody.match(/android:targetPackage="([^"]+)"/);
    const targetClassMatch = scBody.match(/android:targetClass="([^"]+)"/);
    const dataMatch = scBody.match(/android:data="([^"]+)"/);

    const scId = idMatch ? idMatch[1] : `unknown_${shortcutCount}`;
    
    // Check labels in strings.xml
    const hasShortLabel = shortLabelMatch && stringResources.has(shortLabelMatch[1]);
    const hasLongLabel = longLabelMatch && stringResources.has(longLabelMatch[1]);
    const actionIsView = intentActionMatch && intentActionMatch[1] === 'android.intent.action.VIEW';
    const pkgIsAxmap = targetPkgMatch && targetPkgMatch[1] === 'uz.axmap.app';
    const classIsLauncher = targetClassMatch && targetClassMatch[1] === 'uz.axmap.app.LauncherActivity';
    
    // Check URL syntax
    let dataIsValidUrl = false;
    if (dataMatch) {
      try {
        const decodedUrl = dataMatch[1].replace(/&amp;/g, '&');
        const parsedUrl = new URL(decodedUrl);
        dataIsValidUrl = (parsedUrl.protocol === 'https:') && (parsedUrl.hostname === 'myupuz.vercel.app');
      } catch (e) {
        dataIsValidUrl = false;
      }
    }

    if (!hasShortLabel || !hasLongLabel || !actionIsView || !pkgIsAxmap || !classIsLauncher || !dataIsValidUrl) {
      allShortcutsValid = false;
      console.error(`Invalid shortcut detected: ${scId} (shortLabel=${hasShortLabel}, longLabel=${hasLongLabel}, action=${actionIsView}, pkg=${pkgIsAxmap}, class=${classIsLauncher}, url=${dataIsValidUrl})`);
    }
  }

  assert(shortcutCount >= 3, 'shortcuts.xml contains at least 3 shortcuts (metan, propan, electric)', `Found: ${shortcutCount}`);
  assert(allShortcutsValid,
    'All shortcuts reference valid @string/ resources, target uz.axmap.app.LauncherActivity, action VIEW, and valid URL');

  // Check LauncherActivity.java with flexible whitespace matching
  assert(fs.existsSync(LAUNCHER_JAVA_PATH), 'LauncherActivity.java exists');
  const launcherJava = fs.readFileSync(LAUNCHER_JAVA_PATH, 'utf-8');
  assert(launcherJava.includes('package uz.axmap.app;'), 'LauncherActivity.java in package uz.axmap.app');
  assert(/public\s+class\s+LauncherActivity\s+extends\s+com\.google\.androidbrowserhelper\.trusted\.LauncherActivity/.test(launcherJava),
    'LauncherActivity extends TWA LauncherActivity');

  // Check twa-manifest.json
  assert(fs.existsSync(TWA_MANIFEST_PATH), 'android-twa/twa-manifest.json exists');
  const twaManifest = JSON.parse(fs.readFileSync(TWA_MANIFEST_PATH, 'utf-8'));
  assert(twaManifest.packageId === 'uz.axmap.app', 'twa-manifest.json packageId is uz.axmap.app');
  assert(twaManifest.host === 'myupuz.vercel.app', 'twa-manifest.json host is myupuz.vercel.app');

  // Verify compiled AAB release artifact
  assert(fs.existsSync(RELEASE_AAB_PATH), 'Release AAB bundle exists (uz.axmap.app-v1.0.0-release.aab)');
  const aabStats = fs.statSync(RELEASE_AAB_PATH);
  assert(aabStats.size > 1000000, 'Release AAB file size is valid (> 1MB)', `${(aabStats.size / 1024 / 1024).toFixed(2)} MB`);

  // Verify AAB digital signature with jarsigner
  const jarsignerExe = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\jarsigner.exe';
  if (fs.existsSync(jarsignerExe)) {
    const jarCmd = `"${jarsignerExe}" -verify "${RELEASE_AAB_PATH}"`;
    const jarOut = execSync(jarCmd, { encoding: 'utf-8' });
    assert(jarOut.includes('jar verified'), 'jarsigner reports release AAB signature verified', jarOut.trim().split('\n')[0]);
  }
} catch (err) {
  assert(false, 'TWA Deep linking / Manifest verification failed', err.message);
}

// =========================================================================
// SECTION 3: Web Zero-Regression Sanity Check
// =========================================================================
console.log('\n--- 3. Web Zero-Regression Sanity Check ---');

// Test oxlint
try {
  console.log('Running npm run lint (oxlint)...');
  const lintOut = execSync('npm run lint', { cwd: ROOT_DIR, encoding: 'utf-8' });
  const errorMatch = lintOut.match(/Found \d+ warnings and (\d+) errors/);
  const errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
  assert(errors === 0, 'npm run lint passes with 0 errors', lintOut.trim().split('\n').slice(-2).join(' '));
} catch (err) {
  assert(false, 'npm run lint encountered an error', err.message);
}

// Test vite build
try {
  console.log('Running npm run build (vite build)...');
  const buildOut = execSync('npm run build', { cwd: ROOT_DIR, encoding: 'utf-8' });
  assert(buildOut.includes('built in') || fs.existsSync(path.join(ROOT_DIR, 'dist/index.html')),
    'npm run build successfully produced production build',
    'dist/index.html present');
} catch (err) {
  assert(false, 'npm run build encountered an error', err.message);
}

// Web assets verification
try {
  const distIndexHtml = path.join(ROOT_DIR, 'dist/index.html');
  const distSw = path.join(ROOT_DIR, 'dist/sw.js');
  const distManifest = path.join(ROOT_DIR, 'dist/manifest.json');
  const icon192 = path.join(ROOT_DIR, 'dist/icons/icon-192x192.png');
  const icon512 = path.join(ROOT_DIR, 'dist/icons/icon-512x512.png');
  const maskable192 = path.join(ROOT_DIR, 'dist/icons/icon-maskable-192x192.png');
  const maskable512 = path.join(ROOT_DIR, 'dist/icons/icon-maskable-512x512.png');
  const playStoreIcon = path.join(ROOT_DIR, 'dist/icons/play-store-512x512.png');

  assert(fs.existsSync(distIndexHtml), 'dist/index.html exists');
  assert(fs.existsSync(distSw), 'dist/sw.js exists');
  assert(fs.existsSync(distManifest), 'dist/manifest.json exists');
  assert(fs.existsSync(icon192), 'dist/icons/icon-192x192.png exists');
  assert(fs.existsSync(icon512), 'dist/icons/icon-512x512.png exists');
  assert(fs.existsSync(maskable192), 'dist/icons/icon-maskable-192x192.png exists');
  assert(fs.existsSync(maskable512), 'dist/icons/icon-maskable-512x512.png exists');
  assert(fs.existsSync(playStoreIcon), 'dist/icons/play-store-512x512.png exists');

  const indexContent = fs.readFileSync(distIndexHtml, 'utf-8');
  assert(indexContent.includes('rel="manifest"'), 'dist/index.html contains link rel="manifest"');
  assert(indexContent.includes('name="theme-color"'), 'dist/index.html contains meta name="theme-color"');
  assert(indexContent.includes('rel="apple-touch-icon"'), 'dist/index.html contains link rel="apple-touch-icon"');
  
  // Vercel server headers verification
  const vercelPath = path.join(ROOT_DIR, 'vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json exists');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  const assetlinksHeader = vercelConfig.headers?.find(h => h.source.includes('assetlinks.json'));
  assert(assetlinksHeader !== undefined, 'vercel.json defines dedicated headers for /.well-known/assetlinks.json');
  assert(assetlinksHeader?.headers?.some(h => h.key === 'Content-Type' && h.value === 'application/json'),
    'vercel.json sets Content-Type: application/json for assetlinks.json');
} catch (err) {
  assert(false, 'Web build artifacts verification failed', err.message);
}

// Summary
console.log('\n' + '='.repeat(80));
console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`FINAL VERDICT: ${failedTests === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
console.log('='.repeat(80));

process.exit(failedTests === 0 ? 0 : 1);
