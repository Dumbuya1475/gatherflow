import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from './app-logo';

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background fixed top-0 left-0 right-0 z-50 border-b">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <AppLogo />
        <span className="ml-2 text-xl font-bold font-headline">Eventide</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link href="/#events" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Events
        </Link>
        <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
        </Link>
        <Link href="/#pricing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Pricing
        </Link>
        <Button asChild variant="ghost">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </nav>
    </header>
  );
}
