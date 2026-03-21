import { listInvoices } from '../db/invoices';

const COUNTER_KEY = 'invoiceNumberCounterV1';

const parseInvoiceNumber = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^INV-(\d+)$/i);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatInvoiceNumber = (value: number) => `INV-${String(value).padStart(3, '0')}`;

export const getNextInvoiceNumber = async () => {
  let storedCounter = 0;
  if (typeof window !== 'undefined') {
    try {
      storedCounter = Number.parseInt(window.localStorage.getItem(COUNTER_KEY) || '0', 10);
      if (!Number.isFinite(storedCounter)) storedCounter = 0;
    } catch {
      storedCounter = 0;
    }
  }

  let maxExisting = 0;
  try {
    const invoices = await listInvoices();
    invoices.forEach((invoice) => {
      const parsed = parseInvoiceNumber(invoice.invoiceNumber);
      if (parsed && parsed > maxExisting) {
        maxExisting = parsed;
      }
    });
  } catch {
    // ignore db failures
  }

  const next = Math.max(storedCounter, maxExisting) + 1;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COUNTER_KEY, String(next));
    } catch {
      // ignore storage failures
    }
  }

  return formatInvoiceNumber(next);
};

export const resetInvoiceNumberCounter = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(COUNTER_KEY);
  } catch {
    // ignore storage failures
  }
};
