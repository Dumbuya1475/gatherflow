
import { getTicketDetails } from '@/lib/actions/tickets';
import { TicketView } from '@/components/tickets/ticket-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ViewTicketPageProps {
    searchParams: {
        ticketId?: string;
        email?: string;
    };
}

export default async function ViewTicketPage({ searchParams }: ViewTicketPageProps) {
    const { ticketId, email } = searchParams;

    if (!ticketId || !email) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Invalid ticket link. Please check the URL and try again.</p>
            </div>
        );
    }

    const { data: ticket, error } = await getTicketDetails(parseInt(ticketId, 10));

    if (error || !ticket) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Ticket not found.</p>
            </div>
        );
    }

    // @ts-ignore
    if (ticket.profiles?.email !== email) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>This ticket is not associated with the provided email address.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 flex justify-center">
            <div className="w-full max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Ticket</CardTitle>
                        <CardDescription>
                            Present this ticket at the event for entry. You can also show the QR code from the email sent to you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TicketView ticket={ticket} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
