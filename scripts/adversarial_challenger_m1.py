"""
Adversarial Stress Test Suite for Milestone 1: PWA Manifest, Icons, and HTML Configuration
Agent: teamwork_challenger_m1_1
"""

import os
import sys
import json
import struct
import zlib
import hashlib
import re
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
DIST_DIR = ROOT / "dist"
PUBLIC_ICONS = PUBLIC_DIR / "icons"
DIST_ICONS = DIST_DIR / "icons"

results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "failures": [],
    "warnings": []
}

def assert_true(condition, description, detail=""):
    results["total"] += 1
    if condition:
        results["passed"] += 1
        print(f"  [PASS] {description}")
    else:
        results["failed"] += 1
        msg = f"  [FAIL] {description}" + (f" -> {detail}" if detail else "")
        print(msg)
        results["failures"].append(msg)

def warn(msg):
    print(f"  [WARN] {msg}")
    results["warnings"].append(msg)

print("=" * 70)
print("ADVERSARIAL STRESS TEST SUITE: MILESTONE 1 (PWA & ICONS)")
print("=" * 70)

# ==============================================================================
# SUITE 1: Icon File Existence and Integrity
# ==============================================================================
print("\n[SUITE 1] File Existence & Asset Parity (public/ vs dist/)")

expected_icons = [
    "icon-192x192.png",
    "icon-512x512.png",
    "icon-maskable-192x192.png",
    "icon-maskable-512x512.png",
    "play-store-512x512.png"
]

for icon_name in expected_icons:
    pub_path = PUBLIC_ICONS / icon_name
    dist_path = DIST_ICONS / icon_name
    
    assert_true(pub_path.exists(), f"public/icons/{icon_name} exists", f"Path not found: {pub_path}")
    assert_true(dist_path.exists(), f"dist/icons/{icon_name} exists", f"Path not found: {dist_path}")
    
    if pub_path.exists() and dist_path.exists():
        pub_bytes = pub_path.read_bytes()
        dist_bytes = dist_path.read_bytes()
        assert_true(len(pub_bytes) > 0, f"public/icons/{icon_name} is non-empty ({len(pub_bytes)} bytes)")
        assert_true(len(dist_bytes) > 0, f"dist/icons/{icon_name} is non-empty ({len(dist_bytes)} bytes)")
        pub_sha = hashlib.sha256(pub_bytes).hexdigest()
        dist_sha = hashlib.sha256(dist_bytes).hexdigest()
        assert_true(pub_sha == dist_sha, f"public and dist {icon_name} SHA-256 match ({pub_sha[:12]}...)")

# ==============================================================================
# SUITE 2: Raw Binary PNG Header Parsing (RFC 2083 / ISO/IEC 15948)
# ==============================================================================
print("\n[SUITE 2] Binary PNG Header Parsing (IHDR chunks & dimensions)")

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

def parse_png_raw(file_path):
    data = file_path.read_bytes()
    assert len(data) >= 33, f"File too small to be PNG: {len(data)} bytes"
    sig = data[:8]
    assert sig == PNG_SIGNATURE, f"Invalid PNG signature: {sig.hex()}"
    
    # Read first chunk: should be IHDR
    chunk_len = struct.unpack(">I", data[8:12])[0]
    chunk_type = data[12:16]
    assert chunk_type == b"IHDR", f"First chunk is not IHDR: {chunk_type}"
    assert chunk_len == 13, f"IHDR length is not 13: {chunk_len}"
    
    chunk_data = data[16:16+13]
    crc_expected = struct.unpack(">I", data[29:33])[0]
    crc_computed = zlib.crc32(data[12:29]) & 0xffffffff
    assert crc_expected == crc_computed, f"IHDR CRC mismatch: {crc_expected:#x} vs {crc_computed:#x}"
    
    width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(">IIBBBBB", chunk_data)
    
    # Verify file ends with IEND chunk
    iend_pos = data.rfind(b"IEND")
    assert iend_pos != -1, "Missing IEND chunk"
    
    return {
        "width": width,
        "height": height,
        "bit_depth": bit_depth,
        "color_type": color_type,
        "compression": compression,
        "filter_method": filter_method,
        "interlace": interlace,
        "size_bytes": len(data)
    }

