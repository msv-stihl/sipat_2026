Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\assets\icons.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Source image size: $w x $h"

# Exact bounds for each icon slot
$slots = @(
    @{
        Id = "level1";
        Name = "level1_caca_palavras";
        LevelTitle = "Caça-Palavras";
        XMin = 225; XMax = 525;
        YMin = 0;   YMax = 250;
    },
    @{
        Id = "level2";
        Name = "level2_forca";
        LevelTitle = "Jogo da Forca";
        XMin = 0;   XMax = 220;
        YMin = 0;   YMax = 250;
    },
    @{
        Id = "level3";
        Name = "level3_quiz";
        LevelTitle = "Questionário";
        XMin = 530; XMax = 796;
        YMin = 0;   YMax = 250;
    },
    @{
        Id = "level4";
        Name = "level4_decisao";
        LevelTitle = "Tomada de Decisão";
        XMin = 0;   XMax = 230;
        YMin = 255; YMax = 488;
    },
    @{
        Id = "level5";
        Name = "level5_riscos";
        LevelTitle = "Encontre os Riscos";
        XMin = 235; XMax = 520;
        YMin = 255; YMax = 488;
    },
    @{
        Id = "level6";
        Name = "level6_cruzadinha";
        LevelTitle = "Cruzadinha SIPAT";
        XMin = 530; XMax = 796;
        YMin = 255; YMax = 488;
    }
)

$outDir = Join-Path $PSScriptRoot "..\assets\icons"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

foreach ($slot in $slots) {
    $xStart = $slot.XMin
    $xEnd   = $slot.XMax
    $yStart = $slot.YMin
    $yEnd   = $slot.YMax

    # Exact bounding box scan
    $minX = $xEnd; $maxX = $xStart
    $minY = $yEnd; $maxY = $yStart
    $found = $false

    for ($y = $yStart; $y -le $yEnd; $y++) {
        for ($x = $xStart; $x -le $xEnd; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                $found = $true
            }
        }
    }

    if (-not $found) {
        Write-Warning "No pixels found for $($slot.Name)"
        continue
    }

    # Add 2px margin around exact icon
    $cropX = [Math]::Max(0, $minX - 2)
    $cropY = [Math]::Max(0, $minY - 2)
    $cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + 4)
    $cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + 4)

    Write-Host "Extracting $($slot.Name): X=$cropX Y=$cropY W=$cropW H=$cropH"

    # 1. Native Trimmed Cropped Version
    $rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $cropped = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($bmp, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destFile = Join-Path $outDir "$($slot.Name).png"
    $cropped.Save($destFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()

    # 2. Centered Square Version (128x128 for UI game cards and headers)
    $squareSizes = @(128, 256)
    foreach ($sqSize in $squareSizes) {
        $sqBmp = New-Object System.Drawing.Bitmap($sqSize, $sqSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gSq = [System.Drawing.Graphics]::FromImage($sqBmp)
        $gSq.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gSq.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gSq.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gSq.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $gSq.Clear([System.Drawing.Color]::Transparent)

        $pad = [int]($sqSize * 0.06)
        $avail = $sqSize - ($pad * 2)
        $scale = [Math]::Min([double]$avail / $cropW, [double]$avail / $cropH)
        $fitW = [int]($cropW * $scale)
        $fitH = [int]($cropH * $scale)
        $fitX = [int](($sqSize - $fitW) / 2)
        $fitY = [int](($sqSize - $fitH) / 2)

        $sqDestRect = New-Object System.Drawing.Rectangle($fitX, $fitY, $fitW, $fitH)
        $sqSourceRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
        $gSq.DrawImage($bmp, $sqDestRect, $sqSourceRect, [System.Drawing.GraphicsUnit]::Pixel)
        $gSq.Dispose()

        $suffix = if ($sqSize -eq 128) { "" } else { "_${sqSize}" }
        # Main square file is levelX.png for easy referencing
        $sqDestFile = Join-Path $outDir "$($slot.Id)${suffix}.png"
        $sqBmp.Save($sqDestFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $sqBmp.Dispose()
    }

    Write-Host "Done: $($slot.Id)"
}

$bmp.Dispose()
Write-Host "`nAll 6 game icons extracted and resized to square formats (128x128 & 256x256) with perfect alpha transparency!"
