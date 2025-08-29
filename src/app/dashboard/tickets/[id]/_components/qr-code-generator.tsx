'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

export function QrCodeGenerator({ qrToken }: { qrToken: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(qrToken, { width: 300, margin: 2 })
      .then(url => {
        setDataUrl(url);
      })
      .catch(err => {
        console.error(err);
      });
  }, [qrToken]);

  if (!dataUrl) {
    return (
        <div className="w-[300px] h-[300px] bg-muted animate-pulse rounded-md"></div>
    );
  }

  return <Image src={dataUrl} alt="QR Code" width={300} height={300} />;
}
