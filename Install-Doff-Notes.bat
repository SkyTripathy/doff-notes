@echo off
title Install Doff Notes
cd /d "%~dp0"
if exist "release\Doff-Notes-Setup.exe" (
    start "" "release\Doff-Notes-Setup.exe"
) else (
    echo Building Doff Notes installer...
    call npm.cmd run package:all
    start "" "release\Doff-Notes-Setup.exe"
)
exit
