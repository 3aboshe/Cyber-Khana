import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  const baseClasses = 'w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md placeholder-zinc-500 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 min-h-[120px]';

  return (
    <textarea className={`${baseClasses} ${className}`} {...props} />
  );
};

export default Textarea;