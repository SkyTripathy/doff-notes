@echo off
title Doff Notes
cd /d "%~dp0"
if exist "release\Doff-Notes-win-x64\Doff Notes.exe" (
    start "" "release\Doff-Notes-win-x64\Doff Notes.exe"
) else (
    echo Building Doff Notes application...
    call npm.cmd run package:portable
    start "" "release\Doff-Notes-win-x64\Doff Notes.exe"
)
exit
