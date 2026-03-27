import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  children,
  className = '',
  titleClassName = '',
  valueClassName = ''
}) => {
  return (
    <div
      className={`card flex flex-col gap-3 rounded-[32px] p-6 shadow-none ${className}`}
    >
      <span
        className={`text-xs font-medium uppercase tracking-[0.18em] text-slate-400 font-['Google_Sans_Mono',monospace] ${titleClassName}`}
      >
        {title}
      </span>
      {children}
      <span className={`text-3xl font-medium text-ink ${valueClassName}`}>{value}</span>
    </div>
  );
};
