import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
  hoverable = false,
}) => {
  // Base classes
  const baseClasses = ['bg-zinc-800 border border-zinc-700 rounded-xl transition-all duration-200'];

  // Variant classes
  const variantClasses = {
    default: 'bg-zinc-800 border-zinc-700',
    elevated: 'bg-zinc-800 border-zinc-700 shadow-lg',
    outlined: 'bg-transparent border-2 border-zinc-700',
    ghost: 'bg-transparent border-transparent',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Hoverable
  const hoverClasses = hoverable
    ? [
        'hover:border-zinc-600 hover:shadow-xl cursor-pointer',
        'active:scale-[0.99]',
        'focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-opacity-50',
      ].join(' ')
    : '';

  const classes = [baseClasses.join(' '), variantClasses[variant], paddingClasses[padding], hoverClasses, className]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <div className={classes} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}>
        {children}
      </div>
    );
  }

  return <div className={classes}>{children}</div>;
};

export default Card;
