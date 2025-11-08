import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'chart';
  lines?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'text',
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-zinc-700 rounded';

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4`}
            style={{
              width: i === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-zinc-800 border border-zinc-700 rounded-xl p-6 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className={`${baseClasses} h-6 w-32`} />
              <div className={`${baseClasses} h-4 w-24`} />
            </div>
            <div className={`${baseClasses} h-8 w-16`} />
          </div>
          <div className="space-y-2">
            <div className={`${baseClasses} h-4 w-full`} />
            <div className={`${baseClasses} h-4 w-3/4`} />
          </div>
          <div className={`${baseClasses} h-10 w-full`} />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={`${baseClasses} h-12 w-12 rounded-full ${className}`} />;
  }

  if (variant === 'button') {
    return <div className={`${baseClasses} h-10 w-24 rounded-lg ${className}`} />;
  }

  if (variant === 'chart') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`${baseClasses} h-4 w-20`} />
            <div className={`${baseClasses} h-4 flex-1`} />
          </div>
        ))}
      </div>
    );
  }

  return <div className={`${baseClasses} h-32 w-full ${className}`} />;
};

export default LoadingSkeleton;
