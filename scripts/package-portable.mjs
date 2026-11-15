import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const electronDistDir = path.join(rootDir, 'node_modules', 'electron', 'dist');
const outDir = path.join(rootDir, 'release', 'Doff-Notes-win-x64');
const resourcesAppDir = path.join(outDir, 'resources', 'app');
const targetExe = path.join(outDir, 'Doff Notes.exe');

console.log('Packaging Doff Notes Windows app to:', outDir);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
  console.log('Copying Electron runtime binaries...');
  fs.cpSync(electronDistDir, outDir, { recursive: true });
  const defaultExe = path.join(outDir, 'electron.exe');
  if (fs.existsSync(defaultExe)) {
    fs.renameSync(defaultExe, targetExe);
  }
} else {
  const defaultExe = path.join(outDir, 'electron.exe');
  if (fs.existsSync(defaultExe) && !fs.existsSync(targetExe)) {
    fs.renameSync(defaultExe, targetExe);
  }
}

// Ensure resources/app is clean and updated
if (fs.existsSync(resourcesAppDir)) {
  try {
    fs.rmSync(resourcesAppDir, { recursive: true, force: true });
  } catch {}
}
fs.mkdirSync(resourcesAppDir, { recursive: true });

console.log('Copying production bundles & resources into resources/app...');
fs.cpSync(path.join(rootDir, 'dist'), path.join(resourcesAppDir, 'dist'), { recursive: true });
fs.cpSync(path.join(rootDir, 'dist-electron'), path.join(resourcesAppDir, 'dist-electron'), { recursive: true });
if (fs.existsSync(path.join(rootDir, 'resources'))) {
  fs.cpSync(path.join(rootDir, 'resources'), path.join(resourcesAppDir, 'resources'), { recursive: true });
}

// App package.json
const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const appPkg = {
  name: 'doff-notes',
  version: rootPkg.version || '1.1.0',
  productName: 'Doff Notes',
  main: 'dist-electron/main.cjs',
};
fs.writeFileSync(
  path.join(resourcesAppDir, 'package.json'),
  JSON.stringify(appPkg, null, 2),
  'utf-8'
);

// Inject embedded icon and VersionInfo (ProductName=Doff Notes, FileDescription=Doff Notes)
const updaterExe = path.join(rootDir, 'scripts', 'update-exe-resources.exe');
const icoPath = path.join(rootDir, 'resources', 'icon.ico');
if (fs.existsSync(updaterExe) && fs.existsSync(targetExe) && fs.existsSync(icoPath)) {
  console.log('Injecting icon and Doff Notes version metadata into executable...');
  try {
    execFileSync(updaterExe, [targetExe, icoPath], { stdio: 'inherit' });
  } catch (e) {
    console.warn('Warning: Could not update exe resources:', e.message);
  }
}

console.log('✅ Doff Notes Windows package completed successfully!');
console.log('Executable created at:', targetExe);
