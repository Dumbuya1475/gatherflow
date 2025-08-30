'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useOptimistic, useTransition } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Ticket as TicketIcon, ScanEye, Eye, Pencil, DollarSign, XCircle } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { registerForEventAction, unregisterFromEventAction } from '@/lib/actions/tickets';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Badge } from './ui/badge';
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
} from './ui/alert-dialog';

interface EventCardProps {
  event: EventWithAttendees;
  isLoggedIn: boolean;
  isScannerMode?: boolean;
  isMyEvent?: boolean;
}

function RegisterButton({ eventId, isLoggedIn }: { eventId: number; isLoggedIn: boolean }) {
    const { pending } = useFormStatus();
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isLoggedIn) {
            e.preventDefault();
            router.push(`/events/${eventId}/register`);
        }
    }

    return (
        <Button type="submit" size="sm" className="flex-1" disabled={pending} onClick={handleClick}>
            {pending ? 'Registering...' : 'Register'}
        </Button>
    )
}

function UnregisterButton({ eventId }: { eventId: number }) {
  const { pending } = useFormStatus();
  return (
      <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1" disabled={pending}>
                  <XCircle className="mr-2 h-4 w-4" />
                  {pending ? 'Unregistering...' : 'Unregister'}
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This will permanently remove your ticket for this event. You will lose your spot, and you may not be able to register again if the event is full.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                      <Button type="submit" variant="destructive" form="unregister-form">
                          Yes, Unregister
                      </Button>
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
  );
}

export function EventCard({ event, isLoggedIn, isScannerMode = false, isMyEvent = false }: EventCardProps) {
    const { toast } = useToast();
    
    const [registerState, registerAction] = useActionState(registerForEventAction, undefined);
    const [unregisterState, unregisterAction] = useActionState(unregisterFromEventAction, undefined);

    useEffect(() => {
        if(registerState?.error) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: registerState.error,
            });
        }
        if(registerState?.success) {
            toast({
                title: 'Registration Successful!',
                description: "You've got a ticket for this event.",
            });
        }
    }, [registerState, toast])

     useEffect(() => {
        if(unregisterState?.error) {
            toast({
                variant: 'destructive',
                title: 'Failed to Unregister',
                description: unregisterState.error,
            });
        }
        if(unregisterState?.success) {
            toast({
                title: 'Unregistered Successfully',
                description: "You are no longer registered for this event.",
            });
        }
    }, [unregisterState, toast])


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
          <div className="absolute top-2 right-2">
            {event.is_paid ? (
                <Badge className="bg-primary/80 backdrop-blur-sm">
                    <DollarSign className="mr-1 h-3 w-3" />
                     {event.price ? `SLE ${Number(event.price).toLocaleString()}`: 'Paid'}
                </Badge>
            ) : (
                <Badge variant="secondary" className='bg-secondary/80 backdrop-blur-sm'>Free</Badge>
            )}
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <h3 className="font-bold text-lg leading-tight truncate font-headline">{event.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 h-10 line-clamp-2">{event.description || ''}</p>
        <div className="mt-2 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col items-stretch gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{event.attendees.toLocaleString()}</span>
                <span className="text-muted-foreground">/{event.capacity || '∞'}</span>
            </div>
          </div>
          {isScannerMode ? (
            <Button size="sm" className="w-full">
              <ScanEye className="mr-2" />
              Start Scanning
            </Button>
          ) : isMyEvent ? (
             <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/events/${event.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
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
                {!event.ticket_id && (
                    <form action={registerAction} className="flex-1">
                        <input type="hidden" name="eventId" value={event.id} />
                        <RegisterButton eventId={event.id} isLoggedIn={isLoggedIn} />
                    </form>
                )}
                 {event.ticket_id && (
                    <form action={unregisterAction} id="unregister-form" className="flex-1">
                      <input type="hidden" name="ticketId" value={event.ticket_id} />
                      <UnregisterButton eventId={event.id} />
                    </form>
                 )}
            </div>
          )}
      </CardFooter>
    </Card>
  );
}
