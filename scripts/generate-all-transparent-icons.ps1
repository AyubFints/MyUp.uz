Add-Type -Path "c:\Users\user\Desktop\MyUp\scripts\ImageProcessor.cs" -ReferencedAssemblies "System.Drawing"

$source = "C:\Users\user\.gemini\antigravity\brain\0c842baa-243a-4780-a738-4d11b978cfdf\.user_uploaded\media_1794327303369_b423d5de.jpg"
$masterTransparent = "c:\Users\user\Desktop\MyUp\public\ax-logo-transparent.png"

Write-Host "1. Generating Master Transparent Logo..."
[ImageProcessor]::MakeTransparent($source, $masterTransparent)

function Save-Icon($dst, $w, $h) {
    $parent = Split-Path -Parent $dst
    if (!(Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    [ImageProcessor]::ResizePng($masterTransparent, $dst, $w, $h)
    Write-Host "  -> Generated: $dst ($w x $h)"
}

Write-Host "2. Generating Web / PWA Assets..."
Save-Icon "c:\Users\user\Desktop\MyUp\public\ax-logo.png" 512 512
Save-Icon "c:\Users\user\Desktop\MyUp\src\assets\ax-logo.png" 512 512
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-512x512.png" 512 512
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-192x192.png" 192 192
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-512x512.png" 512 512
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-192x192.png" 192 192
Save-Icon "c:\Users\user\Desktop\MyUp\public\icons\play-store-512x512.png" 512 512

Write-Host "3. Generating Android TWA Mipmaps..."
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_launcher.png" 48 48
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_launcher.png" 72 72
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_launcher.png" 96 96
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" 144 144
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" 192 192

Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_maskable.png" 48 48
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_maskable.png" 72 72
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_maskable.png" 96 96
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_maskable.png" 144 144
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_maskable.png" 192 192

Write-Host "4. Generating Android TWA Splash..."
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable\splash.png" 512 512
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-mdpi\splash.png" 320 320
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-hdpi\splash.png" 480 480
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xhdpi\splash.png" 640 640
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxhdpi\splash.png" 960 960
Save-Icon "c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxxhdpi\splash.png" 1024 1024

Write-Host "Done generating all icons!"
