import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
  return (
    <div className="card flex flex-col gap-3 rounded-[32px] p-6 shadow-[0_2px_10px_-8px_rgba(15,23,42,0.25)]">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-['Google_Sans_Mono',monospace]">
        {title}
      </span>
      <span className="text-3xl font-semibold text-ink">{value}</span>
    </div>
  );
};
