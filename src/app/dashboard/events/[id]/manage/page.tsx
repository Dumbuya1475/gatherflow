
'use server';

import { getEventAttendees, getEventDetails, deleteEventAction } from "@/lib/actions/events";
import type { Attendee } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
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
        <p>Error: {attendeesError}</p>
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
                            <TableHead className="text-center">Checked In</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {typedAttendees.map((attendee) => (
                            <TableRow key={attendee.ticket_id}>
                                <TableCell>{attendee.profiles?.first_name} {attendee.profiles?.last_name}</TableCell>
                                <TableCell>{attendee.profiles?.email}</TableCell>
                                <TableCell className="text-center">
                                {attendee.checked_in ? (
                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Yes
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    No
                                    </Badge>
                                )}
                                </TableCell>
                            </TableRow>
                            ))}
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
