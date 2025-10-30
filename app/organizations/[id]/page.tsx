'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, MapPin, Globe, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

async function getOrganizationProfile(orgId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Get organization details with owner info
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select(`
      *,
      owner:owner_id (
        first_name,
        last_name,
        avatar_url
      ),
      followers:followers (count),
      members:organization_members (count),
      events:events (count)
    `)
    .eq('id', orgId)
    .single();

  if (orgError) return null;

  // Get past events
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      date,
      location,
      cover_image,
      tickets:tickets (count)
    `)
    .eq('organization_id', orgId)
    .lt('date', new Date().toISOString())
    .order('date', { ascending: false })
    .limit(5);

  // Get upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      date,
      location,
      cover_image,
      tickets:tickets (count)
    `)
    .eq('organization_id', orgId)
    .gte('date', new Date().toISOString())
    .order('date')
    .limit(3);

  // Check if current user is following
  const { data: { user } } = await supabase.auth.getUser();
  let isFollowing = false;

  if (user) {
    const { data: follower } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_organization_id', orgId)
      .maybeSingle();
    
    isFollowing = !!follower;
  }

  return {
    ...org,
    past_events: events || [],
    upcoming_events: upcomingEvents || [],
    isFollowing
  };
}

export default async function OrganizationProfilePage({
  params
}: {
  params: { id: string }
}) {
  const org = await getOrganizationProfile(params.id);
  
  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="relative">
        {org.cover_image_url && (
          <div className="h-64 w-full rounded-lg overflow-hidden">
            <img
              src={org.cover_image_url}
              alt={`${org.name} cover`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="w-24 h-24 border-4 border-background">
            {org.logo_url ? (
              <AvatarImage src={org.logo_url} alt={org.name} />
            ) : (
              <AvatarFallback>
                <Building2 className="w-12 h-12" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{org.name}</h1>
                {org.is_verified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Verified
                  </span>
                )}
              </div>
              <div className="sm:ml-auto">
                <form action="/api/organizations/follow" method="POST">
                  <input type="hidden" name="organizationId" value={org.id} />
                  <Button variant={org.isFollowing ? "outline" : "default"}>
                    {org.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </form>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              {org.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{org.location}</span>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {new URL(org.website).hostname}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{org?._count?.followers || 0} followers</span>
              </div>
               <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{org?._count?.events || 0} events</span>
              </div>
            </div>
            {org.description && (
              <p className="text-muted-foreground max-w-2xl">{org.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      {org.upcoming_events?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {org.upcoming_events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {event.cover_image && (
                    <div className="aspect-video">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold truncate">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <time>{format(new Date(event.date), 'PPP')}</time>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {org.upcoming_events.length >= 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" asChild>
                <Link href={`/organizations/${org.id}/events`}>View All Events</Link>
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Past Events Section */}
      {org.past_events?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {org.past_events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow opacity-75 hover:opacity-100">
                  {event.cover_image && (
                    <div className="aspect-video">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold truncate">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <time>{format(new Date(event.date), 'PPP')}</time>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{event._count?.tickets || 0} attendees</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {org.past_events.length >= 5 && (
            <div className="text-center mt-4">
              <Button variant="outline" asChild>
                <Link href={`/organizations/${org.id}/events?filter=past`}>View All Past Events</Link>
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}