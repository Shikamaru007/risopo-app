import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { InvoiceItem, InvoiceRecord, PaymentMethodType } from '../types/invoice';
import { PaymentMethod, SettingsRecord } from '../types/settings';
import { getSettings } from '../db/settings';
import { getAsset } from '../db/assets';
import { readLogoCache, readSettingsCache } from '../utils/settingsCache';
import { ensurePdfFonts } from './pdfFonts';

type PaymentLines = {
  line1: string;
  line2: string;
  line3?: string;
  label?: string;
};

type OptimizedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

// Formatting helpers
const currencyMeta = (currency: string) => {
  switch (currency) {
    case 'USD':
      return { label: 'US Dollar ($)', symbol: '$' };
    case 'GBP':
      return { label: 'Pound Sterling (£)', symbol: '£' };
    case 'EUR':
      return { label: 'Euro (€)', symbol: '€' };
    case 'NGN':
    default:
      return { label: 'Naira (₦)', symbol: '₦' };
  }
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed);
  return formatted.replace(/\//g, '.');
};

// Keep numeric formatting consistent with the in-app UI (en-NG locale).
const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(value);

// Payment helpers
const resolvePaymentLines = (
  paymentMethod?: PaymentMethod,
  type?: PaymentMethodType
): PaymentLines | null => {
  if (!paymentMethod || !type) return null;
  if (paymentMethod.type !== type) return null;
  if (paymentMethod.type === 'bank') {
    return {
      label: 'Bank transfer',
      line1: paymentMethod.accountNumber,
      line2: paymentMethod.bankName,
      line3: paymentMethod.accountName
    };
  }
  if (paymentMethod.type === 'crypto') {
    return {
      label: 'Crypto wallet',
      line1: paymentMethod.walletAddress,
      line2: paymentMethod.network,
      line3: paymentMethod.label
    };
  }
  return {
    label: 'Payment link',
    line1: paymentMethod.url,
    line2: paymentMethod.label
  };
};

// Data loading helpers
const loadSettings = async (): Promise<SettingsRecord | null> => {
  try {
    const settings = await getSettings();
    if (settings) return settings;
  } catch {
    // ignore db failures
  }
  const cached = readSettingsCache();
  return cached?.data ?? null;
};

const loadLogo = async (logoId?: string): Promise<string | null> => {
  if (!logoId) return null;
  try {
    const asset = await getAsset(logoId);
    if (asset?.dataUrl) return asset.dataUrl;
  } catch {
    // ignore asset failures
  }
  return readLogoCache(logoId);
};

// Image helpers
const inferImageType = (dataUrl: string) => {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.startsWith('data:image/svg')) return 'SVG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  return 'PNG';
};

// Loads the logo, scales it down if needed, and exports a compressed PNG data URL.
const optimizeLogoDataUrl = async (dataUrl: string): Promise<OptimizedImage> => {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const logo = new Image();
      logo.onload = () => resolve(logo);
      logo.onerror = () => reject(new Error('logo-load-failed'));
      logo.src = dataUrl;
    });

    const width = img.naturalWidth || img.width || 0;
    const height = img.naturalHeight || img.height || 0;
    if (!width || !height) {
      return { dataUrl, width, height };
    }

    const targetWidth = width > 400 ? 400 : width;
    const targetHeight = Math.round((height / width) * targetWidth);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { dataUrl, width, height };
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const optimized = canvas.toDataURL('image/png');
    return { dataUrl: optimized, width: targetWidth, height: targetHeight };
  } catch {
    return { dataUrl, width: 0, height: 0 };
  }
};

// Invoice helpers
// Ensure we don't render empty items.
const normalizeItems = (items: InvoiceItem[]) =>
  items
    .map((item) => ({
      ...item,
      name: item.name?.trim() || '',
      description: item.description?.trim() || ''
    }))
    .filter((item) => item.name.length > 0);

