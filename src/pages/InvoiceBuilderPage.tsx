import React from 'react';
import { InvoicePdfPreview } from '../components/InvoicePdfPreview';

export const InvoiceBuilderPage: React.FC = () => {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-ink md:text-4xl">Invoice Builder</h2>
        <p className="text-base text-gray-600">Multi-step builder flow placeholder.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">
              Builder steps will live here. This panel will drive the live PDF preview.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-400 xl:hidden">
            Live PDF preview is available on full desktop layouts.
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-[28px] border border-slate-100 bg-white/70 p-4 shadow-soft backdrop-blur">
            <InvoicePdfPreview className="origin-top-right scale-[0.92]" />
          </div>
        </aside>
      </div>
    </section>
  );
};
