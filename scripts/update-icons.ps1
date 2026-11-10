Add-Type -AssemblyName System.Drawing

function Resize-Image($srcPath, $dstPath, $width, $height) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $width, $height)
    $g.Dispose()
    $src.Dispose()
    $dstDir = Split-Path -Parent $dstPath
    if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $dstPath"
}

$source = 'C:\Users\user\.gemini\antigravity\brain\0c842baa-243a-4780-a738-4d11b978cfdf\.user_uploaded\media_1794325820705_84deade8.jpg'

Resize-Image $source 'c:\Users\user\Desktop\MyUp\public\icons\play-store-512x512.png' 512 512
Resize-Image $source 'c:\Users\user\Desktop\MyUp\public\icons\icon-512x512.png' 512 512
Resize-Image $source 'c:\Users\user\Desktop\MyUp\public\icons\icon-192x192.png' 192 192
Resize-Image $source 'c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-512x512.png' 512 512
Resize-Image $source 'c:\Users\user\Desktop\MyUp\public\icons\icon-maskable-192x192.png' 192 192

# Android mipmaps
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_launcher.png' 48 48
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_launcher.png' 72 72
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_launcher.png' 96 96
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_launcher.png' 144 144
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png' 192 192

Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-mdpi\ic_maskable.png' 48 48
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-hdpi\ic_maskable.png' 72 72
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xhdpi\ic_maskable.png' 96 96
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxhdpi\ic_maskable.png' 144 144
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\mipmap-xxxhdpi\ic_maskable.png' 192 192

# Splash
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable\splash.png' 512 512
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-mdpi\splash.png' 320 320
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-hdpi\splash.png' 480 480
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xhdpi\splash.png' 640 640
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxhdpi\splash.png' 960 960
Resize-Image $source 'c:\Users\user\Desktop\MyUp\android-twa\app\src\main\res\drawable-xxxhdpi\splash.png' 1024 1024
