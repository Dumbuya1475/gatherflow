import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface OrganizationEventsProps {
  organizationId: string;
}

export async function OrganizationEvents({ organizationId }: OrganizationEventsProps) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      date,
      location,
      category,
      cover_image,
      is_public
    `)
    .eq('organization_id', organizationId)
    .order('date', { ascending: false });

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Events Yet</CardTitle>
          <CardDescription>
            This organization hasn&apos;t created any events yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/events/create">Create First Event</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Organization Events</h2>
        <Button asChild size="sm">
          <Link href="/dashboard/events/create">Create Event</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((event) => (
          <Link key={event.id} href={`/events/${event.id}`}>
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
              {event.cover_image && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg relative">
                  <Image
                    src={event.cover_image}
                    alt={event.title}
                    layout="fill"
                    objectFit="cover"
                    unoptimized={!!event.cover_image?.includes('supabase.co')}
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                  {!event.is_public && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">Private</span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