expected_specs = {
    "icon-192x192.png": {"w": 192, "h": 192, "color_type": 6},           # RGBA
    "icon-512x512.png": {"w": 512, "h": 512, "color_type": 6},           # RGBA
    "icon-maskable-192x192.png": {"w": 192, "h": 192, "color_type": 6},  # RGBA
    "icon-maskable-512x512.png": {"w": 512, "h": 512, "color_type": 6},  # RGBA
    "play-store-512x512.png": {"w": 512, "h": 512, "color_type": (2, 6)}  # RGB or RGBA
}

for icon_name, spec in expected_specs.items():
    for base_dir, label in [(PUBLIC_ICONS, "public"), (DIST_ICONS, "dist")]:
        fpath = base_dir / icon_name
        try:
            info = parse_png_raw(fpath)
            assert_true(
                info["width"] == spec["w"] and info["height"] == spec["h"],
                f"Binary IHDR {label}/{icon_name} dimension is {info['width']}x{info['height']} (expected {spec['w']}x{spec['h']})"
            )
            assert_true(
                info["bit_depth"] == 8,
                f"Binary IHDR {label}/{icon_name} bit depth is 8"
            )
            if isinstance(spec["color_type"], tuple):
                ct_ok = info["color_type"] in spec["color_type"]
            else:
                ct_ok = info["color_type"] == spec["color_type"]
            assert_true(
                ct_ok,
                f"Binary IHDR {label}/{icon_name} color type {info['color_type']} valid"
            )
        except Exception as e:
            assert_true(False, f"Binary parse failed for {label}/{icon_name}", str(e))

# ==============================================================================
# SUITE 3: Maskable Safe Zone & Google Play Store Icon Stress Testing
# ==============================================================================
print("\n[SUITE 3] Pixel-Level Maskable Safe Zone Analysis & Transparency Checks")

BACKGROUND_HEX = "#090d16"
BG_COLOR_RGB = np.array([9, 13, 22], dtype=int)

def evaluate_maskable_safe_zone(icon_path, expected_dim):
    """
    Evaluates compliance with W3C Maskable Icon specification:
    Safe zone is a circle with diameter = 80% of canvas centered in canvas.
    Safe radius = 0.40 * dimension.
    Outside pixels (distance > safe_radius) MUST be background color (#090d16) and 100% opaque.
    """
    img = Image.open(icon_path).convert("RGBA")
    arr = np.array(img)
    h, w, c = arr.shape
    assert (w, h) == (expected_dim, expected_dim), f"Dimension mismatch: {(w, h)} != {(expected_dim, expected_dim)}"
    
    # Calculate pixel distance from center
    cx, cy = (w - 1) / 2.0, (h - 1) / 2.0
    y_coords, x_coords = np.ogrid[:h, :w]
    radii = np.sqrt((x_coords - cx) ** 2 + (y_coords - cy) ** 2)
    
    safe_radius = 0.40 * w  # 80% diameter = 40% radius
    outside_mask = radii > safe_radius
    outside_count = outside_mask.sum()
    
    # Outside pixels alpha: MUST be 100% opaque (alpha=255)
    outside_min_alpha = arr[outside_mask, 3].min() if outside_count > 0 else 255
    outside_non_opaque = (outside_mask & (arr[:, :, 3] < 255)).sum()
    
    # Compute color distance from background [9, 13, 22]
    rgb_diff = np.abs(arr[:, :, :3].astype(int) - BG_COLOR_RGB).sum(axis=-1)
    
    # Outside pixels that deviate from background by > 15
    THRESHOLD = 15
    bleeding_pixels = (outside_mask & (rgb_diff > THRESHOLD)).sum()
    
    # Find maximum radius of artwork pixels (diff > THRESHOLD)
    artwork_mask = rgb_diff > THRESHOLD
    if artwork_mask.any():
        max_artwork_radius = radii[artwork_mask].max()
    else:
        max_artwork_radius = 0.0
    
    # Outside corners background uniformity
    outside_diffs = rgb_diff[outside_mask]
    max_outside_diff = outside_diffs.max() if outside_count > 0 else 0
    
    # Interior alpha info
    min_interior_alpha = arr[~outside_mask, 3].min()
    
    return {
        "outside_count": int(outside_count),
        "outside_min_alpha": int(outside_min_alpha),
        "outside_non_opaque": int(outside_non_opaque),
        "bleeding_pixels": int(bleeding_pixels),
        "safe_radius": safe_radius,
        "max_artwork_radius": float(max_artwork_radius),
        "margin_px": float(safe_radius - max_artwork_radius),
        "max_outside_diff": int(max_outside_diff),
        "min_interior_alpha": int(min_interior_alpha)
    }

