import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SettingsPage } from './pages/SettingsPage';
import { InvoiceBuilderPage } from './pages/InvoiceBuilderPage';
import { InvoicePreviewPage } from './pages/InvoicePreviewPage';
import { InvoiceGeneratedPage } from './pages/InvoiceGeneratedPage';

const App: React.FC = () => (
  <AppLayout>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/invoices" element={<InvoicesPage />} />
      <Route path="/invoices/:id" element={<InvoicePreviewPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/builder" element={<InvoiceBuilderPage />} />
      <Route path="/builder/preview" element={<InvoiceGeneratedPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <SpeedInsights />
  </AppLayout>
);

export default App;