const buildPdfFromData = async (invoice: InvoiceRecord) => {
  // jsPDF setup
  const doc = new jsPDF('p', 'mm', 'a4', true);
  const fonts = await ensurePdfFonts(doc);
  doc.setFont(fonts.primary, 'normal');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // NOTE: Layout values are kept as-is to preserve existing output.
  const pageMargin = 40;
  const contentWidth = pageWidth - pageMargin * 2;
  const settings = await loadSettings();
  const logoUrl = await loadLogo(settings?.logoId);
  const currencyInfo = currencyMeta(invoice.currency);
  const issueDateLabel = formatDate(invoice.issueDate);
  const normalizedItems = normalizeItems(invoice.items);

  // Logo
  const logoX = pageMargin - 28;
  const logoY = pageMargin + 8;
  if (logoUrl) {
    // Preprocess the logo to keep size reasonable and avoid distortion.
    const optimizedLogo = await optimizeLogoDataUrl(logoUrl);
    const type = optimizedLogo.dataUrl.startsWith('data:image/png')
      ? 'PNG'
      : inferImageType(optimizedLogo.dataUrl);
    const { width, height } = optimizedLogo;
    const ratio = width > 0 && height > 0 ? width / height : 1;
    // Fixed logo width (mm); height derived from aspect ratio.
    const logoWidth = 40;
    const logoHeight = ratio > 0 ? logoWidth / ratio : logoWidth;
    doc.addImage(optimizedLogo.dataUrl, type, logoX, logoY, logoWidth, logoHeight);
  }

  // Title + invoice number
  doc.setTextColor('#575757');
  doc.setFont(fonts.primary, 'bold');
  doc.setFontSize(40);
  doc.text('Invoice', pageWidth - pageMargin, pageMargin + 26, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont(fonts.mono, 'normal');
  doc.setTextColor('#9599a0');
  const invoiceNumber = invoice.invoiceNumber?.trim();
  if (invoiceNumber) {
    doc.text('Invoice no:', pageWidth - pageMargin - 110, pageMargin + 56);
    doc.setTextColor('#5f6368');
    doc.setFont(fonts.primary, 'normal');
    doc.text(invoiceNumber, pageWidth - pageMargin, pageMargin + 56, { align: 'right' });
  }

  // Date + Currency
  let metaStartY = pageMargin + 86;
  doc.setFontSize(9);
  doc.setTextColor('#9599a0');
  if (issueDateLabel) {
    doc.setFont(fonts.mono, 'normal');
    doc.text('Date', pageMargin, metaStartY);
    doc.setTextColor('#5f6368');
    doc.setFont(fonts.primary, 'normal');
    doc.text(issueDateLabel, pageMargin, metaStartY + 14);
  }
  if (currencyInfo.label) {
    doc.setTextColor('#9599a0');
    doc.setFont(fonts.mono, 'normal');
    doc.text('Currency', pageMargin + 120, metaStartY);
    doc.setTextColor('#5f6368');
    doc.setFont(fonts.primary, 'normal');
    doc.text(currencyInfo.label, pageMargin + 120, metaStartY + 14);
  }

  // From / To
  let partyStartY = metaStartY + 52;
  const fromName = settings?.businessName?.trim() || '';
  const fromEmail = settings?.businessEmail?.trim() || '';
  const fromPhone = settings?.phone?.trim() || '';
  const toName = invoice.client?.name?.trim() || '';
  const toEmail = invoice.client?.email?.trim() || '';
  const toAddress = invoice.client?.address?.trim() || '';
  const toPhone = invoice.client?.phone?.trim() || '';

  doc.setFontSize(9);
  doc.setTextColor('#9599a0');
  doc.setFont(fonts.mono, 'normal');
  doc.text('From', pageMargin, partyStartY);
  doc.text('To', pageMargin + 210, partyStartY);

  const fromLines = [fromName, fromEmail, fromPhone].filter(Boolean);
  const toLines = [toName, toEmail, toPhone || toAddress].filter(Boolean);

  doc.setTextColor('#5f6368');
  doc.setFont(fonts.primary, 'normal');
  doc.setFontSize(10);
  fromLines.forEach((line, index) => {
    doc.text(line, pageMargin, partyStartY + 14 + index * 14);
  });
  toLines.forEach((line, index) => {
    doc.text(line, pageMargin + 210, partyStartY + 14 + index * 14);
  });

  // Items table (jspdf-autotable handles layout and pagination)
  const tableStartY = partyStartY + 74;
  const tableHead = [['Item / Service', 'Unit Cost', 'Qty', 'Amount']];
  const tableBody = normalizedItems.map((item) => [
    item.description || item.name,
    formatNumber(item.unitPrice),
    formatNumber(item.quantity, 0),
    formatNumber(item.total ?? item.unitPrice * item.quantity)
  ]);
  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    styles: {
      font: fonts.primary,
      fontSize: 9,
      textColor: '#5f6368',
      cellPadding: { top: 6, right: 2, bottom: 6, left: 2 }
    },
    headStyles: {
      textColor: '#9599a0',
      fontStyle: 'normal',
      font: fonts.mono
    },
    columnStyles: {
      0: { cellWidth: contentWidth - 200 },
      1: { halign: 'right', cellWidth: 70 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 70 }
    },
    didDrawPage: () => {
      doc.setDrawColor('#e6e6e6');
    }
  });

  const tableEndY = (doc as any).lastAutoTable?.finalY ?? tableStartY;

  // Totals
  const subtotal =
    invoice.subtotal ?? normalizedItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = invoice.tax ?? 0;
  const totalDue = invoice.total ?? Math.max(subtotal - discountAmount, 0);
  const totalsLabelX = pageWidth - pageMargin - 160;
  let totalsCursorY = tableEndY + 24;

  doc.setFontSize(9);
  doc.setTextColor('#9599a0');
  doc.setFont(fonts.mono, 'normal');
  doc.text('Subtotal', totalsLabelX, totalsCursorY);
  doc.setTextColor('#5f6368');
  doc.setFont(fonts.primary, 'normal');
  doc.text(
    `${currencyInfo.symbol} ${formatNumber(subtotal)}`,
    pageWidth - pageMargin,
    totalsCursorY,
    { align: 'right' }
  );
  totalsCursorY += 16;

  if (discountAmount > 0) {
    doc.setTextColor('#9599a0');
    doc.setFont(fonts.mono, 'normal');
    doc.text('Discount', totalsLabelX, totalsCursorY);
    doc.setTextColor('#5f6368');
    doc.setFont(fonts.primary, 'normal');
    doc.text(
      `-${currencyInfo.symbol} ${formatNumber(discountAmount)}`,
      pageWidth - pageMargin,
      totalsCursorY,
      { align: 'right' }
    );
    totalsCursorY += 16;
  }

  doc.setFontSize(11);
  doc.setTextColor('#9599a0');
  doc.setFont(fonts.mono, 'normal');
  doc.text('Total Due', totalsLabelX, totalsCursorY + 4);
  doc.setFontSize(14);
  doc.setTextColor('#575757');
  doc.setFont(fonts.primary, 'bold');
  doc.text(
    `${currencyInfo.symbol} ${formatNumber(totalDue)}`,
    pageWidth - pageMargin,
    totalsCursorY + 6,
    { align: 'right' }
  );

  // Payment details
  const paymentMethod =
    settings?.paymentMethods?.find((method) => method.type === invoice.paymentMethod) ?? undefined;
  const paymentLines = resolvePaymentLines(paymentMethod, invoice.paymentMethod);

  const footerBaselineY = pageHeight - 24;
  const notesText = invoice.refundPolicy?.trim() || invoice.notes?.trim() || '';
  if (paymentLines) {
    const hasLine2 = Boolean(paymentLines.line2);
    const hasLine3 = Boolean(paymentLines.line3);
    const lineGapPrimary = 14;
    const lineGapSecondary = 12;
    let line1Y = footerBaselineY;
    let line2Y = footerBaselineY;
    let line3Y = footerBaselineY;
    if (hasLine3) {
      line3Y = footerBaselineY;
      line2Y = line3Y - lineGapSecondary;
      line1Y = line2Y - lineGapPrimary;
    } else if (hasLine2) {
      line2Y = footerBaselineY;
      line1Y = line2Y - lineGapPrimary;
    } else {
      line1Y = footerBaselineY;
    }

    const labelY = line1Y - 12;

    if (notesText) {
      const notesY = labelY - 12;
      doc.setFontSize(9);
      doc.setTextColor('#a4a4a4');
      doc.setFont(fonts.primary, 'normal');
      doc.text(doc.splitTextToSize(notesText, contentWidth), pageMargin, notesY);
    }

    doc.setFontSize(9);
    doc.setTextColor('#9599a0');
    doc.setFont(fonts.mono, 'normal');
    doc.text('Payment Details', pageMargin, labelY);

    doc.setFont(fonts.primary, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(11, 60, 134);
    // Main line (copyable)
    if (invoice.paymentMethod === 'link') {
      const linkUrl = normalizeLinkUrl(paymentLines.line1);
      if (linkUrl) {
        renderPdfLinkText(doc, paymentLines.line1, pageMargin, line1Y, linkUrl);
      } else {
        renderPdfText(doc, paymentLines.line1, pageMargin, line1Y);
      }
    } else {
      renderPdfText(doc, paymentLines.line1, pageMargin, line1Y);
    }

    doc.setFont(fonts.primary, 'normal');
    doc.setTextColor('#787c7d');
    doc.setFontSize(9);
    if (hasLine2) {
      doc.text(paymentLines.line2 as string, pageMargin, line2Y);
    }
    if (hasLine3) {
      doc.text(paymentLines.line3 as string, pageMargin, line3Y);
    }
  } else if (notesText) {
    doc.setFontSize(9);
    doc.setTextColor('#a4a4a4');
    doc.setFont(fonts.primary, 'normal');
    doc.text(doc.splitTextToSize(notesText, contentWidth), pageMargin, footerBaselineY);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor('#f0f0f0');
  doc.setFont(fonts.mono, 'normal');
  doc.text('risopo.com', pageWidth - pageMargin, pageHeight - 24, { align: 'right' });

  return doc;
};

// Ensures all <img> elements are fully loaded before rasterizing the DOM.
const waitForImagesToLoad = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const cleanup = () => {
            img.onload = null;
            img.onerror = null;
            resolve();
          };
          img.onload = cleanup;
          img.onerror = cleanup;
        })
    )
  );
};