for icon_name, dim in [("icon-maskable-192x192.png", 192), ("icon-maskable-512x512.png", 512)]:
    res = evaluate_maskable_safe_zone(PUBLIC_ICONS / icon_name, dim)
    assert_true(
        res["outside_min_alpha"] == 255 and res["outside_non_opaque"] == 0,
        f"{icon_name} outside 80% circle is 100% opaque (outside_min_alpha={res['outside_min_alpha']}, non_opaque_outside=0)"
    )
    assert_true(
        res["bleeding_pixels"] == 0,
        f"{icon_name} has exactly 0 bleeding pixels outside safe zone (safe radius={res['safe_radius']:.1f}px, max artwork radius={res['max_artwork_radius']:.2f}px, margin={res['margin_px']:.2f}px)"
    )
    assert_true(
        res["max_artwork_radius"] <= res["safe_radius"],
        f"{icon_name} max artwork radius ({res['max_artwork_radius']:.2f}px) <= safe limit ({res['safe_radius']:.2f}px)"
    )
    assert_true(
        res["max_outside_diff"] <= 15,
        f"{icon_name} outside background uniformity verified (max color diff={res['max_outside_diff']})"
    )
    if res["min_interior_alpha"] < 255:
        warn(f"{icon_name} has anti-aliased edge pixels with interior alpha={res['min_interior_alpha']} inside safe zone")

print("\n--- Google Play Store Icon Stress Test ---")
store_img = Image.open(PUBLIC_ICONS / "play-store-512x512.png")
store_arr = np.array(store_img)
assert_true(store_img.size == (512, 512), "play-store-512x512.png size is exactly 512x512")
if store_arr.ndim == 3 and store_arr.shape[2] == 4:
    store_min_alpha = store_arr[:, :, 3].min()
    assert_true(store_min_alpha == 255, f"play-store-512x512.png has zero transparent pixels (min alpha={store_min_alpha})")
else:
    assert_true(store_arr.ndim == 3 and store_arr.shape[2] == 3, "play-store-512x512.png is 24-bit RGB (no alpha channel)")

# Corner pixel check for Play Store icon: must be background #090d16
corners = [
    store_arr[0, 0, :3],
    store_arr[0, 511, :3],
    store_arr[511, 0, :3],
    store_arr[511, 511, :3]
]
for idx, corner in enumerate(corners):
    diff = np.abs(corner[:3].astype(int) - BG_COLOR_RGB).sum()
    assert_true(diff <= 5, f"play-store corner {idx} matches background #090d16 (diff={diff})")

# ==============================================================================
# SUITE 4: Manifest.json Installability & W3C / TWA Criteria
# ==============================================================================
print("\n[SUITE 4] manifest.json W3C Installability & Google Play TWA Compliance")

manifest_path = PUBLIC_DIR / "manifest.json"
dist_manifest_path = DIST_DIR / "manifest.json"

assert_true(manifest_path.exists(), "public/manifest.json exists")
assert_true(dist_manifest_path.exists(), "dist/manifest.json exists")

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

with open(dist_manifest_path, "r", encoding="utf-8") as f:
    dist_manifest = json.load(f)

# Parity check
assert_true(manifest == dist_manifest, "public/manifest.json and dist/manifest.json are identical")

