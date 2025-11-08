
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = 'w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md placeholder-zinc-500 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200';

  return (
    <input className={`${baseClasses} ${className}`} {...props} />
  );
};

export default Input;