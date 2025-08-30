
'use client';

import { useState } from 'react';
import { Header } from './header';

export const navLinks = [
    { href: "/#events", label: "Events" },
    { href: "/#features", label: "Features" },
    { href: "/#pricing", label: "Pricing" },
]

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return <Header navLinks={navLinks} onMobileLinkClick={() => setIsOpen(false)} />;
}
