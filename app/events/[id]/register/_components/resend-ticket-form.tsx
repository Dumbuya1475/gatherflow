
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
  const [state, formAction] = useActionState(resendTicketLinkAction, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lost Your Ticket?</CardTitle>
        <CardDescription>
          Enter the email address you used to register and we&apos;ll resend your ticket link.
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
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-green-600">If an account with that email exists for this event, a new ticket link has been sent.</p>}
        </form>
      </CardContent>
    </Card>
  );
}
