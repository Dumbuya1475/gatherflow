'use client';

import { useState, useActionState, useEffect } from 'react';
import type { Attendee, Event } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { unregisterAttendeeAction } from "@/lib/actions/tickets";
import { deleteEventAction } from "@/lib/actions/events";
import { CheckCircle, XCircle, Trash2, Eye, Clock, Ban, UserSearch, UserPlus, Settings, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ReviewAttendeeModal } from "./review-attendee-modal";
import { RefreshButton } from "./refresh-button";
import { useToast } from "@/hooks/use-toast";

function EventInfo({ event }: { event: Event & { attendees: number } }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Capacity:</strong> {event.capacity || 'Unlimited'}</p>
            </CardContent>
        </Card>
    )
}

function ApprovalsTab({ 
    event, 
    attendees,
    onViewAttendee 
}: { 
    event: Event, 
    attendees: Attendee[],
    onViewAttendee: (attendee: Attendee) => void;
}) {
    const pendingAttendees = attendees.filter(a => a.status === 'pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve or reject applicants.</CardDescription>
            </CardHeader>
            <CardContent>
                {pendingAttendees.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingAttendees.map((attendee) => (
                                <TableRow key={attendee.ticket_id}>
                                    <TableCell>{attendee.first_name} {attendee.last_name}</TableCell>
                                    <TableCell>{attendee.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => onViewAttendee(attendee)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground p-8">No pending applications.</div>
                )}
            </CardContent>
        </Card>
    )
}

function AttendeesTab({ event, attendees }: { event: Event, attendees: Attendee[] }) {
    const { toast } = useToast();
    const [unregisterState, unregisterAction] = useActionState(unregisterAttendeeAction, undefined);

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
                description: "Attendee has been unregistered.",
            });
        }
    }, [unregisterState, toast]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Attendees</CardTitle>
                <CardDescription>View and manage your event attendees.</CardDescription>
            </CardHeader>
            <RefreshButton eventId={event.id} />
            <CardContent>
                {attendees.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendees.map((attendee) => {
                                let statusText = 'Unknown';
                                let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';

                                if (attendee.status === 'approved') {
                                    statusText = 'Approved';
                                    variant = 'default';
                                }
                                if (attendee.status === 'pending') {
                                    statusText = 'Pending';
                                    variant = 'secondary';
                                }
                                if (attendee.status === 'rejected') {
                                    statusText = 'Rejected';
                                    variant = 'destructive';
                                }
                                if (attendee.checked_in) {
                                    statusText = 'Checked In';
                                    variant = 'default';
                                }
                                if (attendee.checked_out) {
                                    statusText = 'Checked Out';
                                    variant = 'secondary';
                                }

                                return (
                                    <TableRow key={attendee.ticket_id}>
                                        <TableCell>{attendee.first_name} {attendee.last_name}</TableCell>
                                        <TableCell>{attendee.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={variant}>
                                                {statusText}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button asChild variant="outline" size="icon">
                                                <Link href={`/dashboard/tickets/${attendee.ticket_id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <form action={unregisterAction} className="inline-block">
                                                <input type="hidden" name="ticketId" value={attendee.ticket_id} />
                                                <input type="hidden" name="eventId" value={event.id} />
                                                <Button type="submit" variant="destructive" size="icon">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground p-8">No attendees yet.</div>
                )}
            </CardContent>
        </Card>
    )
}

function SettingsTab({ event }: { event: { id: number }}) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                These actions are irreversible. Please proceed with caution.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <div>
                    <p className="font-semibold">Delete this event</p>
                    <p className="text-sm text-muted-foreground">Once you delete an event, all associated data including tickets will be permanently removed.</p>
                </div>
                <form action={deleteEventAction} className="inline-block">
                    <input type="hidden" name="eventId" value={event.id} />
                    <Button type="submit" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

interface ManageEventViewProps {
  event: Event & { attendees: number };
  initialAttendees: Attendee[];
}

export function ManageEventView({ event, initialAttendees }: ManageEventViewProps) {
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedAttendee(null);
    setIsModalOpen(false);
  };

  const defaultTab = event.requires_approval ? "approvals" : "attendees";

  return (
    <>
        <ReviewAttendeeModal
            attendee={selectedAttendee}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            eventId={event.id}
        />
        <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
                <EventInfo event={event} />
            </div>
            <div className="md:col-span-3">
                <Tabs defaultValue={defaultTab}>
                    <TabsList>
                        {event.requires_approval && <TabsTrigger value="approvals"><UserPlus className="mr-2 h-4 w-4" />Approvals</TabsTrigger>}
                        <TabsTrigger value="attendees"><Users className="mr-2 h-4 w-4" />Attendees</TabsTrigger>
                        <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="approvals">
                        <ApprovalsTab event={event} attendees={initialAttendees} onViewAttendee={handleViewAttendee} />
                    </TabsContent>
                    <TabsContent value="attendees">
                        <AttendeesTab event={event} attendees={initialAttendees} />
                    </TabsContent>
                    <TabsContent value="settings">
                        <SettingsTab event={event} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </>
  );
}