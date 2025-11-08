import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes
  const baseClasses = [
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    'select-none',
  ].join(' ');

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
    xl: 'px-8 py-4 text-lg rounded-xl gap-3',
  };

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-emerald-500 text-white',
      'hover:bg-emerald-600',
      'focus:ring-emerald-400',
      'shadow-md hover:shadow-lg',
      'disabled:hover:bg-emerald-500',
    ].join(' '),
    secondary: [
      'bg-zinc-700 text-zinc-100',
      'hover:bg-zinc-600',
      'focus:ring-zinc-500',
      'border border-zinc-600',
      'disabled:hover:bg-zinc-700',
    ].join(' '),
    ghost: [
      'text-zinc-300',
      'hover:bg-zinc-800 hover:text-zinc-100',
      'focus:ring-zinc-600',
      'disabled:hover:bg-transparent disabled:hover:text-zinc-300',
    ].join(' '),
    outline: [
      'bg-transparent text-zinc-100',
      'border-2 border-zinc-600',
      'hover:border-emerald-500 hover:text-emerald-400',
      'focus:ring-emerald-400',
      'disabled:hover:border-zinc-600 disabled:hover:text-zinc-100',
    ].join(' '),
    danger: [
      'bg-red-500 text-white',
      'hover:bg-red-600',
      'focus:ring-red-400',
      'shadow-md hover:shadow-lg',
      'disabled:hover:bg-red-500',
    ].join(' '),
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="flex-1 text-center">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
