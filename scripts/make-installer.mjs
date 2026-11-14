import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const winAppDir = path.join(releaseDir, 'Doff-Notes-win-x64');
const zipFile = path.join(releaseDir, 'app.zip');
const setupExe = path.join(releaseDir, 'Doff-Notes-Setup.exe');
const iconFile = path.join(rootDir, 'resources', 'icon.ico');
const csFile = path.join(rootDir, 'scripts', 'build-installer.cs');
const cscCompiler = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

console.log('1. Compressing Doff Notes app folder into app.zip...');
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// Use native .NET ZipFile to quickly create app.zip
const zipScript = `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${winAppDir}', '${zipFile}', [System.IO.Compression.CompressionLevel]::Fastest, $false)`;
execFileSync('powershell.exe', ['-NoProfile', '-Command', zipScript], { stdio: 'inherit' });

console.log('2. Compiling self-contained single-file installer (Doff-Notes-Setup.exe)...');
const cscArgs = [
  '/target:winexe',
  `/win32icon:${iconFile}`,
  `/resource:${zipFile},app.zip`,
  '/r:System.IO.Compression.FileSystem.dll',
  '/r:System.IO.Compression.dll',
  `/out:${setupExe}`,
  csFile,
];

execFileSync(cscCompiler, cscArgs, { stdio: 'inherit' });

// Clean up temporary app.zip to keep release folder tidy
if (fs.existsSync(zipFile)) {
  try { fs.unlinkSync(zipFile); } catch {}
}

const stats = fs.statSync(setupExe);
console.log(`✅ Success! Self-contained installer generated: ${setupExe} (${(stats.size / (1024 * 1024)).toFixed(1)} MB)`);
console.log('This single .exe has the entire app inside it. You can move it anywhere and run it without any other files!');
