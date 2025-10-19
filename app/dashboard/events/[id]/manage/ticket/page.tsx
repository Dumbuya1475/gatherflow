import { getEventDetails } from "@/lib/actions/events";
import { TicketCustomizer } from "./_components/ticket-customizer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ManageTicketPageProps {
  params: { id: string };
}

export default async function ManageTicketPage({ params }: ManageTicketPageProps) {
    // Explicitly await params as suggested by the error message, even if it's not a Promise.
    // This is a workaround for a persistent Next.js static analysis issue.
    const resolvedParams = await Promise.resolve(params);
    let eventId: number;
    try {
        eventId = parseInt(resolvedParams.id, 10);
    } catch (e) {
        console.error("Invalid event ID in params:", e);
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Invalid Event ID.</p>
            </div>
        );
    }

    const { data: event, error } = await getEventDetails(eventId);

    if (error || !event) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Event not found.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
            <Link href={`/dashboard/events/${eventId}/manage`}>
                <Button variant="outline" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Event Management
                </Button>
            </Link>
            <TicketCustomizer event={event} />
        </div>
    );
}