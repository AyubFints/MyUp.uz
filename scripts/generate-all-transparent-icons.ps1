Add-Type -Path "c:\Users\user\Desktop\MyUp\scripts\ImageProcessor.cs" -ReferencedAssemblies "System.Drawing"

$source = "C:\Users\user\.gemini\antigravity\brain\0c842baa-243a-4780-a738-4d11b978cfdf\.user_uploaded\media_1794378577923_240485e1.jpg"
$masterTransparent = "c:\Users\user\Desktop\MyUp\public\ax-logo-transparent.png"

Write-Host "1. Generating Master Transparent Logo (blue bg removal)..."
[ImageProcessor]::MakeTransparentBlue($source, $masterTransparent)

function Save-Icon($dst, $w, $h, $ratio = 0.80) {
    $parent = Split-Path -Parent $dst
    if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    [ImageProcessor]::GeneratePaddedIcon($masterTransparent, $dst, $w, $h, $ratio)
    Write-Host "  -> Generated: $dst ($w x $h, ratio: $ratio)"
}

Write-Host "2. Generating Android TWA Mipmaps (Safe-zone padded for squircle/circle masks)..."
# Adaptive icon foreground (ic_maskable) safe ratio = 0.58 so all 4 rounded edges & corners are 100% visible
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_maskable.png" 48 48 0.58
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_maskable.png" 72 72 0.58
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_maskable.png" 96 96 0.58
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_maskable.png" 144 144 0.58
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_maskable.png" 192 192 0.58

# Legacy / installer icon (ic_launcher) ratio = 0.75 for crisp package installer display
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_launcher.png" 48 48 0.75
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_launcher.png" 72 72 0.75
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_launcher.png" 96 96 0.75
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" 144 144 0.75
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" 192 192 0.75

Write-Host "3. Generating Web / PWA Assets..."
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-512x512.png" 512 512 0.80
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-192x192.png" 192 192 0.80
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-512x512.png" 512 512 0.60
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-192x192.png" 192 192 0.60
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\play-store-512x512.png" 512 512 0.80

Write-Host "4. Generating Android TWA Splash..."
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable\splash.png" 512 512 0.50
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-mdpi\splash.png" 320 320 0.50
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-hdpi\splash.png" 480 480 0.50
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xhdpi\splash.png" 640 640 0.50
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxhdpi\splash.png" 960 960 0.50
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxxhdpi\splash.png" 1024 1024 0.50

Write-Host "Done generating all icons!"
