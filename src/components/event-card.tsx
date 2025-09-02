
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Ticket as TicketIcon, ScanEye, Eye, Pencil, DollarSign, Timer, User, X, Clock } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { registerForEventAction, unregisterForEventAction } from '@/lib/actions/tickets';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
import { differenceInDays, isPast, isToday, formatDistanceStrict } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EventCardProps {
  event: EventWithAttendees;
  isLoggedIn: boolean;
  isScannerMode?: boolean;
  isMyEvent?: boolean;
}

function RegisterButton({ eventId, isLoggedIn, isFull }: { eventId: number; isLoggedIn: boolean, isFull: boolean }) {
    const { pending } = useFormStatus();
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isLoggedIn) {
            e.preventDefault();
            router.push(`/events/${eventId}/register`);
        }
    }

    if(isFull) {
        return <Button size="sm" className="flex-1" disabled>Event Full</Button>
    }

    return (
        <Button type="submit" size="sm" className="flex-1" disabled={pending} onClick={handleClick}>
            {pending ? 'Registering...' : 'Register'}
        </Button>
    )
}


export function EventCard({ event, isLoggedIn, isScannerMode = false, isMyEvent = false }: EventCardProps) {
    const { toast } = useToast();
    const router = useRouter();
    
    const [registerState, registerAction] = useActionState(registerForEventAction, undefined);
    const [unregisterState, unregisterAction] = useActionState(unregisterForEventAction, undefined);


    useEffect(() => {
        if(registerState?.error) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: registerState.error,
            });
        }
        if(registerState?.success && registerState.ticketId) {
            toast({
                title: 'Registration Successful!',
                description: "You've got a ticket for this event.",
            });
            router.push(`/dashboard/tickets/${registerState.ticketId}`);
        }
    }, [registerState, toast, router]);

    useEffect(() => {
      if (unregisterState?.error) {
        toast({
          variant: 'destructive',
          title: 'Unregistration Failed',
          description: unregisterState.error,
        });
      }
      if (unregisterState?.success) {
        toast({
          title: 'Unregistered Successfully',
          description: "You have cancelled your registration for this event.",
        });
        // This is a client component, a hard refresh might be needed or better state management
        // For now, we rely on the revalidation from the server action.
         router.refresh();
      }
    }, [unregisterState, toast, router]);

    const daysLeft = useMemo(() => {
      const eventDate = new Date(event.date);
      if (isPast(eventDate) && !isToday(eventDate)) return null;
      if (isToday(eventDate)) return 'Today';
      const days = differenceInDays(eventDate, new Date());
      return `${days + 1} day${days + 1 > 1 ? 's' : ''} left`;
    }, [event.date]);

    const eventDuration = useMemo(() => {
        if (!event.end_date) return "1 Day";
        const days = differenceInDays(new Date(event.end_date), new Date(event.date));
        if (days < 1) return "1 Day"; // Same day event
        return `${days + 1} Day${days + 1 > 1 ? 's' : ''}`;
    }, [event.date, event.end_date]);


    const organizerName = useMemo(() => {
        if (!event.organizer) return 'Anonymous';
        return `${event.organizer.first_name || ''} ${event.organizer.last_name || ''}`.trim() || 'Anonymous';
    }, [event.organizer]);
    
    const isFull = event.capacity ? event.attendees >= event.capacity : false;

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-transform transform-gpu hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={isScannerMode ? '#' : `/events/${event.id}`} className="block relative aspect-[16/10] w-full">
          <Image
            src={event.cover_image || 'https://picsum.photos/600/400'}
            alt={event.title}
            fill
            data-ai-hint="event music"
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
             <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
                <Clock className="mr-1 h-3 w-3" />
                {eventDuration}
            </Badge>
            {daysLeft && (
              <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
                <Timer className="mr-1 h-3 w-3" />
                {daysLeft}
              </Badge>
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <h3 className="font-bold text-lg leading-tight whitespace-normal font-headline">{event.title}</h3>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </div>
           <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="truncate">Organized by {organizerName}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-stretch gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.attendees.toLocaleString()}</span>
                {event.capacity && <span className="text-muted-foreground">/{event.capacity}</span>}
            </div>
            {event.is_paid ? (
              <div className="flex items-center gap-1 font-semibold text-primary">
                  <DollarSign className="h-4 w-4" />
                   {event.price ? `SLE ${Number(event.price).toLocaleString()}`: 'Paid'}
              </div>
              ) : (
              <Badge variant="outline">Free</Badge>
              )}
          </div>
          {isScannerMode ? (
            <Button size="sm" className="w-full">
              <ScanEye className="mr-2" />
              Start Scanning
            </Button>
          ) : isMyEvent ? (
             <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/dashboard/events/${event.id}/manage`}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage
                    </Link>
                </Button>
                 <Button asChild size="sm" className="flex-1">
                    <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
            </div>
          ) : (
            <div className="flex gap-2">
                 <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/events/${event.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                    </Link>
                </Button>
                {event.ticket_id ? (
                     <div className="flex-1 flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                            <Link href={`/dashboard/tickets/${event.ticket_id}`}>
                                <TicketIcon className="mr-2 h-4 w-4" />
                                View Ticket
                            </Link>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your registration for this event? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
                              <form action={unregisterAction}>
                                <input type="hidden" name="ticketId" value={event.ticket_id} />
                                <AlertDialogAction type="submit">Yes, Cancel</AlertDialogAction>
                              </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ) : (
                    <form action={registerAction} className="flex-1">
                        <input type="hidden" name="eventId" value={event.id} />
                        <RegisterButton eventId={event.id} isLoggedIn={isLoggedIn} isFull={isFull} />
                    </form>
                )}
            </div>
          )}
      </CardFooter>
    </Card>
  );
}
