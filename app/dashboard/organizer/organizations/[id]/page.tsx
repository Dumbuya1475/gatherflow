import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationForm } from '@/components/organization-form';
import { OrganizationMembers } from '@/components/organization-members';
import { OrganizationEvents } from '@/components/organization-events';
import { ArrowLeft, Globe, MapPin } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch organization
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !org) {
    notFound();
  }

  // Check user's role in this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    redirect('/dashboard/organizer/organizations');
  }

  const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/organizer/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{org.name}</h1>
            {org.description && (
              <p className="text-muted-foreground mb-4">{org.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                  {org.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {org.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {org.location}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">
            {membership.role}
          </span>
        </div>
      </div>

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isOwnerOrAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="events">
          <OrganizationEvents organizationId={id} />
        </TabsContent>

        <TabsContent value="members">
          <OrganizationMembers
            organizationId={id}
            userRole={membership.role}
            ownerId={org.owner_id}
          />
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Update your organization&apos;s information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrganizationForm organization={org} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
