import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { listInvoices } from '../db/invoices';
import { InvoiceRecord } from '../types/invoice';
import { useDexieReady } from '../hooks/useDexieReady';
import { InvoiceCard } from '../components/InvoiceCard';
import { EmptyState } from '../components/EmptyState';
import { TextInput } from '../components/FormFields';

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

  const groupedInvoices = useMemo(() => {
    const today = new Date();
    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const groups: { label: string; items: InvoiceRecord[] }[] = [];
    const todayItems: InvoiceRecord[] = [];
    const yesterdayItems: InvoiceRecord[] = [];
    const otherItems: InvoiceRecord[] = [];

    filteredInvoices.forEach((invoice) => {
      const created = new Date(invoice.createdAt);
      if (isSameDay(created, today)) {
        todayItems.push(invoice);
      } else if (isSameDay(created, yesterday)) {
        yesterdayItems.push(invoice);
      } else {
        otherItems.push(invoice);
      }
    });

    if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
    if (otherItems.length) groups.push({ label: 'Earlier', items: otherItems });

    return groups;
  }, [filteredInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search invoices"
        />
      </div>

      <section className="space-y-6">
        {filteredInvoices.length === 0 && (
          <EmptyState
            className="mt-4"
            title="No invoices yet"
            description="Your recent invoices will appear here once you create one."
          />
        )}

        {groupedInvoices.map((group) => (
          <div key={group.label} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {group.label}
            </div>
            <div className="space-y-3">
              {group.items.map((invoice) => (
                <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="block">
                  <InvoiceCard invoice={invoice} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
