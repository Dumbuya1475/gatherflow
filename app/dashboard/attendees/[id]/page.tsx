import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AttendeesList } from '../_components/attendees-list';

export default async function EventAttendeesPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const eventId = parseInt(params.id, 10);

    if (isNaN(eventId)) {
        redirect('/dashboard/attendees');
    }

    // Verify the user is the organizer of this event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, organizer_id')
        .eq('id', eventId)
        .single();

    if (eventError || !event || event.organizer_id !== user.id) {
        console.error('Error fetching event or user not authorized:', eventError);
        redirect('/dashboard/attendees');
    }

    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('event_id', eventId);

    if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        return <div>Error loading attendees.</div>;
    }

    const userIds = [...new Set(tickets.map(ticket => ticket.user_id))];

    const { data: attendees, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', userIds)
        .order('last_name', { ascending: true });

    if (profilesError) {
        console.error('Error fetching attendee profiles:', profilesError);
        return <div>Error loading attendees.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Attendees for {event.name}</h1>
            <AttendeesList attendees={attendees || []} />
        </div>
    );
}