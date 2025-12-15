#!/usr/bin/env pwsh

# Lista de archivos que necesitan la configuración dinámica
$files = @(
    "app\api\gamification\student-progress\route.ts",
    "app\api\users\stats\student\route.ts",
    "app\api\gamification\badges\route.ts",
    "app\api\gamification\achievements\route.ts",
    "app\api\gamification\achievements\user\route.ts",
    "app\api\gamification\leaderboard\route.ts",
    "app\api\gamification\missions\route.ts",
    "app\api\gamification\missions\[id]\route.ts",
    "app\api\gamification\activities\route.ts",
    "app\api\gamification\activities\[id]\route.ts",
    "app\api\gamification\achievements\[id]\students\route.ts",
    "app\api\gamification\progress\missions\route.ts",
    "app\api\gamification\progress\missions\[id]\attempt\route.ts",
    "app\api\gamification\progress\activities\complete\route.ts",
    "app\api\gamification\progress\student\[id]\route.ts"
)

$dynamicExport = "export const dynamic = 'force-dynamic';"

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if already has dynamic export
        if ($content -notmatch "export const dynamic") {
            # Find the first import statement and add after it
            $lines = Get-Content $fullPath
            $newLines = @()
            $added = $false
            
            for ($i = 0; $i -lt $lines.Count; $i++) {
                $newLines += $lines[$i]
                
                # Add after the last import and before any other code
                if (-not $added -and $lines[$i] -match "^import " -and ($i + 1 -lt $lines.Count) -and $lines[$i + 1] -notmatch "^import ") {
                    $newLines += ""
                    $newLines += "// Force dynamic rendering (uses cookies for authentication)"
                    $newLines += $dynamicExport
                    $added = $true
                }
            }
            
            $newLines | Set-Content $fullPath
            Write-Host "✅ Updated: $file"
        } else {
            Write-Host "⏭️  Skipped (already has dynamic): $file"
        }
    } else {
        Write-Host "❌ Not found: $file"
    }
}

Write-Host "`n✨ Done!"
