
import { getEventDetails, getEventFormFields } from '@/lib/server/queries/events';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegisterForEventForm } from './_components/register-event-form';
import { EventDetailsCard } from './_components/event-details-card';
import { cookies } from 'next/headers';

interface RegisterForEventPageProps {
    params: { id: string };
    searchParams?: { payment_cancelled?: string };
}

export default async function RegisterForEventPage({ params, searchParams }: RegisterForEventPageProps) {
    // Explicitly await params as a workaround for a persistent Next.js static analysis issue.
    const resolvedParams = await Promise.resolve(params);
    const eventId = parseInt(resolvedParams.id, 10);
    const { data: event, error } = await getEventDetails(eventId);
    const { data: formFields } = await getEventFormFields(eventId);
    
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Handle payment cancellation - mark unpaid tickets as cancelled
    if (searchParams?.payment_cancelled === 'true' && user) {
        await supabase
            .from('tickets')
            .update({ status: 'cancelled' })
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .eq('status', 'unpaid');
    }

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
