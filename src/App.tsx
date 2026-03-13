import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { InvoiceBuilderPage } from './pages/InvoiceBuilderPage';

const App: React.FC = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/builder" element={<InvoiceBuilderPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </AppLayout>
);

export default App;
