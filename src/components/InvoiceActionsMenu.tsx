import React, { useEffect, useId, useRef, useState } from 'react';

type InvoiceAction = 'view' | 'duplicate' | 'download' | 'delete';

const actionMeta: {
  key: InvoiceAction;
  label: string;
  icon: string;
  tone?: 'default' | 'danger';
}[] = [
  { key: 'view', label: 'View', icon: 'visibility' },
  { key: 'duplicate', label: 'Duplicate', icon: 'content_copy' },
  { key: 'download', label: 'Download', icon: 'download' },
  { key: 'delete', label: 'Delete', icon: 'delete', tone: 'danger' }
];

interface InvoiceActionsMenuProps {
  onView?: () => void;
  onDuplicate?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export const InvoiceActionsMenu: React.FC<InvoiceActionsMenuProps> = ({
  onView,
  onDuplicate,
  onDownload,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const actions: Record<InvoiceAction, (() => void) | undefined> = {
    view: onView,
    duplicate: onDuplicate,
    download: onDownload,
    delete: onDelete
  };

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleAction = (action: InvoiceAction) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    actions[action]?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Invoice actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={handleToggle}
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-white transition-colors ${
          open ? 'text-[var(--brand-blue)]' : 'text-[#111111]'
        }`}
      >
        <span className="icon material-symbols-rounded text-[16px]">more_vert</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-100 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.7)] backdrop-blur"
        >
          {actionMeta.map((action) => {
            const isDanger = action.tone === 'danger';
            return (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                onClick={handleAction(action.key)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  isDanger
                    ? 'text-[#d92d20] hover:bg-[#fef3f2]'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="icon material-symbols-rounded text-[18px]">
                  {action.icon}
                </span>
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
