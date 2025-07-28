$AppDir = "C:\Server\htdocs\expedientes-digitales"
cd $AppDir

# Build to a temporary folder
$env:NEXT_BUILD_DIR=".next_build"
npm run build

if (Test-Path ".next_build") {
    # Backup old build and swap
    if (Test-Path ".next_old") { Remove-Item ".next_old" -Recurse -Force }
    Rename-Item ".next" ".next_old"
    Rename-Item ".next_build" ".next"

    # Reload PM2 gracefully
    pm2 reload expedientes-digitales

    Write-Host "✅ Deployment successful. Old build is in .next_old."
} else {
    Write-Host "❌ Build failed. Keeping current version."
}
