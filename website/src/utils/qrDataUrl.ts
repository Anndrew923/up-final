import QRCode from 'qrcode';

/**
 * Client-side QR data URL (no third-party image CDN).
 * WHY: Desktop download cards must stay private/offline-friendly and match brand colors.
 */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 160,
    margin: 2,
    color: {
      dark: '#ff8c00',
      light: '#050505',
    },
    errorCorrectionLevel: 'M',
  });
}
