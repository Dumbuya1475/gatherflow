import { getTicketDetails } from "@/lib/actions/tickets";
import { TicketView } from "@/components/tickets/ticket-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ViewTicketPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;
    const ticketId = resolvedParams.id ? parseInt(resolvedParams.id, 10) : null;

    if (!ticketId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
                <Card className="w-full max-w-md text-center p-8">
                    <CardHeader>
                        <CardTitle className="text-2xl text-red-500">Invalid Ticket Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The link you followed is missing a ticket ID.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { data: ticket, error } = await getTicketDetails(ticketId);

    if (error || !ticket) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
                <Card className="w-full max-w-md text-center p-8">
                    <CardHeader>
                        <CardTitle className="text-2xl text-red-500">Ticket Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error || 'Could not retrieve ticket details. The ticket may have been deleted or the link is incorrect.'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl">
                <TicketView ticket={ticket} />
            </div>
        </div>
    );
}
