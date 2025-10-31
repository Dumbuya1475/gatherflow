
'use server';

import { getEventAttendees } from "@/lib/actions/events";
import { getEventDetails } from "@/lib/server/queries/events";
import { ManageEventView } from "./_components/manage-event-view";


interface ManageEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageEventPage({ params }: ManageEventPageProps) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10);
  
  // Fetch data in parallel
  const [
    { data: event, error: eventError },
    { data: attendees, error: attendeesError }
  ] = await Promise.all([
    getEventDetails(eventId),
    getEventAttendees(eventId)
  ]);

  if (eventError || !event) {
    return (
      <div className="text-center text-destructive p-8">
        <h2 className="text-xl font-semibold">Error</h2>
        <p>{eventError || 'Event not found.'}</p>
      </div>
    );
  }

  if (attendeesError) {
    return (
      <div className="text-center text-destructive p-8">
        <h2 className="text-xl font-semibold">Error</h2>
        <p>Error fetching attendees: {attendeesError}</p>
      </div>
    );
  }

  return <ManageEventView event={event} initialAttendees={attendees || []} />;
}
