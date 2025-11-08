import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './EnhancedButton';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
        <Icon size={48} className="text-zinc-600" />
      </div>
      <h3 className="text-2xl font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-md mb-8">{description}</p>
      {actionLabel && onAction && (
        <div className="flex gap-3">
          <Button onClick={onAction} size="lg">
            {actionLabel}
          </Button>
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction} size="lg">
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
