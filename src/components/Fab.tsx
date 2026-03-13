import React from 'react';

interface FabProps {
  onClick?: () => void;
  label?: string;
}

export const Fab: React.FC<FabProps> = ({ onClick, label = 'New Invoice' }) => (
  <button
    onClick={onClick}
    className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-soft hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:bottom-8 md:right-8"
  >
    <span className="text-lg">＋</span>
    <span className="font-semibold text-sm">{label}</span>
  </button>
);
