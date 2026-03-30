import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { WeeklyCommit, CommitFormData, RCDOLink } from '../types/domain';
import { createCommit, updateCommit } from '../api/client';
import RCDOSelector from './RCDOSelector';

interface CommitFormProps {
  planId: string;
  orgId: string;
  existingCommit?: WeeklyCommit;
  onSave: (commit: WeeklyCommit) => void;
  onCancel: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  header: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: 600 as const,
    color: '#1a1a1a',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 500 as const,
    color: '#333',
  },
  required: {
    color: '#d32f2f',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer' as const,
    fontSize: '14px',
    color: '#333',
  },
  saveButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  saveButtonDisabled: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#90caf9',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '14px',
    fontWeight: 500 as const,
  },
  error: {
    color: '#d32f2f',
    fontSize: '13px',
    marginTop: '4px',
  },
  apiError: {
    backgroundColor: '#fdecea',
    color: '#611a15',
    padding: '10px 14px',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '16px',
  },
};

export default function CommitForm({
  planId,
  orgId,
  existingCommit,
  onSave,
  onCancel,
}: CommitFormProps) {
  const isEditing = !!existingCommit;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(existingCommit?.title ?? '');
  const [description, setDescription] = useState(existingCommit?.description ?? '');
  const [rcdoLinks, setRcdoLinks] = useState<RCDOLink[]>(existingCommit?.rcdoLinks ?? []);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const titleError = touched && title.trim() === '' ? 'Title is required' : null;
  const linksError = touched && rcdoLinks.length === 0 ? 'At least one RCDO link is required' : null;
  const canSave = title.trim() !== '' && rcdoLinks.length > 0 && !saving;

  const handleLinksChange = useCallback((links: RCDOLink[]) => {
    setRcdoLinks(links);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!canSave) return;

    const formData: CommitFormData = {
      title: title.trim(),
      description: description.trim() || null,
      rcdoLinks,
    };

    setSaving(true);
    setApiError(null);

    try {
      const saved = isEditing
        ? await updateCommit(existingCommit!.id, formData)
        : await createCommit(planId, formData);
      onSave(saved);
    } catch {
      setApiError(
        isEditing
          ? 'Failed to update commit. Please try again.'
          : 'Failed to create commit. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal} role="dialog" aria-modal="true">
        <h2 style={styles.header}>{isEditing ? 'Edit Commit' : 'New Commit'}</h2>

        {apiError && <div style={styles.apiError}>{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Title<span style={styles.required}>*</span>
            </label>
            <input
              ref={titleRef}
              style={styles.input}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="What will you commit to this week?"
              maxLength={255}
            />
            {titleError && <div style={styles.error}>{titleError}</div>}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details or context"
              maxLength={2000}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Strategic Alignment<span style={styles.required}>*</span>
            </label>
            <RCDOSelector
              orgId={orgId}
              initialLinks={existingCommit?.rcdoLinks}
              onChange={handleLinksChange}
              disabled={saving}
            />
            {linksError && <div style={styles.error}>{linksError}</div>}
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.cancelButton}
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={canSave ? styles.saveButton : styles.saveButtonDisabled}
              disabled={!canSave}
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
