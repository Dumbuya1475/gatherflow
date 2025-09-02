import Image from 'next/image';

export function AppLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/GatherFlow_Logo.png"
      alt="GatherFlow Logo"
      width={40}
      height={40}
      className={className}
      priority
    />
  );
}
