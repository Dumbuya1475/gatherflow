'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resendTicketLinkAction } from '@/lib/actions/tickets';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Resend Ticket'}
    </Button>
  );
}

export function ResendTicketForm({ eventId }: { eventId: number }) {
  const [state, formAction] = useFormState(resendTicketLinkAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lost Your Ticket?</CardTitle>
        <CardDescription>
          Enter your email address below to have your ticket link resent to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="eventId" value={eventId} />
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="me@example.com" required />
          </div>
          <SubmitButton />
          {state?.error && <p className="text-red-500">{state.error}</p>}
          {state?.success && <p className="text-green-500">If a ticket is found for this email, it has been resent.</p>}
        </form>
      </CardContent>
    </Card>
  );
}
