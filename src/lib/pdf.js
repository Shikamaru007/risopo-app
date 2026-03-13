import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export const buildPdf = (_invoice) => {
    const doc = new jsPDF();
    autoTable(doc, { head: [['Placeholder']], body: [['Invoice PDF generation TBD']] });
    return doc;
};
