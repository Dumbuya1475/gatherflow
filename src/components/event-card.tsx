'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Ticket as TicketIcon, ScanEye } from 'lucide-react';
import type { EventWithAttendees } from '@/lib/types';
import { registerForEventAction } from '@/lib/actions/tickets';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

interface EventCardProps {
  event: EventWithAttendees;
  isLoggedIn: boolean;
  isScannerMode?: boolean;
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
        <Button type="submit" size="sm" disabled={pending} onClick={handleClick}>
            {pending ? 'Registering...' : 'Register'}
        </Button>
    )
}

export function EventCard({ event, isLoggedIn, isScannerMode = false }: EventCardProps) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(registerForEventAction, undefined);

    useEffect(() => {
        if(state?.error) {
            toast({
                variant: 'destructive',
                title: 'Registration Failed',
                description: state.error,
            });
        }
        if(state?.success) {
            toast({
                title: 'Registration Successful!',
                description: "You've got a ticket for this event.",
            });
        }
    }, [state, toast])


  return (
    <Card className="h-full flex flex-col overflow-hidden transition-transform transform-gpu hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="p-0">
        <Link href={isScannerMode ? '#' : `/dashboard/events/${event.id}/manage`} className="block relative aspect-[16/10] w-full">
          <Image
            src={event.cover_image || 'https://picsum.photos/600/400'}
            alt={event.title}
            fill
            data-ai-hint="event music"
            className="object-cover"
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        <h3 className="font-bold text-lg leading-tight truncate font-headline">{event.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 h-10 line-clamp-2">{event.description}</p>
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
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{event.attendees.toLocaleString()}</span>
            <span className="text-muted-foreground">/{event.capacity || '∞'}</span>
          </div>
          {isScannerMode ? (
            <Button size="sm">
              <ScanEye className="mr-2" />
              Start Scanning
            </Button>
          ) : isLoggedIn && event.ticket_id ? (
             <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/tickets/${event.ticket_id}`}>
                    <TicketIcon className="mr-2"/>
                    View Ticket
                </Link>
             </Button>
          ) : (
            <form action={formAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <RegisterButton eventId={event.id} isLoggedIn={isLoggedIn} />
            </form>
          )}
      </CardFooter>
    </Card>
  );
}
