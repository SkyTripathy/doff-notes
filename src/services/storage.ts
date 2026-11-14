import { NotesDatabase } from '../types/note';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      loadDatabase: () => Promise<NotesDatabase>;
      saveDatabase: (data: NotesDatabase) => Promise<boolean>;
      exportPdf: (htmlContent: string, title: string) => Promise<boolean>;
      saveFile: (content: string, defaultFilename: string, extensions: string[]) => Promise<boolean>;
      exportAllToFolder: (data: unknown) => Promise<boolean>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}

const STORAGE_KEY = 'doff_notes_local_db_v1';

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

const DEFAULT_DB: NotesDatabase = {
  version: 1,
  folders: [
    { id: 'notes-default', name: 'Notes', parentId: null, isExpanded: true, createdAt: Date.now(), order: 0 },
    { id: 'folder-projects', name: '1 Projects', parentId: null, isExpanded: true, createdAt: Date.now() + 1, order: 1 },
    { id: 'folder-coding', name: 'Coding', parentId: 'folder-projects', isExpanded: true, createdAt: Date.now() + 2, order: 2 },
    { id: 'folder-work', name: 'Work', parentId: null, isExpanded: true, createdAt: Date.now() + 3, order: 3 },
    { id: 'folder-personal', name: 'Personal', parentId: null, isExpanded: true, createdAt: Date.now() + 4, order: 4 },
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
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

export async function loadDatabase(): Promise<NotesDatabase> {
  if (isElectron() && window.electronAPI) {
    try {
      const data = await window.electronAPI.loadDatabase();
      if (data && typeof data === 'object') {
        return {
          ...DEFAULT_DB,
          ...data,
          settings: { ...DEFAULT_DB.settings, ...(data.settings || {}) },
        };
      }
    } catch (err) {
      console.error('Failed to load from electron API:', err);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DB,
        ...parsed,
        settings: { ...DEFAULT_DB.settings, ...(parsed.settings || {}) },
      };
    }
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
  }

  return DEFAULT_DB;
}

export async function saveDatabase(db: NotesDatabase): Promise<boolean> {
  if (isElectron() && window.electronAPI) {
    try {
      return await window.electronAPI.saveDatabase(db);
    } catch (err) {
      console.error('Failed to save via electron API:', err);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

export async function exportAllToFolder(db: NotesDatabase): Promise<boolean> {
  if (isElectron() && window.electronAPI && typeof window.electronAPI.exportAllToFolder === 'function') {
    return window.electronAPI.exportAllToFolder(db);
  }
  return false;
}

export async function exportPdf(htmlContent: string, title: string): Promise<boolean> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.exportPdf(htmlContent, title);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; text-align: left; }
          h1, h2, h3 { color: #111; text-align: left; }
          img { max-width: 100%; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  return true;
}

export async function exportMarkdownFile(markdown: string, title: string): Promise<boolean> {
  const filename = `${title.replace(/[/\\?%*:|"<>]/g, '-') || 'Note'}.md`;

  if (isElectron() && window.electronAPI) {
    return window.electronAPI.saveFile(markdown, filename, ['md', 'markdown']);
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
