import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR';

const currencyOptions: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'NGN', symbol: '₦', name: 'Naira' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  { code: 'EUR', symbol: '€', name: 'Euro' }
];

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  buttonClassName?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  buttonClassName = ''
}) => {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const selected = useMemo(
    () => currencyOptions.find((option) => option.code === value) ?? currencyOptions[0],
    [value]
  );

  const closeModal = () => {
    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      setAnimateIn(false);
      setOpen(false);
      return;
    }
    setAnimateIn(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 420);
  };

  const handleSelect = (code: CurrencyCode) => {
    onChange(code);
    closeModal();
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

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(true)}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 ${buttonClassName}`}
      >
        <span className="text-base font-medium text-slate-500">{selected.symbol}</span>
        <span className="icon material-symbols-rounded text-[20px] text-slate-400">
          expand_more
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            onClick={closeModal}
            className="fixed inset-0 z-30 hidden md:block"
          />
          <div
            id={menuId}
            className="absolute right-0 top-full z-40 mt-2 hidden w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft md:block"
          >
            {currencyOptions.map((option) => {
              const isSelected = option.code === selected.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                    isSelected
                      ? 'bg-[rgba(15,76,172,0.08)] text-[var(--brand-blue-dark)]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-base font-medium ${
                      isSelected ? 'text-[var(--brand-blue-dark)]' : 'text-slate-600'
                    }`}
                  >
                    {option.symbol}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-[var(--brand-blue)]' : 'text-slate-400'}`}>
                    {option.name}
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
                    aria-label="Close currency selector"
                  >
                    <span className="icon material-symbols-rounded text-[18px]">arrow_back</span>
                  </button>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Currency
                  </span>
                  <span className="h-9 w-9" aria-hidden />
                </div>
                <div className="space-y-2">
                  {currencyOptions.map((option) => {
                    const isSelected = option.code === selected.code;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => handleSelect(option.code)}
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors ${
                          isSelected
                            ? 'bg-[rgba(15,76,172,0.08)] text-[var(--brand-blue-dark)]'
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-base font-medium ${
                            isSelected ? 'text-[var(--brand-blue-dark)]' : 'text-slate-600'
                          }`}
                        >
                          {option.symbol}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-[var(--brand-blue)]' : 'text-slate-400'}`}>
                          {option.name}
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
