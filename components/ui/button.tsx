
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 disabled:bg-emerald-800 disabled:text-emerald-400 disabled:cursor-not-allowed',
    secondary: 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 focus:ring-emerald-500 border border-zinc-600',
    ghost: 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;