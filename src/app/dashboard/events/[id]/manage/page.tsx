
'use server';

import { getEventAttendees, getEventDetails } from "@/lib/actions/events";
import { ManageEventView } from "./_components/manage-event-view";

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  
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
