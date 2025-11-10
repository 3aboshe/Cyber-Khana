import { useState, useCallback } from 'react';
import ConfirmationDialog, { ConfirmationType } from '../components/ui/ConfirmationDialog';

interface ConfirmationOptions {
  type?: ConfirmationType;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ConfirmationPromise {
  resolve: (value: boolean) => void;
  options: {
    title: string;
    message: string;
    type: ConfirmationType;
    confirmText: string;
    cancelText: string;
    isDestructive: boolean;
  };
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPromise, setCurrentPromise] = useState<ConfirmationPromise | null>(null);

  const confirm = useCallback((
    message: string,
    options: ConfirmationOptions = {}
  ): Promise<boolean> => {
    const {
      type = 'help',
      title = 'Confirm Action',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDestructive = false,
    } = options;

    return new Promise((resolve) => {
      setCurrentPromise({
        resolve,
        options: {
          title,
          message,
          type,
          confirmText,
          cancelText,
          isDestructive,
        },
      });
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    if (currentPromise) {
      currentPromise.resolve(false);
      setCurrentPromise(null);
      setIsOpen(false);
    }
  }, [currentPromise]);

  const handleConfirm = useCallback(() => {
    if (currentPromise) {
      currentPromise.resolve(true);
      setCurrentPromise(null);
      setIsOpen(false);
    }
  }, [currentPromise]);

  const ConfirmationDialogComponent = useCallback(() => {
    if (!currentPromise) return null;

    return (
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={currentPromise.options.title}
        message={currentPromise.options.message}
        type={currentPromise.options.type}
        confirmText={currentPromise.options.confirmText}
        cancelText={currentPromise.options.cancelText}
        isDestructive={currentPromise.options.isDestructive}
      />
    );
  }, [isOpen, currentPromise, handleClose, handleConfirm]);

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
};

export default useConfirmation;
