import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Folder,
  Note,
  NotesDatabase,
  SidebarSelection,
  ThemeMode,
  NoteSortBy,
  SortDirection,
  ViewMode,
  AppSettings,
} from '../types/note';
import { loadDatabase, saveDatabase } from '../services/storage';
import {
  encryptData,
  decryptData,
  createPasswordVerifier,
} from '../utils/crypto';
import { extractNoteMetadata } from '../utils/formatters';

interface NotesContextType {
  notes: Note[];
  folders: Folder[];
  settings: AppSettings;
  sidebarSelection: SidebarSelection;
  activeNoteId: string | null;
  activeNote: Note | null;
  searchQuery: string;
  isSidebarOpen: boolean;
  isNotesListOpen: boolean;
  isFocusMode: boolean;
  unlockedNotes: Record<string, string>;

  // Navigation & selection
  setSidebarSelection: (selection: SidebarSelection) => void;
  setActiveNoteId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsNotesListOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsFocusMode: (focus: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  toggleNotesList: () => void;
  toggleFocusMode: () => void;
  addTagToNote: (noteId: string, tag: string) => void;
  removeTagFromNote: (noteId: string, tag: string) => void;

  // Notes operations
  createNote: (folderId?: string) => Note;
  updateNoteContent: (noteId: string, contentHtml: string) => void;
  togglePin: (noteId: string) => void;
  deleteNote: (noteId: string) => void;
  restoreNote: (noteId: string) => void;
  permanentlyDeleteNote: (noteId: string) => void;
  emptyTrash: () => void;
  moveNoteToFolder: (noteId: string, folderId: string) => void;

  // Lock & Security
  lockNote: (noteId: string, password: string, hint?: string) => Promise<boolean>;
  unlockNote: (noteId: string, password: string) => Promise<boolean>;
  removeNoteLock: (noteId: string, password: string) => Promise<boolean>;
  isMasterPasswordSet: boolean;

  // Folder & Subfolder operations
  createFolder: (name: string, parentId?: string | null) => Folder;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderExpanded: (folderId: string) => void;

  // Settings & Preferences
  setTheme: (theme: ThemeMode) => void;
  setSortBy: (sortBy: NoteSortBy, sortDirection?: SortDirection) => void;
  setViewMode: (mode: ViewMode) => void;

  // Filtered & grouped notes
  filteredNotes: Note[];
  pinnedNotes: Note[];
  unpinnedNotes: Note[];
  tags: { tag: string; count: number }[];
  noteCounts: {
    all: number;
    quickNotes: number;
    trash: number;
    byFolder: Record<string, number>;
  };
}

const NotesContext = createContext<NotesContextType | null>(null);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    viewMode: 'list',
    lockVerifier: null,
    lockHint: '',
  });

  const [sidebarSelection, setSidebarSelection] = useState<SidebarSelection>({ type: 'all' });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotesListOpen, setIsNotesListOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [unlockedNotes, setUnlockedNotes] = useState<Record<string, string>>({});

  // Initial load
  useEffect(() => {
    loadDatabase().then((db) => {
      const initialFolders =
        db.folders && db.folders.length > 0
          ? db.folders
          : [
              { id: 'notes-default', name: 'Notes', parentId: null, isExpanded: true, createdAt: Date.now(), order: 0 },
              { id: 'folder-projects', name: '1 Projects', parentId: null, isExpanded: true, createdAt: Date.now() + 1, order: 1 },
              { id: 'folder-coding', name: 'Coding', parentId: 'folder-projects', isExpanded: true, createdAt: Date.now() + 2, order: 2 },
              { id: 'folder-work', name: 'Work', parentId: null, isExpanded: true, createdAt: Date.now() + 3, order: 3 },
              { id: 'folder-personal', name: 'Personal', parentId: null, isExpanded: true, createdAt: Date.now() + 4, order: 4 },
            ];

      setFolders(initialFolders);
      setNotes(db.notes || []);
      setSettings(db.settings || {
        theme: 'system',
        sortBy: 'updatedAt',
        sortDirection: 'desc',
        viewMode: 'list',
        lockVerifier: null,
        lockHint: '',
        gdriveSyncEnabled: false,
        gdrivePath: '',
        lastSyncedAt: null,
      });
      if (db.notes && db.notes.length > 0) {
        const firstActive = db.notes.find((n) => !n.isDeleted);
        if (firstActive) {
          setActiveNoteId(firstActive.id);
        }
      }
      setDbLoaded(true);
    });
  }, []);

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme() {
      const isDark =
        settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Persist to database
  useEffect(() => {
    if (!dbLoaded) return;
    const currentDb: NotesDatabase = {
      version: 1,
      folders,
      notes,
      settings,
    };
    saveDatabase(currentDb);
  }, [folders, notes, settings, dbLoaded]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Folder note counts (including subfolders)
  const noteCounts = useMemo(() => {
    const nonDeleted = notes.filter((n) => !n.isDeleted);
    const trash = notes.filter((n) => n.isDeleted).length;
    const byFolder: Record<string, number> = {};

    nonDeleted.forEach((n) => {
      byFolder[n.folderId] = (byFolder[n.folderId] || 0) + 1;
    });

    return {
      all: nonDeleted.length,
      quickNotes: nonDeleted.filter((n) => n.folderId === 'quick-notes').length,
      trash,
      byFolder,
    };
  }, [notes]);

  // Tags aggregation
  const tags = useMemo(() => {
    const counts: Record<string, number> = {};
    notes
      .filter((n) => !n.isDeleted)
      .forEach((n) => {
        n.tags?.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  // Filtered notes based on sidebar selection & search query
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Sidebar filter
    if (sidebarSelection.type === 'trash') {
      result = result.filter((n) => n.isDeleted);
    } else {
      result = result.filter((n) => !n.isDeleted);
      if (sidebarSelection.type === 'quick-notes') {
        result = result.filter((n) => n.folderId === 'quick-notes');
      } else if (sidebarSelection.type === 'folder') {
        // Collect this folder and any descendant subfolders
        const targetFolderId = sidebarSelection.folderId;
        const subfolderIds = new Set<string>([targetFolderId]);
        
        let addedNew = true;
        while (addedNew) {
          addedNew = false;
          for (const f of folders) {
            if (f.parentId && subfolderIds.has(f.parentId) && !subfolderIds.has(f.id)) {
              subfolderIds.add(f.id);
              addedNew = true;
            }
          }
        }
        result = result.filter((n) => subfolderIds.has(n.folderId));
      } else if (sidebarSelection.type === 'tag') {
        result = result.filter((n) => n.tags?.includes(sidebarSelection.tag));
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(q);
        const snippetMatch = n.snippet.toLowerCase().includes(q);
        const tagMatch = n.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || snippetMatch || tagMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (settings.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (settings.sortBy === 'createdAt') {
        comparison = a.createdAt - b.createdAt;
      } else {
        comparison = a.updatedAt - b.updatedAt;
      }
      return settings.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [notes, sidebarSelection, searchQuery, settings.sortBy, settings.sortDirection, folders]);

  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter((n) => n.isPinned);
  }, [filteredNotes]);

  const unpinnedNotes = useMemo(() => {
    return filteredNotes.filter((n) => !n.isPinned);
  }, [filteredNotes]);

  // Actions
  const createNote = useCallback(
    (folderId?: string): Note => {
      let targetFolderId = folderId;
      if (!targetFolderId) {
        if (sidebarSelection.type === 'folder') {
          targetFolderId = sidebarSelection.folderId;
        } else if (sidebarSelection.type === 'quick-notes') {
          targetFolderId = 'quick-notes';
        } else {
          targetFolderId = folders[0]?.id || 'notes-default';
        }
      }

      // If viewing Trash or Tag, automatically switch back to All Notes so the new note is immediately visible
      if (sidebarSelection.type === 'trash' || sidebarSelection.type === 'tag') {
        setSidebarSelection({ type: 'all' });
      }

      setSearchQuery('');

      const now = Date.now();
      const newNote: Note = {
        id: `note-${now}-${Math.random().toString(36).substring(2, 7)}`,
        folderId: targetFolderId,
        title: 'New Note',
        snippet: 'No additional text',
        contentHtml: '<h1>New Note</h1><p></p>',
        isPinned: false,
        isDeleted: false,
        deletedAt: null,
        isLocked: false,
        tags: [],
        thumbnail: null,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      return newNote;
    },
    [folders, sidebarSelection]
  );

  const updateNoteContent = useCallback(
    (noteId: string, contentHtml: string) => {
      const meta = extractNoteMetadata(contentHtml);
      const now = Date.now();

      setNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          // Keep manually added tags + automatically parsed hashtags from text
          const mergedTags = Array.from(new Set([...(n.tags || []), ...meta.tags]));
          return {
            ...n,
            title: meta.title,
            snippet: meta.snippet,
            tags: mergedTags,
            thumbnail: meta.thumbnail,
            contentHtml: n.isLocked ? n.contentHtml : contentHtml,
            updatedAt: now,
          };
        })
      );

      setUnlockedNotes((prev) => {
        if (prev[noteId] !== undefined) {
          return { ...prev, [noteId]: contentHtml };
        }
        return prev;
      });
    },
    []
  );

  const addTagToNote = useCallback((noteId: string, rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');
    if (!clean) return;

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const currentTags = n.tags || [];
        if (currentTags.includes(clean)) return n;
        return {
          ...n,
          tags: [...currentTags, clean],
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const removeTagFromNote = useCallback((noteId: string, rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/^#+/, '');
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          tags: (n.tags || []).filter((t) => t.toLowerCase() !== clean),
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const toggleNotesList = useCallback(() => {
    setIsNotesListOpen((prev) => !prev);
  }, []);

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const togglePin = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, isPinned: !n.isPinned } : n))
    );
  }, []);

  const deleteNote = useCallback(
    (noteId: string) => {
      const now = Date.now();
      setNotes((prev) => {
        const target = prev.find((n) => n.id === noteId);
        if (!target) return prev;

        if (target.isDeleted) {
          return prev.filter((n) => n.id !== noteId);
        }

        return prev.map((n) =>
          n.id === noteId ? { ...n, isDeleted: true, deletedAt: now } : n
        );
      });

      setActiveNoteId((prevActive) => {
        if (prevActive === noteId) {
          const remaining = notes.filter((n) => n.id !== noteId && !n.isDeleted);
          return remaining[0]?.id || null;
        }
        return prevActive;
      });
    },
    [notes]
  );

  const restoreNote = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isDeleted: false, deletedAt: null } : n
      )
    );
  }, []);

  const permanentlyDeleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setActiveNoteId((curr) => (curr === noteId ? null : curr));
  }, []);

  const emptyTrash = useCallback(() => {
    setNotes((prev) => prev.filter((n) => !n.isDeleted));
    if (sidebarSelection.type === 'trash') {
      setActiveNoteId(null);
    }
  }, [sidebarSelection]);

  const moveNoteToFolder = useCallback((noteId: string, folderId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, folderId, updatedAt: Date.now() } : n))
    );
  }, []);

  // Lock and security
  const lockNote = useCallback(
    async (noteId: string, password: string, hint?: string): Promise<boolean> => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return false;

      const rawHtml = unlockedNotes[noteId] ?? note.contentHtml;
      const encrypted = await encryptData(rawHtml, password);

      let verifier = settings.lockVerifier;
      if (!verifier) {
        verifier = await createPasswordVerifier(password);
      }

      setSettings((prev) => ({
        ...prev,
        lockVerifier: verifier,
        lockHint: hint || prev.lockHint,
      }));

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                isLocked: true,
                encryptedPayload: encrypted,
                contentHtml: '',
              }
            : n
        )
      );

      setUnlockedNotes((prev) => ({ ...prev, [noteId]: rawHtml }));
      return true;
    },
    [notes, unlockedNotes, settings.lockVerifier]
  );

  const unlockNote = useCallback(
    async (noteId: string, password: string): Promise<boolean> => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.encryptedPayload) return false;

      try {
        const decryptedHtml = await decryptData(note.encryptedPayload, password);
        setUnlockedNotes((prev) => ({ ...prev, [noteId]: decryptedHtml }));
        return true;
      } catch {
        return false;
      }
    },
    [notes]
  );

  const removeNoteLock = useCallback(
    async (noteId: string, password: string): Promise<boolean> => {
      const note = notes.find((n) => n.id === noteId);
      if (!note || !note.encryptedPayload) return false;

      try {
        const decryptedHtml = await decryptData(note.encryptedPayload, password);
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  isLocked: false,
                  encryptedPayload: null,
                  contentHtml: decryptedHtml,
                }
              : n
          )
        );
        setUnlockedNotes((prev) => {
          const next = { ...prev };
          delete next[noteId];
          return next;
        });
        return true;
      } catch {
        return false;
      }
    },
    [notes]
  );

  // Folder & Subfolder creation
  const createFolder = useCallback((name: string, parentId?: string | null): Folder => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'New Folder',
      parentId: parentId || null,
      isExpanded: true,
      createdAt: Date.now(),
      order: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
    );
  }, []);

  const toggleFolderExpanded = useCallback((folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f))
    );
  }, []);

  const deleteFolder = useCallback(
    (folderId: string) => {
      const fallbackId = folders.find((f) => f.id !== folderId && !f.parentId)?.id || 'notes-default';
      setNotes((prev) =>
        prev.map((n) => (n.folderId === folderId ? { ...n, folderId: fallbackId } : n))
      );
      // Remove folder and any subfolders
      setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
      if (
        sidebarSelection.type === 'folder' &&
        sidebarSelection.folderId === folderId
      ) {
        setSidebarSelection({ type: 'all' });
      }
    },
    [folders, sidebarSelection]
  );

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const setSortBy = useCallback(
    (sortBy: NoteSortBy, sortDirection?: SortDirection) => {
      setSettings((prev) => ({
        ...prev,
        sortBy,
        sortDirection: sortDirection ?? (sortBy === 'title' ? 'asc' : 'desc'),
      }));
    },
    []
  );

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setSettings((prev) => ({ ...prev, viewMode }));
  }, []);

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        settings,
        sidebarSelection,
        activeNoteId,
        activeNote,
        searchQuery,
        isSidebarOpen,
        isNotesListOpen,
        isFocusMode,
        unlockedNotes,
        setSidebarSelection,
        setActiveNoteId,
        setSearchQuery,
        setIsSidebarOpen,
        setIsNotesListOpen,
        setIsFocusMode,
        toggleSidebar,
        toggleNotesList,
        toggleFocusMode,
        addTagToNote,
        removeTagFromNote,
        createNote,
        updateNoteContent,
        togglePin,
        deleteNote,
        restoreNote,
        permanentlyDeleteNote,
        emptyTrash,
        moveNoteToFolder,
        lockNote,
        unlockNote,
        removeNoteLock,
        isMasterPasswordSet: !!settings.lockVerifier,
        createFolder,
        renameFolder,
        deleteFolder,
        toggleFolderExpanded,
        setTheme,
        setSortBy,
        setViewMode,
        filteredNotes,
        pinnedNotes,
        unpinnedNotes,
        tags,
        noteCounts,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export function useNotes(): NotesContextType {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
