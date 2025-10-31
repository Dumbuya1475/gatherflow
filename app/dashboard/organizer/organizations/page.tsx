import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Calendar } from 'lucide-react';

export default async function OrganizationsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch organizations where user is a member
  const { data: memberships } = await supabase
    .from('organization_members')
    .select(`
      role,
      organizations (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const organizations = memberships?.map(m => {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
    return {
      ...org,
      role: m.role,
    };
  }) || [];

  // Get event counts for each organization
  const orgIds = organizations.map(org => org.id);
  const { data: eventCounts } = orgIds.length > 0 ? await supabase
    .from('events')
    .select('organization_id')
    .in('organization_id', orgIds) : { data: [] };

  const eventCountMap = eventCounts?.reduce((acc, event) => {
    acc[event.organization_id] = (acc[event.organization_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your organizations and create events on their behalf
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/organizer/organizations/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Organization
          </Link>
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Organizations Yet</CardTitle>
            <CardDescription>
              Create your first organization to start hosting events as an organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/organizer/organizations/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/dashboard/organizer/organizations/${org.id}`}
            >
              <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{org.name}</CardTitle>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {org.role}
                    </span>
                  </div>
                  {org.description && (
                    <CardDescription className="line-clamp-2">
                      {org.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{eventCountMap[org.id] || 0} events</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
