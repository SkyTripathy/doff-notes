import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Set application identity to Doff Notes
app.setName('Doff Notes');
app.setAppUserModelId('com.doffnotes.app');

// Enable GPU optimizations for silky smooth rendering
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let mainWindow: BrowserWindow | null = null;

function getDbPath(): string {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, 'notes-database.json');
}

function getInitialDatabase(): unknown {
  const now = Date.now();
  return {
    version: 1,
    folders: [
      { id: 'notes-default', name: 'Notes', parentId: null, isExpanded: true, createdAt: now, order: 0 },
      { id: 'folder-projects', name: '1 Projects', parentId: null, isExpanded: true, createdAt: now + 1, order: 1 },
      { id: 'folder-coding', name: 'Coding', parentId: 'folder-projects', isExpanded: true, createdAt: now + 2, order: 2 },
      { id: 'folder-work', name: 'Work', parentId: null, isExpanded: true, createdAt: now + 3, order: 3 },
      { id: 'folder-personal', name: 'Personal', parentId: null, isExpanded: true, createdAt: now + 4, order: 4 },
    ],
    notes: [
      {
        id: 'welcome-note',
        folderId: 'notes-default',
        title: 'Welcome to Doff Notes',
        snippet: 'A fast, lightweight, and native Apple Notes experience for Windows...',
        contentHtml: `
          <h1>Welcome to Doff Notes</h1>
          <p>A fast, native Apple Notes experience crafted for Windows with macOS typography, hierarchical subfolders, and 100% offline privacy.</p>
          <h2>✨ Key Features</h2>
          <ul>
            <li><strong>Hierarchical Folders</strong>: Organize notes into nested subfolders to any depth.</li>
            <li><strong>Left-Aligned Typography</strong>: Authentic macOS styling and clean headers.</li>
            <li><strong>100% Offline &amp; Private</strong>: Notes stay completely on your computer.</li>
            <li><strong>Apple Notes Export</strong>: Easily export markdown folders for native import into Apple Notes on Mac.</li>
            <li><strong>Client-Side Encryption</strong>: Lock sensitive notes with AES-256 encryption.</li>
          </ul>
        `,
        isPinned: true,
        isDeleted: false,
        deletedAt: null,
        isLocked: false,
        tags: ['welcome'],
        thumbnail: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'note-shortcuts',
        folderId: 'notes-default',
        title: 'Quick Tips & Shortcuts',
        snippet: 'Keyboard shortcuts and tips for getting the most out of Doff Notes...',
        contentHtml: `
          <h1>Quick Tips &amp; Shortcuts</h1>
          <p>Here are a few handy shortcuts to help you write faster:</p>
          <ul>
            <li><code>Ctrl + N</code> &mdash; Create a new note</li>
            <li><code>Ctrl + B</code> &mdash; Bold text</li>
            <li><code>Ctrl + I</code> &mdash; Italic text</li>
            <li><code>Ctrl + U</code> &mdash; Underline text</li>
            <li><code>Ctrl + Shift + 9</code> &mdash; Interactive Checklist</li>
          </ul>
          <h2>Checklist Demo</h2>
          <ul data-type="taskList">
            <li data-type="taskItem" data-checked="true">Install Doff Notes</li>
            <li data-type="taskItem" data-checked="false">Create custom subfolders</li>
            <li data-type="taskItem" data-checked="false">Export notes for Mac import</li>
          </ul>
        `,
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        isLocked: false,
        tags: ['tips', 'shortcuts'],
        thumbnail: null,
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
      },
    ],
    settings: {
      theme: 'system',
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      viewMode: 'list',
      lockVerifier: null,
      lockHint: '',
    },
  };
}

