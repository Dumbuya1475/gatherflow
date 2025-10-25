
import { CreateEventForm } from '@/components/create-event-form';
import { getEventDetails } from '@/lib/server/queries/events';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const eventId = parseInt(params.id, 10);
  const { data: event, error } = await getEventDetails(eventId);

  if (error || !event || !user || user.id !== event.organizer_id) {
    redirect('/dashboard/events');
  }

  // Map event data to form values
  const defaultValues = {
    ...event,
    date: new Date(event.date),
    end_date: event.end_date ? new Date(event.end_date) : undefined,
    targetAudience: 'Users', // This field is not in the db, providing a default
    current_cover_image: event.cover_image || undefined,
    scanners: (event.scanners || []).map((s: { profiles: { email: string } }) => ({ email: s.profiles.email })),
    customFields: event.event_form_fields,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Edit Event
        </h1>
        <p className="text-muted-foreground">
          Update the details for your event.
        </p>
      </div>
      <CreateEventForm event={event} defaultValues={defaultValues} />
    </div>
  );
}