# W3C PWA Installability requirements
assert_true(isinstance(manifest.get("name"), str) and len(manifest["name"]) > 0, f"name present: '{manifest.get('name')}'")
assert_true(isinstance(manifest.get("short_name"), str) and 0 < len(manifest["short_name"]) <= 30, f"short_name present: '{manifest.get('short_name')}'")
assert_true(manifest.get("start_url") == "/?source=pwa", f"start_url is '/?source=pwa' (got '{manifest.get('start_url')}')")
assert_true(manifest.get("scope") == "/", f"scope is '/' (got '{manifest.get('scope')}')")
assert_true(manifest.get("display") == "standalone", f"display is 'standalone' (got '{manifest.get('display')}')")
assert_true(manifest.get("background_color") == "#090d16", f"background_color is '#090d16' (got '{manifest.get('background_color')}')")
assert_true(manifest.get("theme_color") == "#0284c7", f"theme_color is '#0284c7' (got '{manifest.get('theme_color')}')")
assert_true(manifest.get("id") == "/?source=pwa", f"id is '/?source=pwa' (got '{manifest.get('id')}')")

# Icons verification in manifest
icons = manifest.get("icons", [])
assert_true(isinstance(icons, list) and len(icons) >= 4, f"manifest defines {len(icons)} icons (>= 4)")

has_192_any = False
has_512_any = False
has_192_maskable = False
has_512_maskable = False

for icon in icons:
    src = icon.get("src", "")
    sizes = icon.get("sizes", "")
    itype = icon.get("type", "")
    purpose = icon.get("purpose", "any")
    
    assert_true(itype == "image/png", f"Icon {src} type is image/png")
    
    # Resolve file on disk
    rel_src = src.lstrip("/")
    pub_target = PUBLIC_DIR / rel_src
    dist_target = DIST_DIR / rel_src
    
    assert_true(pub_target.exists(), f"Icon src {src} exists in public/ ({pub_target})")
    assert_true(dist_target.exists(), f"Icon src {src} exists in dist/ ({dist_target})")
    
    if sizes == "192x192" and purpose == "any":
        has_192_any = True
    elif sizes == "512x512" and purpose == "any":
        has_512_any = True
    elif sizes == "192x192" and purpose == "maskable":
        has_192_maskable = True
    elif sizes == "512x512" and purpose == "maskable":
        has_512_maskable = True

assert_true(has_192_any, "manifest has 192x192 any icon")
assert_true(has_512_any, "manifest has 512x512 any icon")
assert_true(has_192_maskable, "manifest has 192x192 maskable icon")
assert_true(has_512_maskable, "manifest has 512x512 maskable icon")

# Shortcuts check
shortcuts = manifest.get("shortcuts", [])
assert_true(isinstance(shortcuts, list) and len(shortcuts) >= 3, f"manifest has {len(shortcuts)} shortcuts (>= 3)")
for sc in shortcuts:
    sc_name = sc.get("name")
    sc_url = sc.get("url", "")
    assert_true(sc_url.startswith("/"), f"Shortcut '{sc_name}' url starts with / ('{sc_url}')")
    for s_icon in sc.get("icons", []):
        s_src = s_icon.get("src", "").lstrip("/")
        assert_true((PUBLIC_DIR / s_src).exists(), f"Shortcut icon {s_src} exists on disk")

# Google Play TWA related_applications check
rel_apps = manifest.get("related_applications", [])
assert_true(isinstance(rel_apps, list) and len(rel_apps) >= 1, "manifest contains related_applications")
twa_app = next((a for a in rel_apps if a.get("platform") == "play"), None)
assert_true(twa_app is not None, "related_applications has play platform entry")
if twa_app:
    assert_true(twa_app.get("id") == "uz.axmap.app", f"related_applications id is 'uz.axmap.app' (got '{twa_app.get('id')}')")
    assert_true("id=uz.axmap.app" in twa_app.get("url", ""), f"related_applications url links to uz.axmap.app (got '{twa_app.get('url')}')")

# ==============================================================================
# SUITE 5: HTML Meta & Link Tags Verification in index.html and dist/index.html
# ==============================================================================
print("\n[SUITE 5] HTML Meta & Link Tags Verification (index.html vs dist/index.html)")

