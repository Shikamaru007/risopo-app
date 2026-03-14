import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';

export const InvoicesPage: React.FC = () => {
  const ready = useDexieReady();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!ready) return;
    const subscription = liveQuery(() => listInvoices()).subscribe({
      next: (data) => {
        setInvoices(data);
        setLoading(false);
      },
      error: () => setLoading(false)
    });
    return () => subscription.unsubscribe();
  }, [ready]);

  const filteredInvoices = useMemo(() => {
    const sourceInvoices = invoices;
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? sourceInvoices.filter((invoice) => {
          const client = invoice.client?.name?.toLowerCase() ?? '';
          const number = invoice.invoiceNumber?.toLowerCase() ?? '';
          return client.includes(normalized) || number.includes(normalized);
        })
      : sourceInvoices;

    return filtered;
  }, [invoices, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <label className="flex h-14 w-full items-center gap-2 rounded-[22px] border border-transparent bg-white px-[24px] text-sm focus-within:border-[var(--brand-blue)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoices"
            className="w-full bg-transparent text-[16px] font-normal leading-[1.2] text-ink placeholder:text-[#a4a7ae] focus:outline-none font-['Google_Sans',sans-serif]"
          />
        </label>
      </div>

      <section className="space-y-3">
        {!loading && filteredInvoices.length === 0 && (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        )}

        {loading && filteredInvoices.length === 0 && (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        )}

        {!loading &&
          filteredInvoices.map((invoice) => (
            <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="block">
              <InvoiceCard invoice={invoice} />
            </Link>
          ))}
      </section>
    </div>
  );
};
