'use server';

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAction(eventId: number, subject: string, message: string, recipientSegment: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in.' };
    }

    let query = supabase
        .from('tickets')
        .select('profiles(email)')
        .eq('event_id', eventId);

    if (recipientSegment !== 'all') {
        if (recipientSegment === 'checked_in') {
            query = query.eq('checked_in', true);
        } else {
            query = query.eq('status', recipientSegment);
        }
    }

    const { data: tickets, error } = await query;

    if (error) {
        console.error('Error fetching recipients:', error);
        return { success: false, error: 'Could not fetch recipients.' };
    }

    const recipients = tickets.map(ticket => ticket.profiles?.email).filter(Boolean) as string[];

    if (recipients.length === 0) {
        return { success: false, error: 'No recipients found for the selected segment.' };
    }

    try {
        // IMPORTANT: Replace with your own verified domain on Resend.
        await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'GatherFlow <noreply@gatherflow.com>',
            to: recipients,
            subject: subject,
            html: message,
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: 'Could not send email.' };
    }
}