function createWindow(): void {
  let iconPath = path.join(__dirname, '..', 'resources', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', 'resources', 'icon.png');
  }

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 780,
    minHeight: 500,
    title: 'Doff Notes',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: false, // Clean custom frame with smooth controls
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: true,
    },
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#fbfbfa',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (devUrl) {
    mainWindow.loadURL(devUrl).catch(() => {
      if (fs.existsSync(indexPath)) {
        mainWindow?.loadFile(indexPath);
      }
    });
  } else {
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Convert HTML to clean Apple Notes / CommonMark markdown
function simpleHtmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<li data-type="taskItem" data-checked="true">(.*?)<\/li>/gi, '- [x] $1\n')
    .replace(/<li data-type="taskItem" data-checked="false">(.*?)<\/li>/gi, '- [ ] $1\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<hr\/?>/gi, '---\n\n')
    .replace(/<br\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// Build hierarchical folder path for folder export
function getFolderPath(folderId: string, folders: any[]): string {
  if (folderId === 'notes-default') return 'Notes';
  if (folderId === 'quick-notes') return 'Quick Notes';

  const folder = folders.find((f: any) => f.id === folderId);
  if (!folder) return 'Notes';

  const cleanName = folder.name.replace(/[/\\?%*:|"<>]/g, '_');
  if (folder.parentId) {
    const parentPath = getFolderPath(folder.parentId, folders);
    return path.join(parentPath, cleanName);
  }
  return cleanName;
}

function exportDatabaseToFolder(data: any, targetDir: string): boolean {
  try {
    const notesRootDir = path.join(targetDir, 'Doff Notes');
    if (!fs.existsSync(notesRootDir)) {
      fs.mkdirSync(notesRootDir, { recursive: true });
    }

    // 1. Save master JSON backup in targetDir
    const backupPath = path.join(notesRootDir, 'Notes-Backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');

    const folders = Array.isArray(data.folders) ? data.folders : [];

    // 2. Ensure each folder and subfolder directory exists
    for (const f of folders) {
      const relPath = getFolderPath(f.id, folders);
      const absDir = path.join(notesRootDir, relPath);
      fs.mkdirSync(absDir, { recursive: true });
    }

    // 3. Mirror each note as clean .md markdown (ready for Apple Notes Mac import)
    if (Array.isArray(data.notes)) {
      for (const note of data.notes) {
        if (note.isDeleted) continue;
        const relFolderPath = getFolderPath(note.folderId, folders);
        const folderDir = path.join(notesRootDir, relFolderPath);
        fs.mkdirSync(folderDir, { recursive: true });

        const safeTitle = (note.title || 'Untitled Note').replace(/[/\\?%*:|"<>]/g, '_');
        const notePath = path.join(folderDir, `${safeTitle}.md`);

        const content = note.isLocked
          ? `<!-- LOCKED NOTE -->\n# ${note.title}\n*(This note is password protected)*`
          : simpleHtmlToMarkdown(note.contentHtml);

        fs.writeFileSync(notePath, content, 'utf-8');
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to export notes to folder:', err);
    return false;
  }
}

// IPC Handlers
ipcMain.handle('notes:load-database', async () => {
  const dbPath = getDbPath();
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load database file:', err);
  }
  const initial = getInitialDatabase();
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial database file:', err);
  }
  return initial;
});

ipcMain.handle('notes:save-database', async (_event, data: any) => {
  const dbPath = getDbPath();
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, dbPath);
    return true;
  } catch (err) {
    console.error('Failed to save database file:', err);
    return false;
  }
});

ipcMain.handle('notes:export-all-to-folder', async (_event, data: any) => {
  if (!mainWindow) return false;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Destination Folder to Export Doff Notes (for Apple Notes import)',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return false;
  return exportDatabaseToFolder(data, result.filePaths[0]);
});

ipcMain.handle('notes:export-pdf', async (_event, htmlContent: string, title: string) => {
  if (!mainWindow) return false;

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Note as PDF',
    defaultPath: `${title || 'Note'}.pdf`,
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });

  if (!filePath) return false;

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 40px;
            color: #111;
            line-height: 1.6;
            text-align: left;
          }
          h1, h2, h3 { color: #111; text-align: left; }
          img { max-width: 100%; height: auto; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; }
          pre { background: #f4f4f4; padding: 12px; border-radius: 6px; }
          ul[data-type="taskList"] { list-style: none; padding-left: 0; }
          li[data-type="taskItem"] { display: flex; align-items: center; margin: 4px 0; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);
  try {
    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      margins: { marginType: 'default' },
    });
    fs.writeFileSync(filePath, pdfData);
    printWindow.close();
    return true;
  } catch (err) {
    console.error('PDF export failed:', err);
    printWindow.close();
    return false;
  }
});

ipcMain.handle(
  'notes:save-file',
  async (_event, content: string, defaultFilename: string, extensions: string[]) => {
    if (!mainWindow) return false;
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File',
      defaultPath: defaultFilename,
      filters: [{ name: 'Document', extensions }],
    });
    if (!filePath) return false;
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to save file:', err);
      return false;
    }
  }
);

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
