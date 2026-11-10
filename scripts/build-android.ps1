$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Users\user\.bubblewrap\jdk\jdk-17.0.11+9"
$env:ANDROID_HOME = "C:\Users\user\.bubblewrap\android_sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java version:"
& "$env:JAVA_HOME\bin\java.exe" -version

Set-Location "c:\Users\user\Desktop\MyUp\android-twa"

Write-Host "Running Gradle clean assembleRelease bundleRelease..."
cmd.exe /c "gradlew.bat assembleRelease bundleRelease"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Copying artifacts to workspace root..."
Copy-Item "app\build\outputs\apk\release\app-release.apk" "c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.apk" -Force
Copy-Item "app\build\outputs\bundle\release\app-release.aab" "c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab" -Force

Write-Host "Build finished successfully!"
Get-Item "c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.apk" | Select-Object Name, Length, LastWriteTime
Get-Item "c:\Users\user\Desktop\MyUp\uz.axmap.app-v1.0.0-release.aab" | Select-Object Name, Length, LastWriteTime
