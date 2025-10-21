
import { getEventDetails, getEventFormFields } from '@/lib/server/queries/events';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegisterForEventForm } from './_components/register-event-form';
import { EventDetailsCard } from './_components/event-details-card';

interface RegisterForEventPageProps {
    params: { id: string };
}

export default async function RegisterForEventPage({ params }: RegisterForEventPageProps) {
    // Explicitly await params as a workaround for a persistent Next.js static analysis issue.
    const resolvedParams = await Promise.resolve(params);
    const eventId = parseInt(resolvedParams.id, 10);
    const { data: event, error } = await getEventDetails(eventId);
    const { data: formFields } = await getEventFormFields(eventId);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (error || !event) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Event not found.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="grid gap-8 md:grid-cols-2">
                <EventDetailsCard event={event} />
                <RegisterForEventForm event={event} formFields={formFields || []} user={user} />
            </div>
        </div>
    );
}
