import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventWithAttendees } from "@/lib/types";
import { format } from "date-fns";

export function EventDetailsCard({ event }: { event: EventWithAttendees}) {
    const isPublished = new Date(event.date) > new Date();

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-2xl font-headline mb-2">{event.title}</CardTitle>
                    <Badge variant={isPublished ? "default" : "outline"}>
                        {isPublished ? 'Published' : 'Draft'}
                    </Badge>
                </div>
                <CardDescription>{event.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p className="font-semibold">{format(new Date(event.date), 'PP')}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'p')}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-muted-foreground">End Date</p>
                        {event.end_date ? (
                            <>
                                <p className="font-semibold">{format(new Date(event.end_date), 'PP')}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(event.end_date), 'p')}</p>
                            </>
                        ) : (
                             <p className="text-sm text-muted-foreground">Not specified</p>
                        )}
                    </div>
                </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-semibold">{event.location}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="font-semibold">{event.attendees} registered / {event.capacity ? event.capacity : 'Unlimited'}</p>
                </div>
            </CardContent>
        </Card>
    )
}
