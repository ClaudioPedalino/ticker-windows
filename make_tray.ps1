Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\claud\.gemini\antigravity\brain\9749a6be-5a1f-4308-8bb2-01730acd3854\tray_trading_icon_1772710949499.png'
$dstPath = 'assets\tray.png'

$src = New-Object System.Drawing.Bitmap($srcPath)
$dst = New-Object System.Drawing.Bitmap(32, 32)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 32, 32)
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()
Write-Host 'Tray icon saved.'
