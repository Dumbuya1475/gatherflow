import { UserNav } from '@/components/user-nav';
import { DashboardSheet } from './dashboard-sheet';

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center gap-4 px-4 sm:px-6">
      <DashboardSheet />
      <div className="ml-auto flex items-center gap-2">
        <UserNav />
      </div>
    </header>
  );
}
