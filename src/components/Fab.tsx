import React from 'react';
import { Link } from 'react-router-dom';

interface FabProps {
  onClick?: () => void;
  label?: string;
  to?: string;
}

export const Fab: React.FC<FabProps> = ({ onClick, label = 'New Invoice', to }) => {
  const className =
    'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+112px)] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] md:hidden';

  if (to) {
    return (
      <Link to={to} aria-label={label} className={className}>
        <span className="icon material-icons-round text-[24px]">add</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} aria-label={label} className={className}>
      <span className="icon material-icons-round text-[24px]">add</span>
    </button>
  );
};
