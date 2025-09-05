'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCodeGenerator } from "./qr-code-generator";
import { Calendar, MapPin, Clock, Ban } from "lucide-react";
import Link from "next/link";
import type { Ticket, Event } from "@/lib/types";
import Image from 'next/image';

interface TicketWithEvent extends Ticket {
    events: Event & { organizer?: { first_name: string | null, last_name: string | null } | null } | null;
}

const BrandedTicket = ({ ticket }: { ticket: TicketWithEvent }) => {
    const { events } = ticket;
    if (!events) return null;

    const brandColor = events.ticket_brand_color || '#000000';

    return (
        <div 
            className="relative rounded-lg shadow-lg overflow-hidden bg-cover bg-center" 
            style={{ backgroundColor: brandColor, backgroundImage: `url(${events.ticket_background_image || ''})` }}
        >
            <div className="bg-black bg-opacity-50 p-8">
                <div className="text-center mb-8">
                    {events.ticket_brand_logo && (
                        <Image src={events.ticket_brand_logo} alt="Brand Logo" width={120} height={120} className="mx-auto mb-4 rounded-full" />
                    )}
                    <h1 className="text-4xl font-bold text-white font-headline">{events.title}</h1>
                    <p className="text-lg text-gray-200">{events.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <Calendar className="h-6 w-6" />
                            <span className="font-medium text-lg">{new Date(events.date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6" />
                            <span className="font-medium text-lg">{events.location}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white rounded-lg p-6">
                        <QrCodeGenerator qrToken={ticket.qr_token} />
                        <p className="text-xs text-muted-foreground mt-4">Ticket ID: {ticket.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TicketView({ ticket }: { ticket: TicketWithEvent }) {

    if (!ticket.events) {
        return <div className="text-center text-red-500 p-8">Error: Event details are missing for this ticket.</div>
    }

    const hasBranding = ticket.events.ticket_brand_logo || ticket.events.ticket_background_image || ticket.events.ticket_brand_color;

    if (hasBranding) {
        return <BrandedTicket ticket={ticket} />;
    }

    const StatusDisplay = () => {
        if (ticket.status === 'pending') {
            return (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <Clock className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mb-4" />
                    <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">Registration Pending</h3>
                    <p className="text-yellow-600 dark:text-yellow-300 mt-2">
                        Your registration is awaiting approval from the event organizer. You will be notified once it's confirmed.
                    </p>
                </div>
            );
        }

        if (ticket.status === 'rejected') {
            return (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-red-100 dark:bg-red-900/20 rounded-lg">
                    <Ban className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
                    <h3 className="text-xl font-semibold text-red-800 dark:text-red-200">Registration Rejected</h3>
                    <p className="text-red-600 dark:text-red-300 mt-2">
                        Unfortunately, your registration for this event has been rejected.
                    </p>
                </div>
            );
        }

        return (
            <Card className="flex flex-col items-center justify-center p-6">
                <CardHeader className="p-0 text-center">
                    <CardTitle>Scan QR Code</CardTitle>
                    <CardDescription>This is your unique ticket</CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex items-center justify-center">
                    <QrCodeGenerator qrToken={ticket.qr_token} />
                </CardContent>
                 <CardContent className="p-0">
                     <p className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Your Ticket
                    </h1>
                    <p className="text-muted-foreground">
                        {ticket.status === 'approved' ? 'Present this QR code at the event entrance.' : 'Your ticket status is shown below.'}
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
                    <StatusDisplay />
                </div>
            </div>
        </div>
    )
}