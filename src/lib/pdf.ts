import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceRecord } from '../types/invoice';

export const buildPdf = (_invoice: InvoiceRecord) => {
  const doc = new jsPDF();
  autoTable(doc, { head: [['Placeholder']], body: [['Invoice PDF generation TBD']] });
  return doc;
};
