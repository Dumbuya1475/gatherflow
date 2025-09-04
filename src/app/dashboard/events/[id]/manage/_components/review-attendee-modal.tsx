
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Attendee } from "@/lib/types";
import { approveAttendeeAction, rejectAttendeeAction } from "@/lib/actions/tickets";
import { CheckCircle, Ban } from "lucide-react";

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
          <DialogDescription>
            Review the attendee's details and form responses before making a decision.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h4 className="font-semibold">{attendee.first_name} {attendee.last_name}</h4>
            <p className="text-sm text-muted-foreground">{attendee.email}</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-semibold">Application Form Responses</h5>
            {attendee.form_responses && attendee.form_responses.length > 0 ? (
              <div className="space-y-2 rounded-md border p-4">
                {attendee.form_responses.map((response, index) => (
                  <div key={index}>
                    <p className="font-medium text-sm">{response.field_name}</p>
                    <p className="text-sm text-muted-foreground">{response.field_value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No form responses submitted.</p>
            )}
          </div>
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