def check_html_tags(html_path, label):
    content = html_path.read_text(encoding="utf-8")
    
    # 1. Manifest link
    m_manifest = re.search(r'<link\s+[^>]*rel=["\']manifest["\'][^>]*>', content, re.I)
    assert_true(m_manifest is not None, f"{label} contains <link rel=\"manifest\">")
    if m_manifest:
        href_match = re.search(r'href=["\']([^"\']+)["\']', m_manifest.group(0))
        assert_true(href_match and href_match.group(1) == "/manifest.json", f"{label} manifest href is '/manifest.json'")
    
    # 2. Theme color
    m_theme = re.search(r'<meta\s+[^>]*name=["\']theme-color["\'][^>]*content=["\']#0284c7["\']', content, re.I)
    assert_true(m_theme is not None, f"{label} contains <meta name=\"theme-color\" content=\"#0284c7\">")
    
    # 3. Apple touch icon
    m_apple = re.search(r'<link\s+[^>]*rel=["\']apple-touch-icon["\'][^>]*>', content, re.I)
    assert_true(m_apple is not None, f"{label} contains <link rel=\"apple-touch-icon\">")
    if m_apple:
        href_apple = re.search(r'href=["\']([^"\']+)["\']', m_apple.group(0))
        assert_true(href_apple is not None, f"{label} apple-touch-icon has href")
        if href_apple:
            apple_file = (PUBLIC_DIR if label == "source" else DIST_DIR) / href_apple.group(1).lstrip("/")
            assert_true(apple_file.exists(), f"{label} apple-touch-icon file exists on disk ({apple_file})")
            
    # 4. Standard icon links
    for size in ["192x192", "512x512"]:
        m_icon = re.search(fr'<link\s+[^>]*sizes=["\']{size}["\'][^>]*>', content, re.I)
        assert_true(m_icon is not None, f"{label} contains <link rel=\"icon\" sizes=\"{size}\">")
        if m_icon:
            href_icon = re.search(r'href=["\']([^"\']+)["\']', m_icon.group(0))
            if href_icon:
                target_file = (PUBLIC_DIR if label == "source" else DIST_DIR) / href_icon.group(1).lstrip("/")
                assert_true(target_file.exists(), f"{label} {size} icon file exists ({target_file})")
    
    # 5. Mobile & PWA meta tags
    assert_true('meta name="application-name" content="AX-Map"' in content, f"{label} has application-name meta")
    assert_true('meta name="mobile-web-app-capable" content="yes"' in content, f"{label} has mobile-web-app-capable meta")
    assert_true('meta name="apple-mobile-web-app-capable" content="yes"' in content, f"{label} has apple-mobile-web-app-capable meta")
    assert_true('meta name="viewport"' in content, f"{label} has viewport meta")

check_html_tags(ROOT / "index.html", "source")
check_html_tags(DIST_DIR / "index.html", "dist")

# ==============================================================================
# SUITE 6: Adversarial Boundary & Stress Probing
# ==============================================================================
print("\n[SUITE 6] Adversarial Boundary & Edge-Case Probing")

# Test 6.1: Service Worker script existence and PWA installability prereq
sw_public = PUBLIC_DIR / "sw.js"
sw_dist = DIST_DIR / "sw.js"
assert_true(sw_public.exists(), "public/sw.js exists for PWA offline criteria")
assert_true(sw_dist.exists(), "dist/sw.js exists for PWA offline criteria")

# Test 6.2: Ensure manifest start_url is inside scope
manifest_scope = manifest.get("scope", "/")
start_url = manifest.get("start_url", "")
assert_true(start_url.startswith(manifest_scope), f"start_url '{start_url}' is within scope '{manifest_scope}'")

# Test 6.3: Ensure no broken relative path in manifest icon src
for icon in manifest.get("icons", []):
    src = icon.get("src", "")
    assert_true(src.startswith("/"), f"Icon src '{src}' uses absolute root path (not relative)")

# Test 6.4: File size limits for Google Play and PWA performance
# PWA icons should be reasonably compressed (< 500KB each)
for icon_name in expected_icons:
    size = (PUBLIC_ICONS / icon_name).stat().st_size
    assert_true(size < 500 * 1024, f"{icon_name} file size ({size / 1024:.1f} KB) is under 500KB performance budget")

print("\n" + "=" * 70)
print(f"ADVERSARIAL SUITE SUMMARY: {results['passed']} / {results['total']} PASSED, {results['failed']} FAILED")
print("=" * 70)

if results["failed"] > 0:
    print("\nFAILURES:")
    for f in results["failures"]:
        print(f)
    sys.exit(1)
else:
    print("\nALL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY!")
    sys.exit(0)
