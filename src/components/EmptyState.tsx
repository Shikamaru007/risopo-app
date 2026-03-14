import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, className = '' }) => {
  return (
    <div className={`rounded-2xl px-4 py-6 text-center ${className}`}>
      <p className="text-base font-semibold text-slate-600">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
};
