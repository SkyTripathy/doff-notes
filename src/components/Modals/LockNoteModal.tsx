import React, { useState } from 'react';
import { Lock, Unlock, X, KeyRound, ShieldAlert } from 'lucide-react';
import { useNotes } from '../../context/NotesContext';

interface LockNoteModalProps {
  noteId: string | null;
  onClose: () => void;
}

export const LockNoteModal: React.FC<LockNoteModalProps> = ({ noteId, onClose }) => {
  const { notes, settings, lockNote, unlockNote, removeNoteLock } = useNotes();

  const note = notes.find((n) => n.id === noteId);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState(settings.lockHint || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!noteId || !note) return null;

  const isLocked = note.isLocked;

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await lockNote(note.id, password, hint);
      onClose();
    } catch {
      setError('Failed to encrypt note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password to remove protection.');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await removeNoteLock(note.id, password);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError('Incorrect password. Note remained protected.');
    }
  };

  const handleUnlockSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    setError(null);
    const success = await unlockNote(note.id, password);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229, 169, 60, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              {isLocked ? <Lock size={15} /> : <KeyRound size={15} />}
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>
              {isLocked ? 'Locked Note Settings' : 'Lock Note'}
            </span>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {isLocked ? (
          <form onSubmit={handleRemoveLock}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This note is encrypted using AES-GCM 256-bit encryption. Enter your password to unlock or remove protection.
              </p>

              {settings.lockHint && (
                <div
                  style={{
                    fontSize: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(140, 140, 140, 0.08)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong>Password Hint:</strong> {settings.lockHint}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  autoFocus
                  className="lock-input"
                  style={{ width: '100%' }}
                  placeholder="Enter note password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px' }}>
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="apple-btn-secondary"
                disabled={loading}
                onClick={handleUnlockSession}
              >
                <Unlock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Unlock for Session
              </button>
              <button type="submit" className="apple-btn" disabled={loading}>
                Remove Protection
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLock}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Protect sensitive notes with a password. Your note will be encrypted on device.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  autoFocus
                  className="lock-input"
                  style={{ width: '100%' }}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Verify Password
                </label>
                <input
                  type="password"
                  className="lock-input"
                  style={{ width: '100%' }}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
                  Password Hint (Optional)
                </label>
                <input
                  type="text"
                  className="lock-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. favorite book title"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px' }}>
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="apple-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="apple-btn" disabled={loading}>
                {loading ? 'Encrypting...' : 'Lock Note'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
