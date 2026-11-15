import React, { useRef } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  ShieldCheck,
  Apple,
  Lock,
} from 'lucide-react';
import { useNotes } from '../../context/NotesContext';
import { ThemeMode } from '../../types/note';
import { exportMarkdownFile, saveDatabase, exportAllToFolder } from '../../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, setTheme, notes, folders, noteCounts } = useNotes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportFolderForAppleNotes = async () => {
    const currentDb = {
      version: 1,
      folders,
      notes,
      settings,
    };
    const ok = await exportAllToFolder(currentDb);
    if (ok) {
      alert(
        'Export complete! The "Doff Notes" folder has been created with all your notes and subfolders as Markdown (.md) files.\n\nYou can now copy this folder to a Mac and import it into Apple Notes via File > Import to Notes...!'
      );
    }
  };

  const handleExportBackup = async () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      folders,
      notes,
      settings,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    await exportMarkdownFile(
      jsonStr,
      `doff-notes-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result === 'string') {
          const parsed = JSON.parse(reader.result);
          if (parsed && Array.isArray(parsed.notes) && Array.isArray(parsed.folders)) {
            await saveDatabase(parsed);
            window.location.reload();
          } else {
            alert('Invalid backup file format.');
          }
        }
      } catch {
        alert('Failed to read or parse backup file.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="var(--accent)" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Preferences</span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            paddingRight: '12px',
          }}
        >
          {/* Appearance */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
              }}
            >
              APPEARANCE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => {
                const isSelected = settings.theme === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {mode === 'light' && <Sun size={18} />}
                    {mode === 'dark' && <Moon size={18} />}
                    {mode === 'system' && <Monitor size={18} />}
                    <span style={{ textTransform: 'capitalize' }}>{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Library Stats */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
              }}
            >
              LIBRARY STATS
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                textAlign: 'center',
                backgroundColor: 'rgba(140, 140, 140, 0.08)',
                padding: '12px',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {noteCounts.all}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Notes</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {folders.length}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Folders</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>
                  {noteCounts.trash}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Trash</div>
              </div>
            </div>
          </div>

          {/* Export & Apple Notes Migration */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '8px',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
              }}
            >
              EXPORT & APPLE NOTES MIGRATION
            </label>

            <div
              style={{
                backgroundColor: 'rgba(140, 140, 140, 0.08)',
                padding: '14px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Export your notes as clean Markdown (<code>.md</code>) files with hierarchical subfolders. You can import this folder directly into Apple Notes on Mac via <strong>File &gt; Import to Notes...</strong>
              </div>

              <button
                className="apple-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                onClick={handleExportFolderForAppleNotes}
              >
                <Apple size={15} />
                <span>Export Notes Folder (for Apple Notes / Mac)</span>
              </button>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <button
                  className="apple-btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                  onClick={handleExportBackup}
                >
                  <Download size={14} />
                  <span>Export Backup (JSON)</span>
                </button>
                <button
                  className="apple-btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  <span>Restore Backup</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportBackup}
                />
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'rgba(212, 155, 41, 0.08)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--accent)' }}>
              <ShieldCheck size={16} />
              <span>100% Offline & Private</span>
            </div>
            <div>
              All your notes and folders are stored locally on this machine (<code>%APPDATA%\Doff Notes</code>). No data ever leaves your computer.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <Lock size={12} />
              <span>Locked notes are encrypted client-side with AES-GCM 256-bit.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Doff Notes
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              v1.2.0 • 100% Offline
            </span>
          </div>
          <button className="apple-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
