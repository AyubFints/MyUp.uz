/**
 * scripts/adversarial_challenger_m2_bundle.mjs
 * 
 * Empirical Adversarial Challenger Test Harness for Milestone 2:
 * Cryptography, Release Keystore, Digital Asset Links, and AAB Bundle Integrity.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const EXPECTED_FINGERPRINT = '55:BC:55:2E:84:F5:16:5C:B7:B1:17:AD:1F:53:D0:0E:5D:94:87:AE:C3:A1:C2:81:B8:A0:94:67:CE:D3:2D:5A';
const EXPECTED_PACKAGE_ID = 'uz.axmap.app';
const EXPECTED_ALIAS = 'axmap';
const EXPECTED_KEY_PASS = 'AxMap2026ReleasePass!';

const WORKSPACE_ROOT = 'c:\\Users\\user\\Desktop\\MyUp';
const AAB_PATH = path.join(WORKSPACE_ROOT, 'uz.axmap.app-v1.0.0-release.aab');
const KEYSTORE_PATH = path.join(WORKSPACE_ROOT, 'axmap-release-key.jks');
const ASSETLINKS_PUBLIC_PATH = path.join(WORKSPACE_ROOT, 'public', '.well-known', 'assetlinks.json');
const ASSETLINKS_DIST_PATH = path.join(WORKSPACE_ROOT, 'dist', '.well-known', 'assetlinks.json');
const KEYTOOL_JDK17 = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe';
const JARSIGNER_JDK17 = 'C:\\Users\\user\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\jarsigner.exe';

const results = [];

function recordResult(testName, passed, details) {
  results.push({ testName, passed, details });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${mark} [${testName}]: ${details}`);
}

console.log('='.repeat(80));
console.log('EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 2');
console.log('Target AAB:', AAB_PATH);
console.log('Target Keystore:', KEYSTORE_PATH);
console.log('Expected SHA-256:', EXPECTED_FINGERPRINT);
console.log('='.repeat(80));

// -----------------------------------------------------------------------------
// TEST GROUP 1: Keystore Security & Google Play Validity
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 1: Keystore Security & Google Play Validity ---');

try {
  const ksOutput = execFileSync(KEYTOOL_JDK17, [
    '-list', '-v',
    '-keystore', KEYSTORE_PATH,
    '-alias', EXPECTED_ALIAS,
    '-storepass', EXPECTED_KEY_PASS
  ], { encoding: 'utf8' });

  // 1.1 RSA key length >= 2048
  const keyLengthMatch = ksOutput.match(/(\d+)-bit RSA key/);
  if (keyLengthMatch && parseInt(keyLengthMatch[1], 10) >= 2048) {
    recordResult('Keystore RSA Key Length', true, `Key length is ${keyLengthMatch[1]} bits (>= 2048)`);
  } else {
    recordResult('Keystore RSA Key Length', false, `Invalid key length: ${keyLengthMatch ? keyLengthMatch[1] : 'not found'}`);
  }

  // 1.2 Signature algorithm is SHA256withRSA
  const sigAlgMatch = ksOutput.match(/Signature algorithm name:\s*([^\r\n]+)/);
  if (sigAlgMatch && sigAlgMatch[1].trim() === 'SHA256withRSA') {
    recordResult('Keystore Signature Algorithm', true, `Signature algorithm: ${sigAlgMatch[1].trim()}`);
  } else {
    recordResult('Keystore Signature Algorithm', false, `Invalid signature algorithm: ${sigAlgMatch ? sigAlgMatch[1] : 'not found'}`);
  }

  // 1.3 Validity >= 25 years (expires after 2043; specifically 10,000 days / 2054)
  const validUntilMatch = ksOutput.match(/until:\s*([^\r\n]+)/);
  if (validUntilMatch) {
    const validUntilStr = validUntilMatch[1].trim();
    // Look for year 2054 or parse date
    const yearMatch = validUntilStr.match(/20\d\d/);
    const expireYear = yearMatch ? parseInt(yearMatch[0], 10) : 0;
    if (expireYear >= 2043) {
      recordResult('Keystore Validity Period', true, `Expiration date string '${validUntilStr}', year ${expireYear} >= 2043`);
    } else {
      recordResult('Keystore Validity Period', false, `Expiration year ${expireYear} < 2043`);
    }
  } else {
    recordResult('Keystore Validity Period', false, 'Could not find validity expiration line');
  }

  // 1.4 Fingerprint extraction from Keystore
  const sha256KsMatch = ksOutput.match(/SHA256:\s*([0-9A-Fa-f:]+)/);
  const ksFingerprint = sha256KsMatch ? sha256KsMatch[1].trim() : null;
  if (ksFingerprint === EXPECTED_FINGERPRINT) {
    recordResult('Keystore SHA-256 Fingerprint Extraction', true, `Extracted ${ksFingerprint}`);
  } else {
    recordResult('Keystore SHA-256 Fingerprint Extraction', false, `Extracted ${ksFingerprint} !== expected ${EXPECTED_FINGERPRINT}`);
  }

} catch (err) {
  recordResult('Keystore Inspection', false, `Failed to inspect keystore: ${err.message}`);
}

// -----------------------------------------------------------------------------
// TEST GROUP 2: AAB Certificate Fingerprint Extraction & Verification
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 2: AAB Bundle Certificate Fingerprint Extraction ---');

let aabFingerprint = null;
try {
  const aabCertOutput = execFileSync(KEYTOOL_JDK17, [
    '-printcert',
    '-jarfile', AAB_PATH
  ], { encoding: 'utf8' });

  const sha256AabMatch = aabCertOutput.match(/SHA256:\s*([0-9A-Fa-f:]+)/);
  aabFingerprint = sha256AabMatch ? sha256AabMatch[1].trim() : null;

  if (aabFingerprint === EXPECTED_FINGERPRINT) {
    recordResult('AAB Certificate SHA-256 Extraction', true, `Extracted ${aabFingerprint}`);
  } else {
    recordResult('AAB Certificate SHA-256 Extraction', false, `Extracted ${aabFingerprint} !== expected ${EXPECTED_FINGERPRINT}`);
  }

  // Also check AAB certificate properties
  const aabKeyMatch = aabCertOutput.match(/(\d+)-bit RSA key/);
  const aabSigAlgMatch = aabCertOutput.match(/Signature algorithm name:\s*([^\r\n]+)/);
  const aabOwnerMatch = aabCertOutput.match(/Owner:\s*([^\r\n]+)/);

  if (aabKeyMatch && parseInt(aabKeyMatch[1], 10) >= 2048) {
    recordResult('AAB Certificate Key Size', true, `${aabKeyMatch[1]}-bit RSA key`);
  } else {
    recordResult('AAB Certificate Key Size', false, `Invalid key size: ${aabKeyMatch ? aabKeyMatch[1] : 'unknown'}`);
  }

  if (aabSigAlgMatch && aabSigAlgMatch[1].trim() === 'SHA256withRSA') {
    recordResult('AAB Certificate Sig Algorithm', true, `${aabSigAlgMatch[1].trim()}`);
  } else {
    recordResult('AAB Certificate Sig Algorithm', false, `Invalid sig algorithm: ${aabSigAlgMatch ? aabSigAlgMatch[1] : 'unknown'}`);
  }

  if (aabOwnerMatch && aabOwnerMatch[1].includes('CN=AX-Map')) {
    recordResult('AAB Certificate Owner DN', true, `${aabOwnerMatch[1].trim()}`);
  } else {
    recordResult('AAB Certificate Owner DN', false, `Unexpected Owner DN: ${aabOwnerMatch ? aabOwnerMatch[1] : 'unknown'}`);
  }

} catch (err) {
  recordResult('AAB Certificate Inspection', false, `Failed to inspect AAB cert: ${err.message}`);
}

// -----------------------------------------------------------------------------
// TEST GROUP 3: Digital Asset Links (assetlinks.json) Verification
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 3: Digital Asset Links Verification ---');

let assetlinksFingerprint = null;
try {
  const assetlinksRaw = fs.readFileSync(ASSETLINKS_PUBLIC_PATH, 'utf8');
  const assetlinks = JSON.parse(assetlinksRaw);

  if (Array.isArray(assetlinks) && assetlinks.length > 0) {
    const entry = assetlinks[0];
    const relationValid = entry.relation && entry.relation.includes('delegate_permission/common.handle_all_urls');
    const target = entry.target || {};
    const namespaceValid = target.namespace === 'android_app';
    const packageValid = target.package_name === EXPECTED_PACKAGE_ID;
    const fingerprints = target.sha256_cert_fingerprints || [];
    assetlinksFingerprint = fingerprints[0] || null;

    recordResult('AssetLinks Structure & Namespace', relationValid && namespaceValid, `Namespace: ${target.namespace}, relation: ${JSON.stringify(entry.relation)}`);
    recordResult('AssetLinks Target Package Name', packageValid, `Target package: ${target.package_name}`);
    
    if (assetlinksFingerprint === EXPECTED_FINGERPRINT) {
      recordResult('AssetLinks SHA-256 Fingerprint', true, `Found: ${assetlinksFingerprint}`);
    } else {
      recordResult('AssetLinks SHA-256 Fingerprint', false, `Found: ${assetlinksFingerprint} !== expected ${EXPECTED_FINGERPRINT}`);
    }
  } else {
    recordResult('AssetLinks Format', false, 'assetlinks.json is not a valid non-empty array');
  }

  // Also check dist copy
  if (fs.existsSync(ASSETLINKS_DIST_PATH)) {
    const distRaw = fs.readFileSync(ASSETLINKS_DIST_PATH, 'utf8');
    if (distRaw.trim() === assetlinksRaw.trim()) {
      recordResult('AssetLinks Dist Copy Parity', true, 'public and dist assetlinks.json are byte-for-byte identical');
    } else {
      recordResult('AssetLinks Dist Copy Parity', false, 'dist/.well-known/assetlinks.json differs from public/.well-known/assetlinks.json');
    }
  } else {
    recordResult('AssetLinks Dist Copy Parity', false, 'dist/.well-known/assetlinks.json does not exist');
  }

} catch (err) {
  recordResult('AssetLinks Verification', false, `Error checking assetlinks.json: ${err.message}`);
}

// -----------------------------------------------------------------------------
// TEST GROUP 4: 3-Way Cryptographic Equality Assertion
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 4: 3-Way Cryptographic Equality Assertion ---');

const fp1 = aabFingerprint;
const fp2 = EXPECTED_FINGERPRINT;
const fp3 = assetlinksFingerprint;

const allExtracted = fp1 && fp2 && fp3;
const allMatchExpected = (fp1 === EXPECTED_FINGERPRINT) && (fp3 === EXPECTED_FINGERPRINT);
const allIdentical = (fp1 === fp3);
const lengthValid = (fp1 && fp1.length === 95);
const formatValid = (fp1 && /^[0-9A-F]{2}(:[0-9A-F]{2}){31}$/.test(fp1));

if (allExtracted && allMatchExpected && allIdentical && lengthValid && formatValid) {
  recordResult('3-Way Cryptographic Equality', true, 
    `All 3 fingerprints match byte-for-byte, length 95 chars, uppercase colon format: \n    AAB:        ${fp1}\n    Keystore:   ${fp2}\n    AssetLinks: ${fp3}`
  );
} else {
  recordResult('3-Way Cryptographic Equality', false, 
    `Mismatch or invalid format:\n    AAB:        ${fp1}\n    Keystore:   ${fp2}\n    AssetLinks: ${fp3}\n    Length 95: ${lengthValid}, Format valid: ${formatValid}`
  );
}

// -----------------------------------------------------------------------------
// TEST GROUP 5: Bundle Structure & ZIP Entries Authenticity
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 5: Bundle Structure & Compilation Authenticity ---');

try {
  // Use PowerShell to enumerate all Zip entries with exact paths and uncompressed sizes
  const psScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead('${AAB_PATH.replace(/\\/g, '\\\\')}')
    $entries = $zip.Entries | ForEach-Object {
      [PSCustomObject]@{
        FullName = $_.FullName
        Length = $_.Length
        CompressedLength = $_.CompressedLength
      }
    }
    $zip.Dispose()
    $entries | ConvertTo-Json -Depth 2
  `;

  const zipJsonRaw = execFileSync('powershell', ['-NoProfile', '-Command', psScript], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  const zipEntries = JSON.parse(zipJsonRaw);
  const entryMap = new Map();
  let hasTraversal = false;
  let bundleMetadataCount = 0;

  for (const entry of zipEntries) {
    entryMap.set(entry.FullName, entry);
    if (entry.FullName.includes('..') || entry.FullName.startsWith('/') || entry.FullName.startsWith('\\')) {
      hasTraversal = true;
    }
    if (entry.FullName.startsWith('BUNDLE-METADATA/')) {
      bundleMetadataCount++;
    }
  }

  recordResult('AAB Zip Traversal Safety', !hasTraversal, 'No directory traversal or invalid path roots found');
  recordResult('AAB Total Zip Entries Count', zipEntries.length > 50, `Found ${zipEntries.length} total zip entries`);

  // Assert base/manifest/AndroidManifest.xml
  const manifestEntry = entryMap.get('base/manifest/AndroidManifest.xml');
  if (manifestEntry && manifestEntry.Length > 0) {
    recordResult('AAB Entry base/manifest/AndroidManifest.xml', true, `Present, uncompressed size: ${manifestEntry.Length} bytes`);
  } else {
    recordResult('AAB Entry base/manifest/AndroidManifest.xml', false, 'Missing or empty');
  }

  // Assert base/dex/classes.dex
  const dexEntry = entryMap.get('base/dex/classes.dex');
  if (dexEntry && dexEntry.Length > 0) {
    recordResult('AAB Entry base/dex/classes.dex', true, `Present, uncompressed size: ${dexEntry.Length} bytes (${(dexEntry.Length / (1024*1024)).toFixed(2)} MB)`);
  } else {
    recordResult('AAB Entry base/dex/classes.dex', false, 'Missing or empty');
  }

  // Assert base/resources.pb
  const resEntry = entryMap.get('base/resources.pb');
  if (resEntry && resEntry.Length > 0) {
    recordResult('AAB Entry base/resources.pb', true, `Present, uncompressed size: ${resEntry.Length} bytes`);
  } else {
    recordResult('AAB Entry base/resources.pb', false, 'Missing or empty');
  }

  // Assert BUNDLE-METADATA/
  if (bundleMetadataCount > 0) {
    recordResult('AAB Entry BUNDLE-METADATA/', true, `Present, ${bundleMetadataCount} metadata entries found`);
  } else {
    recordResult('AAB Entry BUNDLE-METADATA/', false, 'Missing BUNDLE-METADATA entries');
  }

  // Assert BundleConfig.pb
  const configEntry = entryMap.get('BundleConfig.pb');
  if (configEntry && configEntry.Length > 0) {
    recordResult('AAB Entry BundleConfig.pb', true, `Present, uncompressed size: ${configEntry.Length} bytes`);
  } else {
    recordResult('AAB Entry BundleConfig.pb', false, 'Missing or empty');
  }

} catch (err) {
  recordResult('AAB Structure Verification', false, `Failed to inspect AAB zip: ${err.message}`);
}

// -----------------------------------------------------------------------------
// TEST GROUP 6: jarsigner Verification & Signature Chain Attestation
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 6: jarsigner Verification & Signature Attestation ---');

try {
  const jarsignerOutput = execFileSync(JARSIGNER_JDK17, [
    '-verify',
    '-verbose',
    '-certs',
    AAB_PATH
  ], { encoding: 'utf8' });

  const hasJarVerified = jarsignerOutput.includes('jar verified.');
  const hasSHA256withRSA = jarsignerOutput.includes('Signature algorithm: SHA256withRSA, 2048-bit key');
  const hasDigestSHA256 = jarsignerOutput.includes('Digest algorithm: SHA-256');
  const hasOwner = jarsignerOutput.includes('CN=AX-Map, OU=Mobile, O=AX-Map, L=Tashkent, ST=Tashkent, C=UZ');
  const hasExpire2054 = jarsignerOutput.includes('2054-03-28');

  recordResult('jarsigner Exit Code & Status', hasJarVerified, 'jarsigner reported "jar verified." with exit code 0');
  recordResult('jarsigner Signature & Key Details', hasSHA256withRSA && hasDigestSHA256, 'Digest algorithm: SHA-256, Signature algorithm: SHA256withRSA, 2048-bit key');
  recordResult('jarsigner Signer Identity', hasOwner, 'Signed by "CN=AX-Map, OU=Mobile, O=AX-Map, L=Tashkent, ST=Tashkent, C=UZ"');
  recordResult('jarsigner Validity Expiration', hasExpire2054, 'Certificate validity extends to 2054-03-28');

} catch (err) {
  recordResult('jarsigner Verification', false, `jarsigner command failed: ${err.message}`);
}

// -----------------------------------------------------------------------------
// TEST GROUP 7: Adversarial Negative Tests (Authentication & Tamper Resistance)
// -----------------------------------------------------------------------------
console.log('\n--- GROUP 7: Adversarial Negative Tests ---');

// 7.1 Keystore wrong password attack
try {
  execFileSync(KEYTOOL_JDK17, [
    '-list',
    '-keystore', KEYSTORE_PATH,
    '-alias', EXPECTED_ALIAS,
    '-storepass', 'HostileWrongPassword999!'
  ], { stdio: 'pipe' });
  recordResult('Adversarial Keystore Wrong Password', false, 'Keystore allowed access with wrong password!');
} catch (err) {
  recordResult('Adversarial Keystore Wrong Password', true, 'Keystore correctly rejected unauthorized password attempt');
}

// 7.2 Keystore non-existent alias attack
try {
  execFileSync(KEYTOOL_JDK17, [
    '-list',
    '-keystore', KEYSTORE_PATH,
    '-alias', 'malicious_impersonator_alias',
    '-storepass', EXPECTED_KEY_PASS
  ], { stdio: 'pipe' });
  recordResult('Adversarial Keystore Fake Alias', false, 'Keystore returned success for fake alias!');
} catch (err) {
  recordResult('Adversarial Keystore Fake Alias', true, 'Keystore correctly rejected non-existent alias query');
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n' + '='.repeat(80));
console.log('ADVERSARIAL CHALLENGER SUITE SUMMARY:');
console.log('='.repeat(80));

const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = results.filter(r => !r.passed).length;

console.log(`Total Assertions Evaluated: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

const verdict = (failedTests === 0 && totalTests >= 15) ? 'APPROVE' : 'REQUEST_CHANGES';
console.log(`\nFINAL CHALLENGER VERDICT: ${verdict}`);

process.exit(failedTests === 0 ? 0 : 1);
