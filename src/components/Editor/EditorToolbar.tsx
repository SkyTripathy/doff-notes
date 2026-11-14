import React, { useState } from 'react';
import {
  SquarePen,
  Trash2,
  Lock,
  Share,
  Type,
  RotateCcw,
  Download,
  Printer,
  Copy,
  Check,
  Table as TableIcon,
  CheckSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { useNotes } from '../../context/NotesContext';
import { exportPdf, exportMarkdownFile } from '../../services/storage';
import { htmlToMarkdown } from '../../utils/formatters';

interface EditorToolbarProps {
  isRichToolbarOpen: boolean;
  onToggleRichToolbar: () => void;
  onOpenLockModal: (noteId: string) => void;
  onInsertTable?: () => void;
  onInsertChecklist?: () => void;
  onInsertImage?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isRichToolbarOpen,
  onToggleRichToolbar,
  onOpenLockModal,
  onInsertTable,
  onInsertChecklist,
  onInsertImage,
}) => {
  const {
    activeNote,
    createNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    unlockedNotes,
  } = useNotes();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTrash = activeNote?.isDeleted;

  const handleExportPdf = async () => {
    if (!activeNote) return;
    const content = unlockedNotes[activeNote.id] ?? activeNote.contentHtml;
    await exportPdf(content, activeNote.title || 'Note');
    setIsShareOpen(false);
  };

  const handleExportMarkdown = async () => {
    if (!activeNote) return;
    const content = unlockedNotes[activeNote.id] ?? activeNote.contentHtml;
    const md = htmlToMarkdown(content);
    await exportMarkdownFile(md, activeNote.title || 'Note');
    setIsShareOpen(false);
  };

  const handleCopyText = async () => {
    if (!activeNote) return;
    const content = unlockedNotes[activeNote.id] ?? activeNote.contentHtml;
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.innerText || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsShareOpen(false);
  };

  return (
    <div className="editor-toolbar titlebar-drag">
      {/* Left side: Compose / New Note Icon (matching Image 2 & 3) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-drag">
        <button
          className="icon-btn"
          onClick={() => createNote()}
          title="New Note (Ctrl+N)"
          style={{ color: 'var(--text-primary)' }}
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* Right side: Apple Notes Top Bar Tools (Aa, Checklist, Table, Image, Lock, Share) */}
      <div className="editor-toolbar-actions no-drag">
        {isTrash && activeNote ? (
          <>
            <button
              className="apple-btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '12px',
              }}
              onClick={() => restoreNote(activeNote.id)}
            >
              <RotateCcw size={13} />
              <span>Restore</span>
            </button>
            <button
              className="apple-btn"
              style={{
                backgroundColor: '#ef4444',
                padding: '4px 10px',
                fontSize: '12px',
              }}
              onClick={() => permanentlyDeleteNote(activeNote.id)}
            >
              Delete Immediately
            </button>
          </>
        ) : (
          activeNote && (
            <>
              {/* Aa Typography Toolbar Toggle */}
              <button
                className={`icon-btn ${isRichToolbarOpen ? 'active' : ''}`}
                onClick={onToggleRichToolbar}
                title="Formatting (Aa)"
              >
                <Type size={16} />
              </button>

              {/* Checklist shortcut */}
              {onInsertChecklist && (
                <button
                  className="icon-btn"
                  onClick={onInsertChecklist}
                  title="Checklist"
                >
                  <CheckSquare size={16} />
                </button>
              )}

              {/* Table shortcut */}
              {onInsertTable && (
                <button
                  className="icon-btn"
                  onClick={onInsertTable}
                  title="Table"
                >
                  <TableIcon size={16} />
                </button>
              )}

              {/* Image attachment shortcut */}
              {onInsertImage && (
                <button
                  className="icon-btn"
                  onClick={onInsertImage}
                  title="Photos / Attachments"
                >
                  <ImageIcon size={16} />
                </button>
              )}

              {/* Lock Note */}
              <button
                className={`icon-btn ${activeNote.isLocked ? 'active' : ''}`}
                onClick={() => onOpenLockModal(activeNote.id)}
                title={activeNote.isLocked ? 'Note is Locked' : 'Lock Note'}
              >
                <Lock size={15} color={activeNote.isLocked ? 'var(--accent)' : undefined} />
              </button>

              {/* Share & Export */}
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => setIsShareOpen(!isShareOpen)}
                  title="Export & Share"
                >
                  <Share size={15} />
                </button>

                {isShareOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '36px',
                      backgroundColor: 'var(--bg-window)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-md)',
                      borderRadius: '8px',
                      zIndex: 100,
                      padding: '4px',
                      minWidth: '200px',
                    }}
                    onMouseLeave={() => setIsShareOpen(false)}
                  >
                    <button
                      className="sidebar-item"
                      style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                      onClick={handleExportPdf}
                    >
                      <Printer size={13} />
                      <span>Export as PDF</span>
                    </button>
                    <button
                      className="sidebar-item"
                      style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                      onClick={handleExportMarkdown}
                    >
                      <Download size={13} />
                      <span>Export Markdown (.md)</span>
                    </button>
                    <button
                      className="sidebar-item"
                      style={{ width: '100%', fontSize: '12px', padding: '6px 10px' }}
                      onClick={handleCopyText}
                    >
                      {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied!' : 'Copy Plain Text'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Delete Note */}
              <button
                className="icon-btn"
                onClick={() => deleteNote(activeNote.id)}
                title="Delete Note"
              >
                <Trash2 size={15} />
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
};
