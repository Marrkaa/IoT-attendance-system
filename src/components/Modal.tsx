import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  const widthMap = { sm: '400px', md: '520px', lg: '680px' };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content card" style={{ maxWidth: widthMap[size], width: '100%', margin: '2rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h3 className="card-title">{title}</h3>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.375rem', border: 'none' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1rem 0', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
