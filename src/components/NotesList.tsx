import React, { useState } from 'react';
import {
  Search,
  X,
  Pin,
  Lock,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  FolderInput,
  SquarePen,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { Note } from '../types/note';
import { formatNoteDate } from '../utils/formatters';

interface NotesListProps {
  onOpenLockModal: (noteId: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({ onOpenLockModal }) => {
  const {
    filteredNotes,
    pinnedNotes,
    unpinnedNotes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    searchQuery,
    setSearchQuery,
    settings,
    setViewMode,
    togglePin,
    deleteNote,
    moveNoteToFolder,
    folders,
    sidebarSelection,
    emptyTrash,
  } = useNotes();

  const [contextMenuNoteId, setContextMenuNoteId] = useState<string | null>(null);

  const isTrash = sidebarSelection.type === 'trash';

  // Group unpinned notes by time periods (like Apple Notes: Previous 7 Days, 2024, etc.)
  const groupedUnpinned = React.useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const prev7Days: Note[] = [];
    const prev30Days: Note[] = [];
    const older: Record<string, Note[]> = {};

    unpinnedNotes.forEach((n) => {
      const d = new Date(n.updatedAt);
      if (d >= sevenDaysAgo) {
        prev7Days.push(n);
      } else if (d >= thirtyDaysAgo) {
        prev30Days.push(n);
      } else {
        const year = d.getFullYear().toString();
        if (!older[year]) older[year] = [];
        older[year].push(n);
      }
    });

    return { prev7Days, prev30Days, older };
  }, [unpinnedNotes]);

  const renderNoteCard = (note: Note) => {
    const isActive = activeNoteId === note.id;

    return (
      <div
        key={note.id}
        className={`note-card ${isActive ? 'active' : ''}`}
        onClick={() => setActiveNoteId(note.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenuNoteId(note.id);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="note-card-title">
              {note.isPinned && <Pin size={12} color="var(--accent)" fill="var(--accent)" />}
              {note.isLocked && <Lock size={12} color="var(--accent)" />}
              <span>{note.title || 'New Note'}</span>
            </div>

            <div className="note-card-meta">
              <span className="note-card-date">{formatNoteDate(note.updatedAt)}</span>
              <span className="note-card-snippet">
                {note.isLocked ? 'Locked note' : note.snippet || 'No additional text'}
              </span>
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="note-tags">
                {note.tags.map((t) => (
                  <span key={t} className="tag-pill">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail preview on right (Apple Notes style) */}
          {note.thumbnail && (
            <img
              src={note.thumbnail}
              alt=""
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'cover',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            />
          )}
        </div>

        {/* Note Context Menu */}
        {contextMenuNoteId === note.id && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '32px',
              backgroundColor: 'var(--bg-window)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              borderRadius: '8px',
              zIndex: 60,
              padding: '4px',
              minWidth: '150px',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setContextMenuNoteId(null)}
          >
            {!isTrash && (
              <>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                  className="sidebar-item"
                  onClick={() => {
                    togglePin(note.id);
                    setContextMenuNoteId(null);
                  }}
                >
                  <Pin size={13} />
                  <span>{note.isPinned ? 'Unpin Note' : 'Pin Note'}</span>
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                  className="sidebar-item"
                  onClick={() => {
                    onOpenLockModal(note.id);
                    setContextMenuNoteId(null);
                  }}
                >
                  <Lock size={13} />
                  <span>{note.isLocked ? 'Lock Options' : 'Lock Note'}</span>
                </button>

                {folders.length > 1 && (
                  <div style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Move to:
                    {folders
                      .filter((f) => f.id !== note.folderId)
                      .map((f) => (
                        <button
                          key={f.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: '100%',
                            padding: '4px 6px',
                            fontSize: '12px',
                            marginTop: '2px',
                          }}
                          className="sidebar-item"
                          onClick={() => {
                            moveNoteToFolder(note.id, f.id);
                            setContextMenuNoteId(null);
                          }}
                        >
                          <FolderInput size={12} />
                          <span>{f.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                color: '#ef4444',
              }}
              className="sidebar-item"
              onClick={() => {
                deleteNote(note.id);
                setContextMenuNoteId(null);
              }}
            >
              <Trash2 size={13} />
              <span>{isTrash ? 'Delete Permanently' : 'Delete Note'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="notes-pane">
      {/* Top Header - Exact Apple Notes Toolbar */}
      <div className="notes-header titlebar-drag">
        {/* View Switchers & Trash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="no-drag">
          <button
            className={`icon-btn ${settings.viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <ListIcon size={16} />
          </button>
          <button
            className={`icon-btn ${settings.viewMode === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewMode('gallery')}
            title="Gallery View"
          >
            <LayoutGrid size={16} />
          </button>
          {activeNoteId && (
            <button
              className="icon-btn"
              onClick={() => deleteNote(activeNoteId)}
              title="Delete Note"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="search-box no-drag">
          <Search size={13} color="var(--text-secondary)" />
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <X size={12} color="var(--text-secondary)" />
            </button>
          )}
        </div>

        {/* Quick Compose Button */}
        <button
          className="icon-btn primary no-drag"
          onClick={() => createNote()}
          title="Create New Note (Ctrl+N)"
          style={{
            backgroundColor: 'rgba(212, 155, 41, 0.14)',
            color: 'var(--accent)',
            borderRadius: '6px',
            flexShrink: 0,
          }}
        >
          <SquarePen size={15} />
        </button>
      </div>

      {/* Trash Header Banner */}
      {isTrash && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            Notes are deleted permanently after 30 days
          </span>
          {filteredNotes.length > 0 && (
            <button
              style={{
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
              onClick={emptyTrash}
            >
              Empty Trash
            </button>
          )}
        </div>
      )}

      {/* Notes List Content */}
      <div className="notes-list no-drag">
        {filteredNotes.length === 0 ? (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>{searchQuery ? 'No matching notes found' : 'No Notes'}</span>
            {!searchQuery && (
              <button
                className="apple-btn"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => createNote()}
              >
                + Create Note
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div className="section-label">Pinned</div>
                {pinnedNotes.map(renderNoteCard)}
              </div>
            )}

            {/* Grouped by Date (Apple Notes Style) */}
            {groupedUnpinned.prev7Days.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div className="section-label">Previous 7 Days</div>
                {groupedUnpinned.prev7Days.map(renderNoteCard)}
              </div>
            )}

            {groupedUnpinned.prev30Days.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div className="section-label">Previous 30 Days</div>
                {groupedUnpinned.prev30Days.map(renderNoteCard)}
              </div>
            )}

            {Object.entries(groupedUnpinned.older).map(([year, notesInYear]) => (
              <div key={year} style={{ marginBottom: '8px' }}>
                <div className="section-label">{year}</div>
                {notesInYear.map(renderNoteCard)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
