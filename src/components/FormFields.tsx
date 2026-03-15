import React from 'react';

const baseInputClassName =
  'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]';

const baseSelectClassName =
  'h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]';

const baseTextareaClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]';

export const FieldLabel: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 font-['Google_Sans_Mono',monospace]">
    {children}
  </span>
);

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', type = 'text', ...props }, ref) => (
  <input ref={ref} type={type} className={`${baseInputClassName} ${className}`} {...props} />
));

TextInput.displayName = 'TextInput';

export const SelectInput = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = '', ...props }, ref) => (
  <select ref={ref} className={`${baseSelectClassName} ${className}`} {...props} />
));

SelectInput.displayName = 'SelectInput';

export const TextareaInput = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => (
  <textarea ref={ref} className={`${baseTextareaClassName} ${className}`} {...props} />
));

TextareaInput.displayName = 'TextareaInput';
