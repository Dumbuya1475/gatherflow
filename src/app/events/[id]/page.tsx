
'use client';

import { getEventDetails } from "@/lib/actions/events";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Eye, DollarSign, Share2, Globe, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from 'date-fns';
import { useEffect, useState } from "react";
import { EventWithAttendees } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


async function getTicketId(eventId: number, userId?: string) {
    if (!userId) return null;
    const supabase = createClient();
    const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();
    return ticket?.id;
}


export default function EventDetailsPage({ params }: { params: { id: string } }) {
    const { toast } = useToast();
    const [event, setEvent] = useState<EventWithAttendees | null>(null);
    const [user, setUser] = useState<any>(null);
    const [ticketId, setTicketId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const eventId = parseInt(params.id, 10);

    useEffect(() => {
        const fetchInitialData = async () => {
            const supabase = createClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            const { data: eventData, error } = await getEventDetails(eventId);
            if (error || !eventData) {
                toast({ variant: 'destructive', title: 'Error', description: error || 'Event not found.' });
                setLoading(false);
                return;
            }
            
            if (!eventData.is_public && eventData.organizer_id !== currentUser?.id) {
                 toast({ variant: 'destructive', title: 'Private Event', description: 'This event is private and can only be viewed by the organizer.' });
                 setEvent(null);
            } else {
                setEvent(eventData);
            }

            if (currentUser && eventData) {
                const fetchedTicketId = await getTicketId(eventData.id, currentUser.id);
                setTicketId(fetchedTicketId);
            }
            setLoading(false);
        };

        fetchInitialData();
    }, [eventId, toast]);

    const handleShare = async () => {
        if (navigator.share && event) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description || '',
                    url: window.location.href,
                });
                toast({ title: 'Event Shared!', description: 'The event link has been copied to your clipboard.' });
            } catch (error) {
                console.error('Error sharing:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not share the event.' });
            }
        } else {
            // Fallback for browsers that do not support the Web Share API
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'The event link has been copied to your clipboard.' });
        }
    };
    
    if (loading) {
        return (
             <div className="bg-secondary min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
             </div>
        )
    }

    if (!event) {
        return <div className="flex items-center justify-center min-h-screen text-center text-red-500 p-8">Error: This event is private or does not exist.</div>
    }

    const isOwner = user && user.id === event.organizer_id;
    const isFull = event.capacity ? event.attendees >= event.capacity : false;

    return (
        <div className="bg-secondary min-h-screen">
            <div className="container mx-auto py-8 sm:py-12 md:py-16">
                 <div className="mb-6 flex justify-between items-center">
                    <Button asChild variant="outline">
                        <Link href={user ? "/dashboard/events" : "/"}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Events
                        </Link>
                    </Button>
                     <Button variant="outline" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Event
                    </Button>
                </div>
                <Card className="overflow-hidden">
                    <div className="relative h-64 md:h-96 w-full">
                        <Image
                            src={event.cover_image || 'https://picsum.photos/1200/400'}
                            alt={event.title}
                            fill
                            data-ai-hint="event concert"
                            className="object-cover"
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
                                    {isOwner && (
                                        <Button asChild className="w-full">
                                            <Link href={`/dashboard/events/${event.id}/manage`}>Manage Event</Link>
                                        </Button>
                                    )}
                                    {!isOwner && ticketId && (
                                         <Button asChild className="w-full">
                                            <Link href={`/dashboard/tickets/${ticketId}`}>View Ticket</Link>
                                        </Button>
                                    )}
                                     {!isOwner && !ticketId && (
                                        isFull ? (
                                            <Button className="w-full" disabled>Event Full</Button>
                                        ) : (
                                            <Button asChild className="w-full">
                                                <Link href={`/events/${event.id}/register`}>Register Now</Link>
                                            </Button>
                                        )
                                    )}
                                 </CardContent>
                             </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

    