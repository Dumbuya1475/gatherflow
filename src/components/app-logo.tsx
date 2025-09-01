import Image from 'next/image';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="GatherFlow Logo"
      width={32}
      height={32}
      className={className}
      priority
    />
  );
}
