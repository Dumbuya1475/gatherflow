

import { EventWithAttendees } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle, GitCommitHorizontal, Users, MapPin } from "lucide-react";
import Link from 'next/link';
import { Button } from "./ui/button";

export function TimelineEventCard({ event }: { event: EventWithAttendees }) {

  return (
    <div className="relative flex items-start gap-6">
        <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-8 ring-background">
                {event.type === 'organized' ? (
                    <GitCommitHorizontal className="h-6 w-6 text-primary" />
                ) : (
                    <CheckCircle className="h-6 w-6 text-primary" />
                )}
            </div>
        </div>

        <Card className="flex-1">
             <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'MMMM d, yyyy')}</p>
                        <CardTitle className="mt-1">{event.title}</CardTitle>
                    </div>
                    <Badge variant={event.type === 'organized' ? 'default' : 'secondary'}>
                        {event.type === 'organized' ? 'Organized' : 'Attended'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="outline" size="sm">
                    <Link href={`/events/${event.id}`}>View Event</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
