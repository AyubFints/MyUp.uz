"""
AX-Map Production PWA & Store Icon Generator
Generates high-definition PWA, TWA maskable, and Google Play Store icons
from public/amaps-logo.png into public/icons/.
"""
import os
import sys
from PIL import Image

def generate_icons(src_path="public/amaps-logo.png", out_dir="public/icons"):
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        sys.exit(1)

    os.makedirs(out_dir, exist_ok=True)
    src_img = Image.open(src_path).convert("RGBA")

    # Crop to non-transparent bounding box for pixel-exact centering and scaling
    bbox = src_img.getbbox()
    cropped = src_img.crop(bbox) if bbox else src_img
    w, h = cropped.size
    print(f"Loaded {src_path}: original {src_img.size}, cropped emblem {w}x{h}")

    # Color definitions
    BG_DARK = (9, 13, 22, 255)      # #090d16 dark background
    BG_TRANSPARENT = (0, 0, 0, 0)   # Transparent

    def render_canvas(size, bg_color, max_dim):
        canvas = Image.new("RGBA", (size, size), bg_color)
        scale = max_dim / max(w, h)
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))

        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2

        canvas.paste(resized, (offset_x, offset_y), resized)
        return canvas

    # 1. icon-192x192.png (purpose: "any", transparent background)
    ico_192 = render_canvas(192, BG_TRANSPARENT, max_dim=168)
    ico_192.save(os.path.join(out_dir, "icon-192x192.png"), "PNG", optimize=True)
    print("✓ Created public/icons/icon-192x192.png (192x192, transparent)")

    # 2. icon-512x512.png (purpose: "any", transparent background)
    ico_512 = render_canvas(512, BG_TRANSPARENT, max_dim=448)
    ico_512.save(os.path.join(out_dir, "icon-512x512.png"), "PNG", optimize=True)
    print("✓ Created public/icons/icon-512x512.png (512x512, transparent)")

    # 3. icon-maskable-192x192.png (#090d16 bg, safe within 80% circle of radius 76.8px)
    ico_m192 = render_canvas(192, BG_DARK, max_dim=126)
    ico_m192.save(os.path.join(out_dir, "icon-maskable-192x192.png"), "PNG", optimize=True)
    print("✓ Created public/icons/icon-maskable-192x192.png (192x192, #090d16 bg, 80% safe zone)")

    # 4. icon-maskable-512x512.png (#090d16 bg, safe within 80% circle of radius 204.8px)
    ico_m512 = render_canvas(512, BG_DARK, max_dim=336)
    ico_m512.save(os.path.join(out_dir, "icon-maskable-512x512.png"), "PNG", optimize=True)
    print("✓ Created public/icons/icon-maskable-512x512.png (512x512, #090d16 bg, 80% safe zone)")

    # 5. play-store-512x512.png (full bleed square, #090d16 bg, opaque RGB)
    ico_ps = render_canvas(512, BG_DARK, max_dim=380)
    ico_ps.convert("RGB").save(os.path.join(out_dir, "play-store-512x512.png"), "PNG", optimize=True)
    print("✓ Created public/icons/play-store-512x512.png (512x512, RGB full bleed square)")

    print(f"\nAll 5 application icons successfully created in: {os.path.abspath(out_dir)}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "public/icons"
    generate_icons(out_dir=out)
