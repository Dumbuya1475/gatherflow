
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTicketDetails } from "@/lib/actions/tickets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QrCodeGenerator } from "@/app/dashboard/tickets/[id]/_components/qr-code-generator";
import { CheckCircle } from "lucide-react";

export default async function RegistrationSuccessPage({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams: { ticketId?: string };
}) {
    const { data: { user } } = await createClient().auth.getUser();
    const ticketId = searchParams.ticketId ? parseInt(searchParams.ticketId, 10) : null;


    if (!user || !ticketId) {
        redirect('/login');
    }

    const { data: ticket, error } = await getTicketDetails(ticketId);

    if (error || !ticket || !ticket.events) {
        return <div className="text-center text-red-500 p-8">Error: {error || 'Ticket not found'}</div>
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl md:text-3xl font-headline">Registration Successful!</CardTitle>
                    <CardDescription>
                        You have been successfully registered for {ticket.events.title}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center bg-background p-4 rounded-lg border">
                        <p className="font-semibold">Event Details</p>
                        <p className="text-muted-foreground">{ticket.events.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(ticket.events.date).toLocaleDateString()} at {ticket.events.location}
                        </p>
                        <p className="text-sm mt-2">
                            A confirmation email has been sent to <span className="font-semibold">{user.email}</span>.
                        </p>
                    </div>

                    <Card className="flex flex-col items-center justify-center p-6 text-center">
                        <CardHeader className="p-0">
                            <CardTitle>Your Event QR Code</CardTitle>
                            <CardDescription>Save this QR code or take a screenshot. You'll need it for event check-in.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex items-center justify-center">
                            <QrCodeGenerator qrToken={ticket.qr_token} />
                        </CardContent>
                        <CardContent className="p-0">
                             <p className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</p>
                        </CardContent>
                    </Card>

                     <div className="space-y-2 text-sm text-muted-foreground">
                        <h4 className="font-semibold text-foreground">Important Notes</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Keep your QR code safe and accessible on your mobile device.</li>
                            <li>Present this QR code at the event entrance for quick check-in.</li>
                            <li>You can always access your QR code from your dashboard.</li>
                            <li>Contact event organizers if you have any questions.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild className="w-full"><Link href="/dashboard/events">View My Events</Link></Button>
                        <Button asChild variant="outline" className="w-full"><Link href="/">Register for More Events</Link></Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

    