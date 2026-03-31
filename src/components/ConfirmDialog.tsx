import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#FEE2E2', color: '#991B1B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={24} />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, backgroundColor: 'var(--danger)', color: 'white', border: 'none' }}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
