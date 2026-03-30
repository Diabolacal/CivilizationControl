## Trailer Assembly Script
## Muxes voiceovers onto trimmed video segments, then concatenates.

$ErrorActionPreference = "Continue"
$asm = "c:\dev\CivilizationControl\recordings\assembly"
$vo = "c:\dev\CivilizationControl\recordings\voiceovers"
$out = "c:\dev\CivilizationControl\recordings"

# ── Beat 1 (22s): VO covers full duration, simple mux ──
Write-Host "Beat 1: muxing voiceover..."
ffmpeg -y -i "$asm\01-pain.mp4" -i "$vo\b01-pain-a.mp3" -c:v copy -c:a aac -b:a 192k -shortest "$asm\01-pain-av.mp4" 2>$null
Write-Host "  done"

# ── Beat 2 (20s): VO-a at 0s ("CivilizationControl"), VO-b at 4s ("Every structure...") ──
Write-Host "Beat 2: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b02-power-a.mp3" -i "$vo\b02-power-b.mp3" -filter_complex "[1]adelay=0|0,apad[v1];[2]adelay=4000|4000,apad[v2];[v1][v2]amix=inputs=2:normalize=0[mixed]" -map "[mixed]" -t 20 -c:a aac -b:a 192k "$asm\02-audio.m4a" 2>$null
ffmpeg -y -i "$asm\02-power.mp4" -i "$asm\02-audio.m4a" -c:v copy -c:a copy -shortest "$asm\02-power-av.mp4" 2>$null
Remove-Item "$asm\02-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 3 (26s): VO-a at 3s ("You decide who crosses"), VO-b at 8s ("Allies at a thousand") ──
Write-Host "Beat 3: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b03-policy-a.mp3" -i "$vo\b03-policy-b.mp3" -filter_complex "[1]adelay=3000|3000,apad[v1];[2]adelay=8000|8000,apad[v2];[v1][v2]amix=inputs=2:normalize=0[mixed]" -map "[mixed]" -t 26 -c:a aac -b:a 192k "$asm\03-audio.m4a" 2>$null
ffmpeg -y -i "$asm\03-policy.mp4" -i "$asm\03-audio.m4a" -c:v copy -c:a copy -shortest "$asm\03-policy-av.mp4" 2>$null
Remove-Item "$asm\03-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 5 (18s): VO at 1s ──
Write-Host "Beat 5: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b05-revenue-a.mp3" -filter_complex "[1]adelay=1000|1000,apad[v1];[0][v1]amix=inputs=2:duration=first:normalize=0[mixed]" -map "[mixed]" -t 18 -c:a aac -b:a 192k "$asm\05-audio.m4a" 2>$null
ffmpeg -y -i "$asm\05-revenue.mp4" -i "$asm\05-audio.m4a" -c:v copy -c:a copy -shortest "$asm\05-revenue-av.mp4" 2>$null
Remove-Item "$asm\05-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 6 (30s): VO-a at 1s ("Threat inbound"), VO-b at 4s ("One click"), VO-c at 20s ("Gates locked...") ──
Write-Host "Beat 6: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b06-defense-a.mp3" -i "$vo\b06-defense-b.mp3" -i "$vo\b06-defense-c.mp3" -filter_complex "[1]adelay=1000|1000,apad[v1];[2]adelay=4000|4000,apad[v2];[3]adelay=20000|20000,apad[v3];[v1][v2][v3]amix=inputs=3:normalize=0[mixed]" -map "[mixed]" -t 30 -c:a aac -b:a 192k "$asm\06-audio.m4a" 2>$null
ffmpeg -y -i "$asm\06-defense.mp4" -i "$asm\06-audio.m4a" -c:v copy -c:a copy -shortest "$asm\06-defense-av.mp4" 2>$null
Remove-Item "$asm\06-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 7 (22s): VO at 2s ──
Write-Host "Beat 7: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b07-commerce-a.mp3" -filter_complex "[1]adelay=2000|2000,apad[v1];[0][v1]amix=inputs=2:duration=first:normalize=0[mixed]" -map "[mixed]" -t 22 -c:a aac -b:a 192k "$asm\07-audio.m4a" 2>$null
ffmpeg -y -i "$asm\07-commerce.mp4" -i "$asm\07-audio.m4a" -c:v copy -c:a copy -shortest "$asm\07-commerce-av.mp4" 2>$null
Remove-Item "$asm\07-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 8 (15s): VO-a at 1s, VO-b at 8s ──
Write-Host "Beat 8: creating audio track..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$vo\b08-command-a.mp3" -i "$vo\b08-command-b.mp3" -filter_complex "[1]adelay=1000|1000,apad[v1];[2]adelay=8000|8000,apad[v2];[v1][v2]amix=inputs=2:normalize=0[mixed]" -map "[mixed]" -t 15 -c:a aac -b:a 192k "$asm\08-audio.m4a" 2>$null
ffmpeg -y -i "$asm\08-command.mp4" -i "$asm\08-audio.m4a" -c:v copy -c:a copy -shortest "$asm\08-command-av.mp4" 2>$null
Remove-Item "$asm\08-audio.m4a" -ErrorAction SilentlyContinue
Write-Host "  done"

# ── Beat 9 (13s): No voiceover — video only, need silent audio track for concat ──
Write-Host "Beat 9: adding silent audio..."
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -i "$asm\09-close.mp4" -c:v copy -c:a aac -b:a 192k -shortest "$asm\09-close-av.mp4" 2>$null
Write-Host "  done"

# ── Concatenate all beats ──
Write-Host "`nConcatenating trailer..."
$concatList = "$asm\concat-av.txt"
$beats = @(
    "$asm\01-pain-av.mp4",
    "$asm\02-power-av.mp4",
    "$asm\03-policy-av.mp4",
    "$asm\05-revenue-av.mp4",
    "$asm\06-defense-av.mp4",
    "$asm\07-commerce-av.mp4",
    "$asm\08-command-av.mp4",
    "$asm\09-close-av.mp4"
)
$lines = $beats | ForEach-Object { "file '$($_ -replace '\\','/')'" }
[System.IO.File]::WriteAllLines($concatList, $lines, (New-Object System.Text.UTF8Encoding $false))

ffmpeg -y -f concat -safe 0 -i "$concatList" -c copy "$out\rough-cut-v2.mp4" 2>$null
Remove-Item $concatList -ErrorAction SilentlyContinue

$info = ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$out\rough-cut-v2.mp4" 2>$null
$sz = [math]::Round((Get-Item "$out\rough-cut-v2.mp4").Length/1MB, 1)
Write-Host "`n=== TRAILER ASSEMBLED ==="
Write-Host "  File: recordings\rough-cut-v2.mp4"
Write-Host "  Duration/Size: $info"
Write-Host "  Size: ${sz}MB"
Write-Host "  Beats: 1,2,3,5,6,7,8,9 (Beat 4 placeholder missing)"
