'use server';

import { getProfile, getProfileStats } from '@/lib/actions/user';
import { ProfileForm } from './_components/profile-form';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function InfoCard({ title, value }: { title: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-secondary/50">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  )
}


export default async function ProfilePage() {
  const { data: profile, error } = await getProfile();
  
  if (error || !profile) {
    redirect('/login');
  }
  
  const { data: stats, error: statsError } = await getProfileStats();


  const fallback = (profile?.first_name?.[0] || 'U') + (profile?.last_name?.[0] || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Profile Information
        </h1>
        <p className="text-muted-foreground">
          Update your personal information and account settings
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ProfileForm profile={profile} />
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Administrator Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={profile.avatar_url || "https://picsum.photos/100"} alt="User avatar" data-ai-hint="person" />
                        <AvatarFallback>{fallback}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <p className="font-semibold text-xl">{profile.first_name} {profile.last_name}</p>
                        <p className="text-muted-foreground text-sm">{profile.email}</p>
                         <p className="text-xs text-muted-foreground mt-1">Admin since {new Date().toLocaleDateString()}</p>
                    </div>
                </CardContent>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoCard title="Events Created" value={stats?.userEventCount || 0} />
                  <InfoCard title="Active Events" value={stats?.activeEventCount || 0} />
                  <InfoCard title="Total Events" value={stats?.totalEventCount || 0} />
                  <InfoCard title="Total Users" value={stats?.totalUserCount || 0} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button asChild><Link href="/dashboard/events/create">Create Event</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/analytics">View Analytics</Link></Button>
                    <Button asChild variant="outline"><Link href="/dashboard/reports">Generate Reports</Link></Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
