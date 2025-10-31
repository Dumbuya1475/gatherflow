'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending} variant="outline" size="sm">
      <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}
