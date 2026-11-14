import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Lock, FileText, AlertTriangle, KeyRound, Eye, EyeOff, Plus } from 'lucide-react';

import { useNotes } from '../../context/NotesContext';
import { EditorToolbar } from './EditorToolbar';
import { RichTextToolbar } from './RichTextToolbar';
import { formatEditorHeaderDate } from '../../utils/formatters';
import { ErrorBoundary } from '../ErrorBoundary';

interface NoteEditorProps {
  onOpenLockModal: (noteId: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ onOpenLockModal }) => {
  const {
    activeNote,
    createNote,
    updateNoteContent,
    unlockedNotes,
    unlockNote,
    settings,
    restoreNote,
    permanentlyDeleteNote,
  } = useNotes();

  const [isRichToolbarOpen, setIsRichToolbarOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeNoteRef = useRef(activeNote);
  activeNoteRef.current = activeNote;

  const isSettingContentRef = useRef(false);
  const lastLoadedNoteId = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isNoteLocked = Boolean(activeNote?.isLocked && !unlockedNotes[activeNote.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Title or start writing...',
      }),
    ],
    content: activeNote ? (unlockedNotes[activeNote.id] ?? activeNote.contentHtml ?? '') : '',
    onUpdate: ({ editor: ed }) => {
      if (isSettingContentRef.current) return;
      const currentNote = activeNoteRef.current;
      if (!currentNote) return;

      const html = ed.getHTML();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateNoteContent(currentNote.id, html);
      }, 150);
    },
  });

  // Load content smoothly when switching notes or when note is unlocked
  useEffect(() => {
    if (!editor) return;

    if (!activeNote || isNoteLocked) {
      lastLoadedNoteId.current = null;
      return;
    }

    if (lastLoadedNoteId.current !== activeNote.id) {
      lastLoadedNoteId.current = activeNote.id;
      const targetContent = unlockedNotes[activeNote.id] ?? activeNote.contentHtml ?? '';

      isSettingContentRef.current = true;
      try {
        editor.commands.setContent(targetContent || '<h1>New Note</h1><p></p>', false);
      } catch (err) {
        console.error('Error setting editor content:', err);
      }
      setTimeout(() => {
        isSettingContentRef.current = false;
        editor.commands.focus('end');
      }, 50);
    }
  }, [activeNote?.id, isNoteLocked, unlockedNotes, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !unlockPassword) return;

    setIsUnlocking(true);
    setUnlockError(null);
    const success = await unlockNote(activeNote.id, unlockPassword);
    setIsUnlocking(false);

    if (success) {
      setUnlockPassword('');
    } else {
      setUnlockError('Incorrect password. Please try again.');
    }
  };

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  // Empty state when no note is selected
  if (!activeNote) {
    return (
      <div className="editor-pane">
        <EditorToolbar
          isRichToolbarOpen={false}
          onToggleRichToolbar={() => {}}
          onOpenLockModal={() => {}}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 155, 41, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <FileText size={32} />
          </div>
          <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Note Selected
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', textAlign: 'center' }}>
            Choose a note from the list on the left, or create a new note to start writing.
          </div>
          <button
            className="apple-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            onClick={() => createNote()}
          >
            <Plus size={16} />
            <span>Create New Note</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Editor encountered an issue">
      <div className="editor-pane">
        {/* Top Main Toolbar */}
        <EditorToolbar
          isRichToolbarOpen={isRichToolbarOpen}
          onToggleRichToolbar={() => setIsRichToolbarOpen(!isRichToolbarOpen)}
          onOpenLockModal={onOpenLockModal}
          onInsertChecklist={() => editor?.chain().focus().toggleTaskList().run()}
          onInsertTable={() =>
            editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          onInsertImage={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleInsertImage}
        />

        {/* Formatting Toolbar */}
        {isRichToolbarOpen && !isNoteLocked && <RichTextToolbar editor={editor} />}

        {/* Trash Banner if in trash */}
        {activeNote.isDeleted && (
          <div className="trash-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} />
              <span>This note is in Recently Deleted.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                style={{ fontWeight: 600, fontSize: '12px', textDecoration: 'underline' }}
                onClick={() => restoreNote(activeNote.id)}
              >
                Restore Note
              </button>
              <button
                style={{ fontWeight: 600, fontSize: '12px', textDecoration: 'underline' }}
                onClick={() => permanentlyDeleteNote(activeNote.id)}
              >
                Delete Immediately
              </button>
            </div>
          </div>
        )}

        {/* Locked Note Screen */}
        {isNoteLocked ? (
          <div className="locked-screen">
            <div className="lock-badge">
              <Lock size={32} />
            </div>
            <h2 className="lock-title">This note is locked.</h2>
            <p className="lock-subtitle">
              Enter the password to view and edit this encrypted note.
            </p>

            <form className="lock-form" onSubmit={handleUnlockSubmit}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  className="lock-input"
                  style={{ width: '100%', paddingRight: '36px' }}
                  placeholder="Password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {settings.lockHint && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Hint: {settings.lockHint}
                </div>
              )}

              {unlockError && (
                <div style={{ fontSize: '12px', color: '#ef4444' }}>{unlockError}</div>
              )}

              <button
                type="submit"
                className="apple-btn"
                disabled={isUnlocking}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <KeyRound size={14} />
                <span>{isUnlocking ? 'Unlocking...' : 'View Note'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Rich Text Editor Container - Left Aligned text canvas */
          <div
            className="editor-content-container"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                editor?.commands.focus('end');
              }
            }}
          >
            {/* Top Right Date Stamp (Apple Notes Style) */}
            <div className="editor-date-stamp">
              {formatEditorHeaderDate(activeNote.updatedAt)}
            </div>

            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
