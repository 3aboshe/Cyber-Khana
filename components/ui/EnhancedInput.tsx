import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const inputClasses = [
      'w-full bg-zinc-800 border border-zinc-600 rounded-lg',
      'text-zinc-100 placeholder-zinc-500',
      'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
      'transition-all duration-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      leftIcon ? 'pl-10' : 'pl-4',
      rightIcon ? 'pr-10' : 'pr-4',
      error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-zinc-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
