import jsPDF from 'jspdf';
import { InvoiceRecord } from '../types/invoice';
export declare const buildPdf: (_invoice: InvoiceRecord) => jsPDF;
