
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from './app-logo';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import type { navLinks } from './public-header';

interface HeaderProps {
    navLinks: typeof navLinks;
    onMobileLinkClick: () => void;
}

export function Header({ navLinks, onMobileLinkClick }: HeaderProps) {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background fixed top-0 left-0 right-0 z-50 border-b">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <AppLogo />
        <span className="ml-2 text-xl font-bold font-headline">GatherFlow</span>
      </Link>
      <nav className="ml-auto hidden md:flex gap-4 sm:gap-6 items-center">
        {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
                {link.label}
            </Link>
        ))}
        <Button asChild variant="ghost">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </nav>
      <div className="ml-auto md:hidden">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium mt-6">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className="hover:text-primary transition-colors" onClick={onMobileLinkClick}>{link.label}</Link>
                    ))}
                     <div className="flex flex-col gap-4 pt-6">
                        <Button asChild variant="ghost" onClick={onMobileLinkClick}>
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild onClick={onMobileLinkClick}>
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
