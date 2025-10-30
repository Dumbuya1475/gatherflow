
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCodeGenerator } from "@/components/tickets/qr-code-generator";
import { Calendar, MapPin, Clock, Ban, UserRoundCheck, UserRoundX } from "lucide-react";
import Link from "next/link";
import type { Ticket, Event } from "@/lib/types";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

import { UpgradeAccountPrompt } from "./upgrade-account-prompt";

interface TicketWithEvent extends Omit<Ticket, 'status'> {
    // Extend the base Ticket status union locally to include UI-only statuses used in this component
    status: Ticket['status'] | 'pending' | 'rejected';
    events: Event & { organizer?: { first_name: string | null, last_name: string | null } | null } | null;
    profiles: { first_name?: string, last_name?: string, is_guest?: boolean, id?: string, email?: string } | null;
    form_responses: { field_value: string, event_form_fields: { field_name: string } }[];
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
                        <Image 
                            src={events.ticket_brand_logo} 
                            alt="Brand Logo" 
                            width={120} 
                            height={120} 
                            className="mx-auto mb-4 rounded-full"
                            unoptimized={!!events.ticket_brand_logo?.includes('supabase.co')}
                        />
                    )}
                    <h1 className="text-4xl font-bold text-white font-headline">{events.title}</h1>
                    <p className="text-lg text-gray-200">{events.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-white">
                        <div className="flex items-center gap-4 mb-4">
                            <Calendar className="h-6 w-6" />
                            <span className="font-medium text-lg">{format(new Date(events.date), 'PPP p')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6" />
                            <span className="font-medium text-lg">{events.location}</span>
                        </div>
                        <div className="mt-6">
                            <Button asChild variant="outline">
                                <Link href={`/events/${ticket.event_id}`}>View Event</Link>
                            </Button>
                        </div>
                        <div className="mt-6 text-white">
                            <h3 className="text-xl font-bold mb-4">Attendee Details</h3>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{ticket.profiles?.first_name} {ticket.profiles?.last_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{ticket.profiles?.email}</span>
                            </div>
                            {ticket.form_responses && ticket.form_responses.length > 0 && (
                                <div className="pt-4 mt-4 border-t border-gray-600">
                                    {ticket.form_responses.map((response, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="font-medium">{response.event_form_fields.field_name}:</span>
                                            <span>{response.field_value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white rounded-lg p-6">
                        <div className="space-y-4 mb-4 text-center">
                            {ticket.status === 'pending' && (
                                <Badge className="bg-yellow-500 text-white">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Pending Approval
                                </Badge>
                            )}
                            {ticket.status === 'rejected' && (
                                <Badge className="bg-red-500 text-white">
                                    <Ban className="mr-2 h-4 w-4" />
                                    Rejected
                                </Badge>
                            )}
                            {ticket.status === 'approved' && ticket.checked_out && ticket.checked_out_at && (
                                <Badge className="bg-gray-700 text-white">
                                    <UserRoundX className="mr-2 h-4 w-4" />
                                    Checked Out at {new Date(ticket.checked_out_at).toLocaleTimeString()}
                                </Badge>
                            )}
                            {ticket.status === 'approved' && ticket.checked_in && !ticket.checked_out && ticket.checked_in_at && (
                                <Badge className="bg-blue-500 text-white">
                                    <UserRoundCheck className="mr-2 h-4 w-4" />
                                    Checked In at {new Date(ticket.checked_in_at).toLocaleTimeString()}
                                </Badge>
                            )}
                            {ticket.status === 'approved' && !ticket.checked_in && !ticket.checked_out && (
                                <Badge className="bg-green-500 text-white">
                                    <UserRoundCheck className="mr-2 h-4 w-4" />
                                    Approved
                                </Badge>
                            )}
                        </div>
                        
                        {/* Only show QR code for approved tickets with QR token */}
                        {ticket.status === 'approved' && ticket.qr_token ? (
                            <>
                                <QrCodeGenerator qrToken={ticket.qr_token} />
                                <p className="text-xs text-muted-foreground mt-4">Ticket ID: {ticket.id}</p>
                            </>
                        ) : (
                            <div className="text-center text-gray-500 p-4">
                                {ticket.status === 'pending' && "QR Code will appear once approved"}
                                {ticket.status === 'rejected' && "Access denied"}
                            </div>
                        )}
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
                        Your registration is awaiting approval from the event organizer. You will be notified once it&apos;s confirmed.
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-4">
                        Your QR code will appear here once approved.
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
                    <p className="text-sm text-red-600 dark:text-red-300 mt-4">
                        No QR code is available for rejected tickets.
                    </p>
                </div>
            );
        }

        // Approved ticket
        return (
            <Card className="flex flex-col items-center justify-center p-6">
                <CardHeader className="p-0 text-center">
                    <CardTitle>Scan QR Code</CardTitle>
                    <CardDescription>This is your unique ticket</CardDescription>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col items-center justify-center">
                    <div className="space-y-4 mb-4 text-center">
                        {ticket.checked_out && ticket.checked_out_at && (
                            <Badge className="bg-gray-700 text-white">
                                <UserRoundX className="mr-2 h-4 w-4" />
                                Checked Out at {new Date(ticket.checked_out_at).toLocaleTimeString()}
                            </Badge>
                        )}
                        {ticket.checked_in && !ticket.checked_out && ticket.checked_in_at && (
                             <Badge className="bg-blue-500 text-white">
                                <UserRoundCheck className="mr-2 h-4 w-4" />
                                Checked In at {new Date(ticket.checked_in_at).toLocaleTimeString()}
                            </Badge>
                        )}
                        {!ticket.checked_in && !ticket.checked_out && (
                            <Badge className="bg-green-500 text-white">
                                <UserRoundCheck className="mr-2 h-4 w-4" />
                                Ready for Check-in
                            </Badge>
                        )}
                    </div>
                    
                    {/* Only show QR code if ticket is approved AND has qr_token */}
                    {ticket.qr_token ? (
                        <QrCodeGenerator qrToken={ticket.qr_token} />
                    ) : (
                        <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="text-lg font-medium">QR Code Unavailable</div>
                            <div className="text-sm mt-2">
                                {ticket.status === 'approved' ? "QR code generation failed" : "QR code unavailable"}
                            </div>
                        </div>
                    )}
                </CardContent>
                 <CardContent className="p-0">
                     <p className="text-xs text-muted-foreground">Ticket ID: {ticket.id}</p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto max-w-5xl py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
                        Your Ticket
                    </h1>
                    <p className="text-muted-foreground">
                        {ticket.status === 'approved' && ticket.qr_token 
                            ? 'Present this QR code at the event entrance.' 
                            : ticket.status === 'pending'
                            ? 'Your registration is pending approval.'
                            : ticket.status === 'rejected'
                            ? 'Your registration was not approved.'
                            : 'Your ticket status is shown below.'
                        }
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 space-y-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{ticket.events.title}</CardTitle>
                            <CardDescription>{ticket.events.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{format(new Date(ticket.events.date), 'PPP p')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{ticket.events.location}</span>
                            </div>
                            
                            {/* Status indicator in event card */}
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    {ticket.status === 'pending' && (
                                        <>
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm text-yellow-600 font-medium">Pending Approval</span>
                                        </>
                                    )}
                                    {ticket.status === 'approved' && (
                                        <>
                                            <UserRoundCheck className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-green-600 font-medium">Approved</span>
                                        </>
                                    )}
                                    {ticket.status === 'rejected' && (
                                        <>
                                            <Ban className="h-4 w-4 text-red-500" />
                                            <span className="text-sm text-red-600 font-medium">Rejected</span>
                                        </>
                                    )}
                                </div>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Attendee Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{ticket.profiles?.first_name} {ticket.profiles?.last_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{ticket.profiles?.email}</span>
                        </div>
                        {ticket.form_responses && ticket.form_responses.length > 0 && (
                            <div className="pt-4 border-t">
                                {ticket.form_responses.map((response, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="font-medium">{response.event_form_fields.field_name}:</span>
                                        <span>{response.field_value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                {ticket.profiles?.is_guest && (
                    <UpgradeAccountPrompt userId={ticket.profiles.id!} />
                )}
            </div>
        </div>
    )
}

    