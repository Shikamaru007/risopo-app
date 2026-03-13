import React from 'react';
import { Fab } from '../components/Fab';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="text-xl font-semibold text-ink">Dashboard</h2>
        <p className="text-sm text-gray-600">Metrics and recent invoices will render here.</p>
      </section>
      <Fab />
    </div>
  );
};
