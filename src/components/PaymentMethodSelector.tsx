import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

type PaymentMethodId = 'bank' | 'crypto' | 'link';

const paymentOptions: {
  id: PaymentMethodId;
  label: string;
  description: string;
}[] = [
  { id: 'bank', label: 'Bank transfer', description: 'Account details' },
  { id: 'crypto', label: 'Crypto', description: 'Wallet address' },
  { id: 'link', label: 'Payment link', description: 'Checkout link' }
];

interface PaymentMethodSelectorProps {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  buttonClassName?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  buttonClassName = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const selected = useMemo(
    () => paymentOptions.find((option) => option.id === value) ?? paymentOptions[0],
    [value]
  );

  const isMobileViewport = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  const closeDesktop = () => {
    setAnimateIn(false);
    setOpen(false);
  };

  const closeModal = () => {
    const isMobile = isMobileViewport();
    if (!isMobile) {
      closeDesktop();
      return;
    }
    setAnimateIn(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 420);
  };

  const handleSelect = (id: PaymentMethodId) => {
    const isMobile = isMobileViewport();
    onChange(id);
    if (isMobile) {
      closeModal();
    } else {
      closeDesktop();
    }
  };

  useEffect(() => {
    if (!open) {
      setAnimateIn(false);
      return;
    }
    const frame = requestAnimationFrame(() => setAnimateIn(true));
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        closeDesktop();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 ${buttonClassName}`}
      >
        <span className="text-sm font-semibold text-slate-600">{selected.label}</span>
        <span className="icon material-symbols-rounded text-[20px] text-slate-400">
          expand_more
        </span>
      </button>

      {open && (
        <>
          <div
            id={menuId}
            className="absolute left-0 right-0 top-full z-50 mt-2 hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft md:block"
          >
            {paymentOptions.map((option) => {
              const isSelected = option.id === selected.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`flex w-full items-center gap-4 px-4 py-3 text-sm transition-colors ${
                    isSelected
                      ? 'bg-[rgba(15,76,172,0.08)] text-[var(--brand-blue-dark)]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex-1 text-left text-sm font-semibold ${
                      isSelected ? 'text-[var(--brand-blue-dark)]' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`text-right text-xs ${
                      isSelected ? 'text-[var(--brand-blue)]' : 'text-slate-400'
                    }`}
                  >
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-hidden
            onClick={closeModal}
            className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
              animateIn ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
            <div className="mx-auto w-full max-w-[430px]">
              <div
                className={`relative flex flex-col gap-6 rounded-t-[36px] bg-white px-6 pb-10 pt-3 shadow-[0px_-2px_12px_rgba(0,0,0,0.12)] transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="flex items-center justify-center">
                  <div className="h-2 w-14 rounded-full bg-[#a4a7ae]" />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-slate-500"
                    aria-label="Close payment methods"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Payment method
                  </span>
                  <span className="h-9 w-9" aria-hidden />
                </div>
                <div className="space-y-2">
                  {paymentOptions.map((option) => {
                    const isSelected = option.id === selected.id;
                    return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm transition-colors ${
                        isSelected
                          ? 'bg-[rgba(15,76,172,0.08)] text-[var(--brand-blue-dark)]'
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                        <span
                          className={`flex-1 text-left text-sm font-semibold ${
                            isSelected ? 'text-[var(--brand-blue-dark)]' : 'text-slate-600'
                          }`}
                        >
                          {option.label}
                        </span>
                        <span
                          className={`text-right text-xs ${
                            isSelected ? 'text-[var(--brand-blue)]' : 'text-slate-400'
                          }`}
                        >
                        {option.description}
                      </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