function parseCssRgb(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return { r: 67, g: 67, b: 67 };
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function isBoldFontWeight(value: string) {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) return value.toLowerCase() === 'bold';
  return numeric >= 600;
}

function normalizeLinkUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function renderPdfText(doc: jsPDF, text: string, x: number, y: number) {
  doc.text(text, x, y);
}

const MM_TO_PT = 72 / 25.4;

function renderPdfLinkText(doc: jsPDF, text: string, x: number, y: number, url: string) {
  if (!doc) return;
  const maybeTextWithLink = (doc as any).textWithLink as
    | ((value: string, x: number, y: number, options: { url: string }) => void)
    | undefined;
  if (typeof maybeTextWithLink === 'function') {
    try {
      maybeTextWithLink.call(doc, text, x, y, { url });
      return;
    } catch {
      // fall back to manual link drawing below
    }
  }
  renderPdfText(doc, text, x, y);
  if (typeof (doc as any).getTextWidth !== 'function' || typeof (doc as any).link !== 'function') {
    return;
  }
  try {
    const width = doc.getTextWidth(text);
    const fontSizePt = doc.getFontSize();
    const fontSizeMm = fontSizePt / MM_TO_PT;
    doc.link(x, y - fontSizeMm * 0.85, width, fontSizeMm * 1.15, { url });
  } catch {
    // ignore link annotation failures
  }
}

