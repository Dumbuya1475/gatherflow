import { getTicketDetails } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCodeGenerator } from "./_components/qr-code-generator";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";


export default async function TicketPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { data: ticket, error } = await getTicketDetails(id);

    if (error || !ticket || !ticket.events) {
        return <div className="text-center text-red-500">Error: {error || 'Ticket not found'}</div>
    }

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Your Ticket
                    </h1>
                    <p className="text-muted-foreground">
                        Present this QR code at the event entrance.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{ticket.events.title}</CardTitle>
                            <CardDescription>{ticket.events.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{new Date(ticket.events.date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{ticket.events.location}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline">
                                <Link href={`/events/${ticket.event_id}`}>View Event</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card className="flex flex-col items-center justify-center p-6">
                        <CardHeader className="p-0 text-center">
                            <CardTitle>Scan QR Code</CardTitle>
                            <CardDescription>This is your unique ticket</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex items-center justify-center">
                            <QrCodeGenerator qrToken={ticket.qr_code_token} />
                        </CardContent>
                         <CardContent className="p-0">
                             <p className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
