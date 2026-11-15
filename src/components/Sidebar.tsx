import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  FileText,
  Zap,
  Trash2,
  FolderPlus,
  Settings as SettingsIcon,
  Hash,
  MoreHorizontal,
  Edit2,
  Trash,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  NotebookTabs,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { Folder, SidebarSelection } from '../types/note';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const {
    folders,
    sidebarSelection,
    setSidebarSelection,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleFolderExpanded,
    tags,
    noteCounts,
  } = useNotes();

  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false);
  const [creatingSubfolderParentId, setCreatingSubfolderParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [contextFolderId, setContextFolderId] = useState<string | null>(null);

  const handleFinishCreate = (parentId?: string | null) => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), parentId);
    }
    setIsCreatingRootFolder(false);
    setCreatingSubfolderParentId(null);
    setNewFolderName('');
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingFolderId(id);
    setEditingFolderName(currentName);
    setContextFolderId(null);
  };

  const handleFinishRename = (id: string) => {
    if (editingFolderName.trim()) {
      renameFolder(id, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };

  const isSelected = (sel: SidebarSelection) => {
    if (sel.type === 'all' && sidebarSelection.type === 'all') return true;
    if (sel.type === 'quick-notes' && sidebarSelection.type === 'quick-notes') return true;
    if (sel.type === 'trash' && sidebarSelection.type === 'trash') return true;
    if (
      sel.type === 'folder' &&
      sidebarSelection.type === 'folder' &&
      sel.folderId === sidebarSelection.folderId
    )
      return true;
    if (
      sel.type === 'tag' &&
      sidebarSelection.type === 'tag' &&
      sel.tag === sidebarSelection.tag
    )
      return true;
    return false;
  };

  const renderFolderItem = (folder: Folder, depth = 0) => {
    const count = noteCounts.byFolder[folder.id] || 0;
    const isFolderActive = isSelected({ type: 'folder', folderId: folder.id });
    const subfolders = folders.filter((f) => f.parentId === folder.id);
    const hasSubfolders = subfolders.length > 0;
    const isExpanded = folder.isExpanded ?? true;

    if (editingFolderId === folder.id) {
      return (
        <div
          key={folder.id}
          style={{
            padding: '4px 8px',
            paddingLeft: `${depth * 14 + 10}px`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <FolderIcon size={15} color="var(--accent)" />
          <input
            type="text"
            autoFocus
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            onBlur={() => handleFinishRename(folder.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishRename(folder.id);
              if (e.key === 'Escape') setEditingFolderId(null);
            }}
            style={{
              flex: 1,
              fontSize: '13px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--accent)',
              backgroundColor: 'var(--bg-editor)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      );
    }

    return (
      <React.Fragment key={folder.id}>
        <div
          className={`sidebar-item ${isFolderActive ? 'active' : ''}`}
          onClick={() => setSidebarSelection({ type: 'folder', folderId: folder.id })}
          style={{
            paddingLeft: `${depth * 14 + 8}px`,
            position: 'relative',
          }}
        >
          <div className="sidebar-item-left">
            {hasSubfolders ? (
              <span
                className="sidebar-chevron"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpanded(folder.id);
                }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span style={{ width: '14px' }} />
            )}

            <FolderIcon size={15} color={isFolderActive ? '#ffffff' : 'var(--accent)'} />
            <span title={folder.name}>{folder.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="sidebar-item-badge">{count}</span>
            <button
              className="icon-btn"
              style={{
                width: '20px',
                height: '20px',
                padding: 0,
                color: isFolderActive ? '#ffffff' : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setContextFolderId(contextFolderId === folder.id ? null : folder.id);
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {contextFolderId === folder.id && (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '28px',
                backgroundColor: 'var(--bg-window)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                borderRadius: '8px',
                zIndex: 100,
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: '140px',
                color: 'var(--text-primary)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  textAlign: 'left',
                }}
                className="sidebar-item"
                onClick={() => {
                  setCreatingSubfolderParentId(folder.id);
                  setContextFolderId(null);
                  setNewFolderName('');
                }}
              >
                <CornerDownRight size={13} color="var(--accent)" />
                <span>+ New Subfolder</span>
              </button>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  textAlign: 'left',
                }}
                className="sidebar-item"
                onClick={() => handleStartRename(folder.id, folder.name)}
              >
                <Edit2 size={13} />
                <span>Rename</span>
              </button>

              {folders.length > 1 && (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    textAlign: 'left',
                    color: '#ef4444',
                  }}
                  className="sidebar-item"
                  onClick={() => {
                    deleteFolder(folder.id);
                    setContextFolderId(null);
                  }}
                >
                  <Trash size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {creatingSubfolderParentId === folder.id && (
          <div
            style={{
              padding: '4px 8px',
              paddingLeft: `${(depth + 1) * 14 + 10}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FolderIcon size={14} color="var(--accent)" />
            <input
              type="text"
              autoFocus
              placeholder="Subfolder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => handleFinishCreate(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishCreate(folder.id);
                if (e.key === 'Escape') setCreatingSubfolderParentId(null);
              }}
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--bg-editor)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        )}

        {isExpanded && subfolders.map((sub) => renderFolderItem(sub, depth + 1))}
      </React.Fragment>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <aside className="sidebar">
      {/* Clean Doff Notes Titlebar Header (No Mac dots, pure Doff Notes) */}
      <div className="sidebar-header titlebar-drag">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="no-drag">
          <NotebookTabs size={18} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            DOFF NOTES
          </span>
        </div>
      </div>

      <div className="sidebar-nav no-drag">
        {/* Core Navigation Items (No iCloud branding) */}
        <div
          className={`sidebar-item ${isSelected({ type: 'all' }) ? 'active' : ''}`}
          onClick={() => setSidebarSelection({ type: 'all' })}
        >
          <div className="sidebar-item-left">
            <FileText size={16} color={isSelected({ type: 'all' }) ? '#ffffff' : '#d49b29'} />
            <span>All Notes</span>
          </div>
          <span className="sidebar-item-badge">{noteCounts.all}</span>
        </div>

        <div
          className={`sidebar-item ${isSelected({ type: 'quick-notes' }) ? 'active' : ''}`}
          onClick={() => setSidebarSelection({ type: 'quick-notes' })}
        >
          <div className="sidebar-item-left">
            <Zap size={16} color={isSelected({ type: 'quick-notes' }) ? '#ffffff' : '#e5a93c'} />
            <span>Quick Notes</span>
          </div>
          <span className="sidebar-item-badge">{noteCounts.quickNotes}</span>
        </div>

        {/* Folders Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingRight: '4px',
          }}
        >
          <div className="sidebar-title" style={{ padding: '2px 8px' }}>
            Folders
          </div>
          <button
            className="icon-btn"
            style={{ width: '22px', height: '22px' }}
            onClick={() => {
              setIsCreatingRootFolder(true);
              setNewFolderName('');
            }}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* Hierarchical Folders */}
        {rootFolders.map((f) => renderFolderItem(f, 0))}

        {/* New Root Folder Creator */}
        {isCreatingRootFolder && (
          <div
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FolderIcon size={15} color="var(--accent)" />
            <input
              type="text"
              autoFocus
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => handleFinishCreate(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishCreate(null);
                if (e.key === 'Escape') setIsCreatingRootFolder(false);
              }}
              style={{
                flex: 1,
                fontSize: '13px',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--accent)',
                backgroundColor: 'var(--bg-editor)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Tags Section */}
        <div className="sidebar-title" style={{ marginTop: '16px' }}>
          Tags
        </div>
        {tags.length > 0 ? (
          tags.map(({ tag, count }) => {
            const active = isSelected({ type: 'tag', tag });
            return (
              <div
                key={tag}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={() => setSidebarSelection({ type: 'tag', tag })}
              >
                <div className="sidebar-item-left">
                  <Hash size={14} color="var(--text-secondary)" />
                  <span>#{tag}</span>
                </div>
                <span className="sidebar-item-badge">{count}</span>
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            Type <span style={{ backgroundColor: 'rgba(140,140,140,0.12)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>#tag</span> in any note or click <strong>+ Tag</strong> to categorize.
          </div>
        )}

        {/* Recently Deleted (Trash) */}
        <div style={{ marginTop: '16px' }}>
          <div
            className={`sidebar-item ${isSelected({ type: 'trash' }) ? 'active' : ''}`}
            onClick={() => setSidebarSelection({ type: 'trash' })}
          >
            <div className="sidebar-item-left">
              <Trash2 size={15} color="#ef4444" />
              <span>Recently Deleted</span>
            </div>
            <span className="sidebar-item-badge">{noteCounts.trash}</span>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer no-drag">
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
          onClick={() => {
            setIsCreatingRootFolder(true);
            setNewFolderName('');
          }}
        >
          <FolderPlus size={14} />
          <span>New Folder</span>
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Preferences & Google Drive Sync"
        >
          <SettingsIcon size={15} />
        </button>
      </div>
    </aside>
  );
};
