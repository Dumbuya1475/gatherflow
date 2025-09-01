
'use server';

import { getEventAttendees, getEventDetails, deleteEventAction, unregisterAttendeeAction } from "@/lib/actions/events";
import type { Attendee } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Trash2, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { checkoutAttendeeAction } from "@/lib/actions/tickets";


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
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Event
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        event and all of its associated tickets and data.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={deleteEventAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">
                            Yes, delete event
                        </AlertDialogAction>
                    </form>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}

function getStatus(attendee: Attendee): { text: string; variant: 'default' | 'secondary' | 'outline', Icon: React.ElementType, badgeClass?: string } {
    if (attendee.checked_out) {
        return { text: 'Checked Out', variant: 'secondary', Icon: LogOut, badgeClass: 'bg-orange-500 hover:bg-orange-600' };
    }
    if (attendee.checked_in) {
        return { text: 'Checked In', variant: 'default', Icon: CheckCircle, badgeClass: 'bg-green-500 hover:bg-green-600' };
    }
    return { text: 'Not Checked In', variant: 'secondary', Icon: XCircle };
}


export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const eventId = parseInt(params.id, 10);
  const { data: event, error: eventError } = await getEventDetails(eventId);
  const { data: attendees, error: attendeesError } = await getEventAttendees(eventId);
  
  if (eventError || !event) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {eventError || 'Event not found.'}</p>
      </div>
    );
  }

  if (attendeesError) {
    return (
      <div className="text-center text-red-500">
        <p>Error fetching attendees: {attendeesError}</p>
      </div>
    );
  }
 
  const typedAttendees = attendees as unknown as Attendee[];

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Manage: {event.title}
        </h1>
        <p className="text-muted-foreground">
          View and manage your event attendees and settings.
        </p>
      </div>
       <Tabs defaultValue="attendees">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="attendees">
            <Card>
                <CardHeader>
                <CardTitle>Attendees ({typedAttendees.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {typedAttendees.length > 0 ? (
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typedAttendees.map((attendee) => {
                                const status = getStatus(attendee);
                                return (
                                <TableRow key={attendee.ticket_id}>
                                    <TableCell>{attendee.profiles?.first_name} {attendee.profiles?.last_name}</TableCell>
                                    <TableCell>{attendee.profiles?.email}</TableCell>
                                    <TableCell>Attendee</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={status.variant} className={status.badgeClass}>
                                            <status.Icon className="mr-2 h-4 w-4" />
                                            {status.text}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button asChild variant="outline" size="sm">
                                           <Link href={`/dashboard/tickets/${attendee.ticket_id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Ticket
                                            </Link>
                                        </Button>
                                        {attendee.checked_in && !attendee.checked_out && (
                                            <form action={checkoutAttendeeAction} className="inline-block">
                                                <input type="hidden" name="ticketId" value={attendee.ticket_id} />
                                                <input type="hidden" name="eventId" value={event.id} />
                                                <Button type="submit" variant="outline" size="sm">
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Check Out
                                                </Button>
                                            </form>
                                        )}
                                        <form action={unregisterAttendeeAction} className="inline-block">
                                            <input type="hidden" name="ticketId" value={attendee.ticket_id} />
                                            <input type="hidden" name="eventId" value={event.id} />
                                            <Button type="submit" variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Unregister
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
                            <h3 className="text-xl font-semibold tracking-tight">No attendees yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Share your event to get people to register.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab event={event} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
