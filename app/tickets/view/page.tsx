
import { createClient } from '@/lib/supabase/server';
import { getTicketDetails } from '@/lib/actions/tickets';
import { TicketView } from '@/components/tickets/ticket-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';

interface ViewTicketPageProps {
    searchParams: {
        ticketId?: string;
        email?: string;
    };
}

export default async function ViewTicketPage({ searchParams }: ViewTicketPageProps) {
    const resolvedSearchParams = await Promise.resolve(searchParams);
    const { ticketId, email } = resolvedSearchParams;

    if (!ticketId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Invalid ticket link: Missing ticket ID.</p>
            </div>
        );
    }
    
    const id = parseInt(ticketId, 10);
    if (isNaN(id)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Invalid ticket link: Invalid ticket ID format.</p>
            </div>
        );
    }

    const { data: ticket, error } = await getTicketDetails(id);

    if (error || !ticket) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>Ticket not found or you do not have permission to view it.</p>
            </div>
        );
    }
    
    // For guest users, we validate with email. For logged-in users, we check ownership.
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const isOwner = user && user.id === ticket.profiles?.id;
    const isGuestWithValidEmail = !user && ticket.profiles?.is_guest && ticket.profiles?.email === email;

    if (!isOwner && !isGuestWithValidEmail) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <p>You are not authorized to view this ticket.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 flex justify-center">
            <div className="w-full max-w-4xl">
                 <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">Your Ticket is Confirmed!</h1>
                    <p className="text-lg text-muted-foreground mt-2">Event: {ticket.events.title}</p>
                    {!user && (
                        <Card className="mt-6 text-left">
                            <CardHeader>
                                <CardTitle>Want to manage all your tickets in one place?</CardTitle>
                                <CardDescription>Create a free account to access your dashboard.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <Button asChild>
                                    <Link href={`/signup?email=${email}`}>Create an Account</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
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
