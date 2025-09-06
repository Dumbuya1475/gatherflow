
import { getEventDetails, getEventFormFields } from "@/lib/actions/events";
import { RegisterForEventForm } from "./_components/register-event-form";
import { createClient } from "@/lib/supabase/server";
import { EventDetailsCard } from "./_components/event-details-card";

export default async function RegisterForEventPage({ params }: { params: { id: string } }) {
    const { data: { user } } = await createClient().auth.getUser();

    let userData = null;
    if (user) {
        const supabase = createClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
        userData = { ...user, ...profile };
    }


    const eventId = parseInt(params.id, 10);
    const { data: event, error } = await getEventDetails(eventId);
    const { data: formFields } = await getEventFormFields(eventId);

    if (error || !event) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Event not found.</p>
            </div>
        )
    }

    const isEventFull = event.capacity ? event.attendees >= event.capacity : false;

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 sm:p-12">
                {isEventFull ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">Event Full</h2>
                        <p className="text-muted-foreground">This event has reached its maximum capacity.</p>
                    </div>
                ) : (
                    <RegisterForEventForm event={event} formFields={formFields} user={userData} />
                )}
            </div>
            <div className="hidden lg:flex items-center justify-center bg-secondary p-12">
                <EventDetailsCard event={event} />
            </div>
        </div>
    )
}
