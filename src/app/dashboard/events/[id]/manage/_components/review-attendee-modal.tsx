
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Attendee } from "@/lib/types";
import { approveAttendeeAction, rejectAttendeeAction } from "@/lib/actions/tickets";
import { CheckCircle, Ban, Mail, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewAttendeeModalProps {
  attendee: Attendee | null;
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

export function ReviewAttendeeModal({ attendee, isOpen, onClose, eventId }: ReviewAttendeeModalProps) {
  if (!attendee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Review Application</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Attendee Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{attendee.first_name} {attendee.last_name}</span>
                    </div>
                    <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${attendee.email}`} className="text-blue-500 hover:underline">{attendee.email}</a>
                    </div>
                </CardContent>
            </Card>
          
          {attendee.form_responses && attendee.form_responses.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Application Form</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {attendee.form_responses.map((response, index) => (
                        <div key={index}>
                            <p className="font-medium text-sm">{response.field_name}</p>
                            <p className="text-sm text-muted-foreground">{response.field_value}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <form action={rejectAttendeeAction} className="inline-block">
            <input type="hidden" name="ticketId" value={attendee.ticket_id} />
            <input type="hidden" name="eventId" value={eventId} />
            <Button type="submit" variant="destructive">
              <Ban className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </form>
          <form action={approveAttendeeAction} className="inline-block">
            <input type="hidden" name="ticketId" value={attendee.ticket_id} />
            <input type="hidden" name="eventId" value={eventId} />
            <Button type="submit" variant="default">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
