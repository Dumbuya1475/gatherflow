'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAndCreateTicket } from '@/lib/actions/tickets';
import type { EventWithAttendees } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Registering...' : 'Register for Event'}
        </Button>
    )
}

export function RegisterForEventForm({ event }: { event: EventWithAttendees }) {
  const [state, action] = useActionState(registerAndCreateTicket, undefined);
  
  // No redirect here, success page will be rendered by the server action
  
  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">Register for Event</CardTitle>
            <CardDescription>Fill in your details to register for {event.title}</CardDescription>
        </CardHeader>
        <CardContent>
            <form action={action} className="grid gap-4">
                <input type="hidden" name="eventId" value={event.id} />
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input id="first-name" name="firstName" placeholder="John" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input id="last-name" name="lastName" placeholder="Doe" required />
                    </div>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
                </div>
                 <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                <SubmitButton />
                <p className="text-xs text-center text-muted-foreground px-4">
                    By registering, you agree to receive event updates and your unique QR code via email.
                </p>
            </form>
        </CardContent>
    </Card>
  );
}
