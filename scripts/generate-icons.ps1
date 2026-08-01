Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root "00-logo-nouveau.png"
$src = [System.Drawing.Image]::FromFile($srcPath)

function New-ResizedPng {
    param(
        [System.Drawing.Image]$Source,
        [int]$Size,
        [string]$OutPath
    )
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $bmp.SetResolution($Source.HorizontalResolution, $Source.VerticalResolution)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($Source, 0, 0, $Size, $Size)
    $g.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    return $bmp
}

function Get-PngBytes {
    param([System.Drawing.Image]$Source, [int]$Size)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($Source, 0, 0, $Size, $Size)
    $g.Dispose()
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    return ,$ms.ToArray()
}

# icon.png (512) and apple-icon.png (180)
$b512 = New-ResizedPng -Source $src -Size 512 -OutPath (Join-Path $root "app\icon.png")
$b512.Dispose()
$b180 = New-ResizedPng -Source $src -Size 180 -OutPath (Join-Path $root "app\apple-icon.png")
$b180.Dispose()

# Multi-resolution favicon.ico (16/32/48) with PNG-compressed entries (Vista-style ICO)
$sizes = @(16, 32, 48)
$pngBlobs = @()
foreach ($s in $sizes) {
    $pngBlobs += ,(Get-PngBytes -Source $src -Size $s)
}

$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)

# ICONDIR
$bw.Write([UInt16]0)      # reserved
$bw.Write([UInt16]1)      # type = icon
$bw.Write([UInt16]$sizes.Count)

$headerSize = 6
$entrySize = 16
$offset = $headerSize + ($entrySize * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $blob = $pngBlobs[$i]
    $wByte = if ($s -ge 256) { 0 } else { $s }
    $hByte = if ($s -ge 256) { 0 } else { $s }
    $bw.Write([Byte]$wByte)      # width (0 = 256)
    $bw.Write([Byte]$hByte)      # height (0 = 256)
    $bw.Write([Byte]0)           # color palette
    $bw.Write([Byte]0)           # reserved
    $bw.Write([UInt16]1)         # color planes
    $bw.Write([UInt16]32)        # bits per pixel
    $bw.Write([UInt32]$blob.Length)
    $bw.Write([UInt32]$offset)
    $offset += $blob.Length
}

foreach ($blob in $pngBlobs) {
    $bw.Write($blob)
}

$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $root "app\favicon.ico"), $ms.ToArray())
$bw.Dispose()
$ms.Dispose()
$src.Dispose()

Write-Host "Generated app/icon.png (512), app/apple-icon.png (180), app/favicon.ico (16/32/48)"
