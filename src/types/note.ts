export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  isExpanded?: boolean;
  createdAt: number;
  order: number;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  snippet: string;
  contentHtml: string;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt: number | null;
  isLocked: boolean;
  encryptedPayload?: EncryptedPayload | null;
  tags: string[];
  thumbnail?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type NoteSortBy = 'updatedAt' | 'createdAt' | 'title';
export type SortDirection = 'desc' | 'asc';
export type ViewMode = 'list' | 'gallery';
export type ThemeMode = 'light' | 'dark' | 'system';

export type SidebarSelection =
  | { type: 'all' }
  | { type: 'quick-notes' }
  | { type: 'folder'; folderId: string }
  | { type: 'tag'; tag: string }
  | { type: 'trash' };

export interface AppSettings {
  theme: ThemeMode;
  sortBy: NoteSortBy;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  lockVerifier?: EncryptedPayload | null;
  lockHint?: string;
}

export interface NotesDatabase {
  version: number;
  folders: Folder[];
  notes: Note[];
  settings: AppSettings;
}
