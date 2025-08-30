
'use server';

import { getEventAttendees, getEventDetails, deleteEventAction, createSessionAction, getEventSessions, createScanPointAction, getEventScanPoints, getEventScanners, assignScannerAction } from "@/lib/actions/events";
import type { Attendee, EventSession, Profile, ScanPoint } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Trash2, CalendarPlus, UserPlus, MapPin, Ticket, PlusCircle, Calendar, Clock, Users } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


async function SessionsTab({ eventId, sessions }: { eventId: string, sessions: EventSession[] }) {

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Event Sessions</CardTitle>
          <CardDescription>Manage the sessions for your event.</CardDescription>
        </div>
         <Dialog>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="mr-2 h-4 w-4" /> Create Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Fill in the details for your new event session.
              </DialogDescription>
            </DialogHeader>
            <form action={createSessionAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="session-name">Session Name</Label>
                  <Input id="session-name" name="name" placeholder="e.g., Keynote Speech" required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-description">Description</Label>
                  <Textarea id="session-description" name="description" placeholder="A brief description of the session." />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="session-location">Location</Label>
                  <Input id="session-location" name="location" placeholder="e.g., Main Hall" required/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input id="start-time" name="start_at" type="datetime-local" required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input id="end-time" name="end_at" type="datetime-local" required/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-capacity">Capacity (Optional)</Label>
                  <Input id="session-capacity" name="capacity" type="number" placeholder="e.g., 100" />
                </div>
              </div>
               <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Session</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
         {sessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{session.name}</CardTitle>
                  <CardDescription>{session.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                   <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{session.location}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(session.start_at), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(session.start_at), 'p')} - {format(new Date(session.end_at), 'p')}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{session.capacity ? `${session.capacity} capacity` : 'No capacity limit'}</span>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
            <CalendarPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold tracking-tight">No sessions created yet</h3>
            <p className="text-sm text-muted-foreground">
              Create sessions to break down your event schedule.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

async function ScannersTab({ eventId, scanPoints, scanners }: { eventId: string, scanPoints: ScanPoint[], scanners: Profile[]}) {
  return (
     <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Scanner Management</CardTitle>
          <CardDescription>Assign scanners to different scan points for your event.</CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Scan Point
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Scan Point</DialogTitle>
              <DialogDescription>
                A scan point can be a gate, a session entrance, or any checkpoint.
              </DialogDescription>
            </DialogHeader>
            <form action={createScanPointAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scanpoint-name">Scan Point Name</Label>
                  <Input id="scanpoint-name" name="name" placeholder="e.g., Main Entrance, VIP Lounge" required/>
                </div>
              </div>
              <DialogFooter>
                 <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Point</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div>
            <h4 className="text-lg font-semibold mb-2">Scan Points</h4>
            <div className="space-y-2">
              {scanPoints.length > 0 ? scanPoints.map(sp => (
                <Card key={sp.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <p className="font-medium">{sp.name}</p>
                    <Badge variant="secondary">{sp.kind}</Badge>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-sm text-muted-foreground p-4 text-center">No scan points created.</p>
              )}
            </div>
        </div>
        <div>
           <h4 className="text-lg font-semibold mb-2">Assign Scanners</h4>
           <div className="space-y-2">
             {scanners.length > 0 ? scanners.map(scanner => (
                <Card key={scanner.id}>
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="font-medium">{scanner.first_name} {scanner.last_name}</p>
                            <p className="text-xs text-muted-foreground">{scanner.email}</p>
                        </div>
                        <form action={assignScannerAction}>
                            <input type="hidden" name="eventId" value={eventId} />
                            <input type="hidden" name="scannerId" value={scanner.id} />
                            <div className="flex items-center gap-2">
                                <Select name="scanPointId" disabled={scanPoints.length === 0}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {scanPoints.map(sp => (
                                        <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" type="submit" disabled={scanPoints.length === 0}>Assign</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
             )) : (
                 <p className="text-sm text-muted-foreground p-4 text-center">No users with scanner role found.</p>
             )}
           </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsTab({ event }: { event: { id: string }}) {
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
  const eventId = params.id;
  const { data: event, error: eventError } = await getEventDetails(eventId);
  const { data: attendees, error: attendeesError } = await getEventAttendees(eventId);
  const { data: sessions, error: sessionsError } = await getEventSessions(eventId);
  const { data: scanPoints, error: scanPointsError } = await getEventScanPoints(eventId);
  const { data: scanners, error: scannersError } = await getEventScanners(eventId);

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
   if (sessionsError) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {sessionsError}</p>
      </div>
    );
  }
   if (scanPointsError) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {scanPointsError}</p>
      </div>
    );
  }
  if (scannersError) {
    return (
      <div className="text-center text-red-500">
        <p>Error: {scannersError}</p>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="scanners">Scanners</TabsTrigger>
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

        <TabsContent value="sessions">
          <SessionsTab eventId={eventId} sessions={sessions || []} />
        </TabsContent>

        <TabsContent value="scanners">
          <ScannersTab eventId={eventId} scanPoints={scanPoints || []} scanners={scanners || []} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab event={event} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
