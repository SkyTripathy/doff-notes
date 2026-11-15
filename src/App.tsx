import React, { useState, useEffect } from 'react';
import { NotesProvider, useNotes } from './context/NotesContext';
import { Sidebar } from './components/Sidebar';
import { NotesList } from './components/NotesList';
import { NoteEditor } from './components/Editor/NoteEditor';
import { LockNoteModal } from './components/Modals/LockNoteModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { Minus, Square, X } from 'lucide-react';
import { isElectron } from './services/storage';

const MainLayout: React.FC = () => {
  const {
    isSidebarOpen,
    isNotesListOpen,
    isFocusMode,
    createNote,
    toggleSidebar,
    toggleNotesList,
    toggleFocusMode,
    setIsFocusMode,
  } = useNotes();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lockModalNoteId, setLockModalNoteId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      }
      // Ctrl+\: Toggle Folder Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+Shift+L: Toggle Notes List
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleNotesList();
      }
      // Ctrl+Shift+F: Toggle Focus Mode (Pure Note Writing)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFocusMode();
      }
      // Escape: Exit Focus Mode if active
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, toggleSidebar, toggleNotesList, toggleFocusMode, isFocusMode, setIsFocusMode]);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => window.electronAPI?.maximizeWindow();
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <div className={`app-container ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* 3-Pane Apple Notes Architecture with smooth collapse */}
      {isSidebarOpen && !isFocusMode && (
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      {isNotesListOpen && !isFocusMode && (
        <NotesList onOpenLockModal={(id) => setLockModalNoteId(id)} />
      )}

      <NoteEditor onOpenLockModal={(id) => setLockModalNoteId(id)} />

      {/* Seamless Windows Controls (dynamically styled, no black box mismatch) */}
      {isElectron() && (
        <div className="win-controls no-drag">
          <button
            className="win-control-btn"
            onClick={handleMinimize}
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            className="win-control-btn"
            onClick={handleMaximize}
            title="Maximize"
          >
            <Square size={11} />
          </button>
          <button
            className="win-control-btn close"
            onClick={handleClose}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modals */}
      {lockModalNoteId && (
        <LockNoteModal
          noteId={lockModalNoteId}
          onClose={() => setLockModalNoteId(null)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <NotesProvider>
      <MainLayout />
    </NotesProvider>
  );
};

export default App;
