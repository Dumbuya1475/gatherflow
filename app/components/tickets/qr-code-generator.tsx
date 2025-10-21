
'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

export function QrCodeGenerator({ qrToken }: { qrToken: string | null }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (qrToken) {
      QRCode.toDataURL(qrToken, { width: 300, margin: 2, errorCorrectionLevel: 'L' })
        .then(url => {
          setDataUrl(url);
        })
        .catch(err => {
          console.error(err);
        });
    }
  }, [qrToken]);

  if (!qrToken) {
    return (
        <div className="w-[300px] h-[300px] bg-muted rounded-md flex flex-col items-center justify-center text-center p-4">
            <p className="font-semibold text-destructive">QR Code Error</p>
            <p className="text-sm text-muted-foreground">Could not generate QR code. Please try again later.</p>
        </div>
    );
  }

  if (!dataUrl) {
    return (
        <div className="w-[300px] h-[300px] bg-muted animate-pulse rounded-md"></div>
    );
  }

  return <Image src={dataUrl} alt="QR Code" width={300} height={300} />;
}
