import jsPDF from 'jspdf';

type FontLoadResult = {
  primary: string;
  mono: string;
  hasCustom: boolean;
};

const fontCache: {
  regular?: string;
  medium?: string;
  mono?: string;
  loading?: Promise<FontLoadResult>;
} = {};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const fetchFont = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch {
    return '';
  }
};

export const ensurePdfFonts = async (doc: jsPDF): Promise<FontLoadResult> => {
  if (!fontCache.loading) {
    fontCache.loading = (async () => {
      if (!fontCache.regular) {
        fontCache.regular = await fetchFont('/fonts/GoogleSans-Regular.ttf');
      }
      if (!fontCache.medium) {
        fontCache.medium = await fetchFont('/fonts/GoogleSans-Medium.ttf');
      }
      if (!fontCache.mono) {
        fontCache.mono = await fetchFont('/fonts/GoogleSansMono-Regular.ttf');
      }

      const hasPrimary = Boolean(fontCache.regular);
      const hasMono = Boolean(fontCache.mono);

      return {
        primary: hasPrimary ? 'GoogleSans' : 'helvetica',
        mono: hasMono ? 'GoogleSansMono' : 'courier',
        hasCustom: hasPrimary && hasMono
      };
    })();
  }

  const result = await fontCache.loading;
  const fontList =
    typeof (doc as any).getFontList === 'function' ? (doc as any).getFontList() : null;
  const hasFont = (family: string, style: string) =>
    Boolean(fontList?.[family] && Array.isArray(fontList[family]) && fontList[family].includes(style));

  if (fontCache.regular && !hasFont('GoogleSans', 'normal')) {
    doc.addFileToVFS('GoogleSans-Regular.ttf', fontCache.regular);
    doc.addFont('GoogleSans-Regular.ttf', 'GoogleSans', 'normal');
  }
  if (fontCache.medium && !hasFont('GoogleSans', 'bold')) {
    doc.addFileToVFS('GoogleSans-Medium.ttf', fontCache.medium);
    doc.addFont('GoogleSans-Medium.ttf', 'GoogleSans', 'bold');
  }
  if (fontCache.mono && !hasFont('GoogleSansMono', 'normal')) {
    doc.addFileToVFS('GoogleSansMono-Regular.ttf', fontCache.mono);
    doc.addFont('GoogleSansMono-Regular.ttf', 'GoogleSansMono', 'normal');
  }

  return result;
};
