import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, Info, Shield, X } from 'lucide-react';
import Button from './EnhancedButton';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'help';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'help',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen && !isLoading) {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleEnter);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
    };
  }, [isOpen, onClose, onConfirm, isLoading]);

  const getIcon = () => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'danger':
        return <AlertTriangle className={`${iconClass} text-red-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-400`} />;
      case 'help':
      default:
        return <HelpCircle className={`${iconClass} text-emerald-400`} />;
    }
  };

  const getBackdropColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-900/20';
      case 'warning':
        return 'bg-yellow-900/20';
      case 'info':
        return 'bg-blue-900/20';
      case 'help':
      default:
        return 'bg-black/50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'danger':
        return 'border-red-500/80';
      case 'warning':
        return 'border-yellow-500/80';
      case 'info':
        return 'border-blue-500/80';
      case 'help':
      default:
        return 'border-emerald-500/80';
    }
  };

  const getGlowColor = () => {
    switch (type) {
      case 'danger':
        return 'shadow-[0_0_40px_rgba(239,68,68,0.3)]';
      case 'warning':
        return 'shadow-[0_0_40px_rgba(251,191,36,0.3)]';
      case 'info':
        return 'shadow-[0_0_40px_rgba(59,130,246,0.3)]';
      case 'help':
      default:
        return 'shadow-[0_0_40px_rgba(52,211,153,0.3)]';
    }
  };

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${getBackdropColor()} backdrop-blur-sm`}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className={`
              relative bg-zinc-700 border-2 ${getBorderColor()} rounded-xl shadow-2xl
              ${getGlowColor()}
              w-full max-w-md backdrop-blur-md
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8">
              <div className={`absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 ${type === 'danger' ? 'border-red-500/60' : type === 'warning' ? 'border-yellow-500/60' : type === 'info' ? 'border-blue-500/60' : 'border-emerald-500/60'}`} />
            </div>
            <div className="absolute top-0 right-0 w-8 h-8">
              <div className={`absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 ${type === 'danger' ? 'border-red-500/60' : type === 'warning' ? 'border-yellow-500/60' : type === 'info' ? 'border-blue-500/60' : 'border-emerald-500/60'}`} />
            </div>
            <div className="absolute bottom-0 left-0 w-8 h-8">
              <div className={`absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 ${type === 'danger' ? 'border-red-500/60' : type === 'warning' ? 'border-yellow-500/60' : type === 'info' ? 'border-blue-500/60' : 'border-emerald-500/60'}`} />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8">
              <div className={`absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 ${type === 'danger' ? 'border-red-500/60' : type === 'warning' ? 'border-yellow-500/60' : type === 'info' ? 'border-blue-500/60' : 'border-emerald-500/60'}`} />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
              disabled={isLoading}
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-6 pt-8">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-zinc-600/70">
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {title}
                  </h3>
                  <div className="w-full h-px bg-gradient-to-r from-zinc-600 via-zinc-500 to-transparent mb-3" />
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <p className="text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                  className="text-zinc-300 hover:text-white border border-zinc-600 hover:border-zinc-500"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={isDestructive || type === 'danger' ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  className="min-w-[100px] font-semibold"
                >
                  {confirmText}
                </Button>
              </div>
            </div>

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: `linear-gradient(45deg, transparent, ${
                  type === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                  type === 'warning' ? 'rgba(251, 191, 36, 0.1)' :
                  type === 'info' ? 'rgba(59, 130, 246, 0.1)' :
                  'rgba(52, 211, 153, 0.1)'
                }, transparent)`,
                backgroundSize: '200% 200%',
                padding: '1px',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <div className="w-full h-full rounded-xl bg-zinc-800/20" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
