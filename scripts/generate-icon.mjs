import { app, BrowserWindow, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const svgPath = path.join(rootDir, 'resources', 'icon.svg');
const outPngPath = path.join(rootDir, 'resources', 'icon.png');
const outIcoPath = path.join(rootDir, 'resources', 'icon.ico');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 256,
    height: 256,
    show: false,
    webPreferences: { offscreen: true },
    frame: false,
    transparent: true,
  });

  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: transparent; overflow: hidden;">
        ${svgContent}
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  
  // Wait a moment for rendering
  await new Promise((r) => setTimeout(r, 600));

  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 256, height: 256 });
  const pngBuffer = image.toPNG();
  fs.writeFileSync(outPngPath, pngBuffer);
  console.log('Saved icon.png at:', outPngPath);

  // Simple ICO builder from 256x256 PNG (standard Windows Vista+ PNG in ICO format)
  // ICO header: 6 bytes (idReserved=0, idType=1, idCount=1)
  // Directory entry: 16 bytes (bWidth=0(256), bHeight=0(256), bColorCount=0, bReserved=0, wPlanes=1, wBitCount=32, dwBytesInRes, dwImageOffset=22)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // icon type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const icoDir = Buffer.alloc(16);
  icoDir.writeUInt8(0, 0); // width 256
  icoDir.writeUInt8(0, 1); // height 256
  icoDir.writeUInt8(0, 2); // colors
  icoDir.writeUInt8(0, 3); // reserved
  icoDir.writeUInt16LE(1, 4); // color planes
  icoDir.writeUInt16LE(32, 6); // bits per pixel
  icoDir.writeUInt32LE(pngBuffer.length, 8); // image size
  icoDir.writeUInt32LE(22, 12); // image offset

  const icoBuffer = Buffer.concat([icoHeader, icoDir, pngBuffer]);
  fs.writeFileSync(outIcoPath, icoBuffer);
  console.log('Saved icon.ico at:', outIcoPath);

  app.quit();
});
