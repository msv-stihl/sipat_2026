Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\icons.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Image size: $w x $h"

# Check horizontal projection in row 0 (top half: y from 0 to 240)
# and row 1 (bottom half: y from 245 to 488)

Write-Host "Top half (y < 245):"
for ($x = 180; $x -le 300; $x += 5) {
    $count = 0
    for ($y = 0; $y -lt 245; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 10) { $count++ }
    }
    Write-Host "X=$x : $count pixels"
}

Write-Host "`nBetween Col 1 and 2 top half:"
for ($x = 480; $x -le 570; $x += 5) {
    $count = 0
    for ($y = 0; $y -lt 245; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 10) { $count++ }
    }
    Write-Host "X=$x : $count pixels"
}

Write-Host "`nBottom half between Col 0 and 1:"
for ($x = 170; $x -le 290; $x += 5) {
    $count = 0
    for ($y = 260; $y -lt 489; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 10) { $count++ }
    }
    Write-Host "X=$x : $count pixels"
}

Write-Host "`nBottom half between Col 1 and 2:"
for ($x = 440; $x -le 590; $x += 5) {
    $count = 0
    for ($y = 260; $y -lt 489; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 10) { $count++ }
    }
    Write-Host "X=$x : $count pixels"
}

$bmp.Dispose()
