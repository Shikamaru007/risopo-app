import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
  return (
    <div className="card flex flex-col gap-3 p-6">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </span>
      <span className="text-3xl font-semibold text-ink">{value}</span>
    </div>
  );
};
