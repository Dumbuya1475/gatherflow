
'use server';

import React from 'react';
import { getEventDetails } from "@/lib/server/queries/events";
import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Eye, DollarSign, Share2, Globe, Lock, Building2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from 'date-fns';
import { EventWithAttendees } from "@/lib/types";
import { ShareButton } from "./_components/share-button";
import { ResendTicketForm } from "./_components/resend-ticket-form";
import { PublicHeader } from "@/components/public-header";
import { cookies } from 'next/headers';


async function getTicketId(eventId: number, userId?: string) {
    if (!userId) return null;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
    return ticket?.id;
}


export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const eventId = parseInt(id, 10);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: event, error } = await getEventDetails(eventId);

    if (error || !event) {
        return <div className="flex items-center justify-center min-h-screen text-center text-red-500 p-8">Error: {error || 'This event could not be found.'}</div>
    }

    if (!event.is_public && event.organizer_id !== user?.id) {
        return <div className="flex items-center justify-center min-h-screen text-center text-red-500 p-8">Error: This event is private and can only be viewed by the organizer.</div>
    }
    // If a user is logged in, prefer the dashboard-style view which includes the sidebar.
    if (user) {
        // Redirect to the dashboard view for this event (preview under dashboard layout)
        redirect(`/dashboard/events/${eventId}/view`);
    }
    
    // After redirect check, user is null (public view only)
    const isFull = event.capacity ? event.attendees >= event.capacity : false;

    return (
        <>
            <PublicHeader />
            <div className="bg-secondary min-h-screen">
                <div className="container mx-auto py-8 sm:py-12 md:py-16">
                    <div className="mb-6 flex justify-between items-center">
                        <Button asChild variant="outline">
                            <Link href={user ? "/dashboard/events" : "/"}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Events
                            </Link>
                        </Button>
                        <ShareButton event={event} />
                    </div>
                <Card className="overflow-hidden">
                    <div className="relative h-64 md:h-96 w-full">
                        <Image
                            src={event.cover_image || 'https://picsum.photos/1200/400'}
                            alt={event.title}
                            fill
                            data-ai-hint="event concert"
                            className="object-cover"
                            unoptimized={!!event.cover_image?.includes('supabase.co')}
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>
                    <CardHeader className="relative -mt-16 md:-mt-20 z-10 p-4 md:p-6">
                        <CardTitle className="text-3xl md:text-4xl font-headline text-white">{event.title}</CardTitle>
                    </CardHeader>
                     <CardContent className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            
                            <div>
                                <h3 className="text-xl font-semibold mb-2">About this event</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                            </div>
                             <div>
                                <h3 className="text-xl font-semibold mb-2">Date and time</h3>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-5 w-5" />
                                    <span>
                                        {format(new Date(event.date), 'PPPP p')}
                                        {event.end_date && ` - ${format(new Date(event.end_date), 'p')}`}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Location</h3>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-5 w-5" />
                                    <span>{event.location}</span>
                                </div>
                            </div>

                            {event.organization && (
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Hosted by</h3>
                                    <Card className="bg-muted/50">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <Building2 className="h-6 w-6 text-primary mt-1" />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-lg">{event.organization.name}</h4>
                                                    {event.organization.description && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {event.organization.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                                        {event.organization.website && (
                                                            <a
                                                                href={event.organization.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-primary hover:underline"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                Website
                                                            </a>
                                                        )}
                                                        {event.organization.location && (
                                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />
                                                                {event.organization.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                             <Card className="bg-secondary">
                                 <CardContent className="p-4 space-y-4">
                                     <div className="flex items-center gap-2">
                                        {event.is_public ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}
                                        <div className="flex-1">
                                            <p className="font-semibold">{event.is_public ? 'Public Event' : 'Private Event'}</p>
                                            <p className="text-xs text-muted-foreground">Visibility</p>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="font-semibold">{event.attendees} / {event.capacity || 'Unlimited'}</p>
                                            <p className="text-xs text-muted-foreground">Attendees</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {event.is_paid ? <DollarSign className="h-5 w-5 text-primary" /> : <Ticket className="h-5 w-5 text-primary" />}
                                        <div className="flex-1">
                                            <p className="font-semibold">{event.is_paid && event.price ? `SLE ${Number(event.price).toLocaleString()}` : 'Free'}</p>
                                            <p className="text-xs text-muted-foreground">Price</p>
                                        </div>
                                    </div>
                                    {isFull ? (
                                        <Button className="w-full" disabled>Event Full</Button>
                                    ) : (
                                        <Button asChild className="w-full">
                                            <Link href={`/events/${event.id}/register`}>Register Now</Link>
                                        </Button>
                                    )}
                                 </CardContent>
                             </Card>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-8">
                    <ResendTicketForm eventId={event.id} />
                </div>
                </div>
            </div>
        </>
    )
}
