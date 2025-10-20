
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerAndCreateTicket, registerGuestForEvent } from '@/lib/actions/tickets.tsx';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EventWithAttendees, EventFormField } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@supabase/supabase-js';

function SubmitButton({ isFull, isPaid }: { isFull: boolean, isPaid: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending || isFull}>
            {isFull ? 'Event is Full' : (pending ? (isPaid ? 'Processing...' : 'Registering...') : (isPaid ? 'Proceed to Payment' : 'Register for Event'))}
        </Button>
    )
}

export function RegisterForEventForm({ event, formFields, user }: { event: EventWithAttendees, formFields: EventFormField[], user: User | null }) {
  const [state, setState] = useState<{error?: string}>({});
  const { pending } = useFormStatus();

  const isFull = event.capacity ? event.attendees >= event.capacity : false;
  const isPaid = event.is_paid && event.price > 0;

  const handleSubmit = async (eventTarget: React.FormEvent<HTMLFormElement>) => {
    eventTarget.preventDefault();
    setState({});

    const formData = new FormData(eventTarget.currentTarget);
    const formResponses = formFields.map(field => ({
        form_field_id: field.id,
        field_value: formData.get(`custom_field_${field.id}`) as string,
    }));

    if (isPaid) {
        // Paid event flow
        const payload = {
            eventId: event.id,
            userId: user?.id,
            firstName: user ? user.user_metadata.first_name : formData.get('firstName'),
            lastName: user ? user.user_metadata.last_name : formData.get('lastName'),
            email: user ? user.email : formData.get('email'),
            formResponses,
        };

        const response = await fetch('/api/checkout/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            setState({ error: data.error || 'Failed to create checkout session.' });
        } else {
            window.location.href = data.checkoutUrl;
        }
    } else {
        // Free event flow
        const action = user ? registerAndCreateTicket : registerGuestForEvent;
        const result = await action(undefined, formData);
        if (result?.error) {
            setState({ error: result.error });
        }
    }
  };
  
  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isPaid ? 'Buy Ticket' : 'Register for Event'}</CardTitle>
            <CardDescription>{isPaid ? `Fill in your details to buy a ticket for ${event.title}` : `Fill in your details to register for ${event.title}`}</CardDescription>
            {isPaid && <p className="text-2xl font-bold">Price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SLE' }).format(event.price!)}</p>}
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
                <input type="hidden" name="eventId" value={event.id} />
                {user ? (
                    <>
                        <input type="hidden" name="userId" value={user.id} />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first-name">First name</Label>
                                <Input id="first-name" name="firstName" defaultValue={user.user_metadata.first_name} readOnly />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last-name">Last name</Label>
                                <Input id="last-name" name="lastName" defaultValue={user.user_metadata.last_name} readOnly />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={user.email} readOnly />
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}

                {formFields.map(field => (
                  <div key={field.id} className="grid gap-2">
                    <Label htmlFor={`custom-field-${field.id}`}>{field.field_name}</Label>
                    {field.field_type === 'text' && <Input id={`custom-field-${field.id}`} name={`custom_field_${field.id}`} type="text" required={field.is_required} />}
                    {field.field_type === 'number' && <Input id={`custom-field-${field.id}`} name={`custom_field_${field.id}`} type="number" required={field.is_required} />}
                    {field.field_type === 'date' && <Input id={`custom-field-${field.id}`} name={`custom_field_${field.id}`} type="date" required={field.is_required} />}
                    {field.field_type === 'boolean' && <Checkbox id={`custom-field-${field.id}`} name={`custom_field_${field.id}`} />}
                    {field.field_type === 'dropdown' && (
                      <Select name={`custom_field_${field.id}`} required={field.is_required}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option.id} value={option.value}>{option.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.field_type === 'multiple-choice' && (
                      <RadioGroup name={`custom_field_${field.id}`} required={field.is_required}>
                        {field.options?.map(option => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`option-${option.id}`} />
                            <Label htmlFor={`option-${option.id}`}>{option.value}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    {field.field_type === 'checkboxes' && (
                        <div>
                            {field.options?.map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox id={`option-${option.id}`} name={`custom_field_${field.id}`} value={option.value} />
                                    <Label htmlFor={`option-${option.id}`}>{option.value}</Label>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                ))}

                {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                <SubmitButton isFull={isFull} isPaid={isPaid} />
                <p className="text-xs text-center text-muted-foreground px-4">
                    By registering, you agree to receive event updates and your unique QR code via email.
                </p>
            </form>
        </CardContent>
    </Card>
  );
}
