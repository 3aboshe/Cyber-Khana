
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div
        className={`bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl w-full ${className || 'max-w-md'} animate-modal-enter relative`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <X size={24} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;