function renderOverlayTextFromElement(
  doc: jsPDF,
  element: HTMLElement,
  previewRect: DOMRect,
  pageWidth: number,
  pageHeight: number,
  fonts: { primary: string },
  linkUrl?: string
) {
  const lineRect = element.getBoundingClientRect();
  const scaleX = pageWidth / previewRect.width;
  const scaleY = pageHeight / previewRect.height;
  const computed = window.getComputedStyle(element);
  const fontSizePx = Number.parseFloat(computed.fontSize || '10');
  const color = parseCssRgb(computed.color);
  const text = (element.textContent || '').trim();
  if (!text) return;
  doc.setFont(fonts.primary, isBoldFontWeight(computed.fontWeight) ? 'bold' : 'normal');
  const fontSizeMm = fontSizePx * scaleY;
  doc.setFontSize(fontSizeMm * MM_TO_PT);
  doc.setTextColor(color.r, color.g, color.b);
  const x = (lineRect.left - previewRect.left) * scaleX;
  const y = (lineRect.top - previewRect.top) * scaleY + fontSizePx * 0.85 * scaleY;
  if (linkUrl) {
    renderPdfLinkText(doc, text, x, y, linkUrl);
  } else {
    renderPdfText(doc, text, x, y);
  }
}

const buildPdfFromElement = async (invoice: InvoiceRecord, element: HTMLElement) => {
  // Make sure images and fonts are ready before capture.
  await waitForImagesToLoad(element);
  await (document as any).fonts?.ready;
  if (typeof document !== 'undefined' && document.fonts?.load) {
    await Promise.all([
      document.fonts.load('12px "Google Sans"'),
      document.fonts.load('12px "Google Sans Mono"')
    ]);
  }
  // Hide overlay text during rasterization to avoid duplicate rendering.
  const overlayTextEls = Array.from(
    element.querySelectorAll('[data-pdf-payment-line]')
  ) as HTMLElement[];
  const overlayTextStyles = overlayTextEls.map((el) => ({
    el,
    opacity: el.style.opacity,
    color: el.style.color
  }));
  overlayTextEls.forEach((el) => {
    el.style.opacity = '0';
  });
  // Rasterize the preview DOM to a high-res canvas.
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });
  } finally {
    overlayTextStyles.forEach(({ el, opacity, color }) => {
      el.style.opacity = opacity;
      el.style.color = color;
    });
  }
  const imgData = canvas.toDataURL('image/jpeg', 0.86);
  // Create the PDF and place the full-page image.
  const doc = new jsPDF('p', 'mm', 'a4', true);
  const fonts = await ensurePdfFonts(doc);
  doc.setFont(fonts.primary, 'normal');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

  // Re-draw payment lines as selectable text and add link annotation when needed.
  const paymentMainEl = element.querySelector(
    '[data-pdf-payment-line="main"]'
  ) as HTMLElement | null;
  const paymentSub1El = element.querySelector(
    '[data-pdf-payment-line="sub1"]'
  ) as HTMLElement | null;
  const paymentSub2El = element.querySelector(
    '[data-pdf-payment-line="sub2"]'
  ) as HTMLElement | null;
  if (paymentMainEl) {
    const previewRect = element.getBoundingClientRect();
    const rawLink =
      invoice.paymentMethod === 'link' ? (paymentMainEl.textContent || '') : '';
    const linkUrl = rawLink ? normalizeLinkUrl(rawLink) : '';
    renderOverlayTextFromElement(
      doc,
      paymentMainEl,
      previewRect,
      pageWidth,
      pageHeight,
      fonts,
      linkUrl || undefined
    );
    if (paymentSub1El) {
      renderOverlayTextFromElement(
        doc,
        paymentSub1El,
        previewRect,
        pageWidth,
        pageHeight,
        fonts
      );
    }
    if (paymentSub2El) {
      renderOverlayTextFromElement(
        doc,
        paymentSub2El,
        previewRect,
        pageWidth,
        pageHeight,
        fonts
      );
    }
  }

  return doc;
};

export const buildPdf = async (
  invoice: InvoiceRecord,
  options?: { element?: HTMLElement | null }
) => {
  if (options?.element) {
    try {
      return await buildPdfFromElement(invoice, options.element);
    } catch (error) {
      // Fallback to data-driven PDF if DOM capture fails.
      console.error('PDF preview capture failed, falling back to data PDF.', error);
      return buildPdfFromData(invoice);
    }
  }
  return buildPdfFromData(invoice);
};
