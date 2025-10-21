
'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { EventWithAttendees } from "@/lib/types";
import { Share2 } from "lucide-react";

export function ShareButton({ event }: { event: EventWithAttendees }) {
    const { toast } = useToast();

    const handleShare = async () => {
        if (navigator.share && event) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description || '',
                    url: window.location.href,
                });
                toast({ title: 'Event Shared!', description: 'The event link has been copied to your clipboard.' });
            } catch (error) {
                console.error('Error sharing:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not share the event.' });
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Link Copied!', description: 'The event link has been copied to your clipboard.' });
        }
    };

    return (
        <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Event
        </Button>
    )
}
