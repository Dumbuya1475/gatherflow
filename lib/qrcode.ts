import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export function generateQRCode(): string {
  // Generate unique code: timestamp + random
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${timestamp}-${random}`.toUpperCase();
}

export async function generateQRCodeImage(code: string): Promise<string> {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(code, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  return qrDataUrl;
}