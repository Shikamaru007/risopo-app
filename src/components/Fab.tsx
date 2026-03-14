import React from 'react';

interface FabProps {
  onClick?: () => void;
  label?: string;
}

export const Fab: React.FC<FabProps> = ({ onClick, label = 'New Invoice' }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+112px)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-soft transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:bottom-[calc(env(safe-area-inset-bottom,0px)+104px)] md:right-8 md:hover:bg-[var(--brand-blue-dark)] active:bg-[var(--brand-blue-pressed)]"
  >
    <span className="icon material-icons-round text-[24px]">add</span>
  </button>
);
