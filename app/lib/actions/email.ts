
'use server';

import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';


let resend: Resend | undefined;

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error('RESEND_FROM_EMAIL is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmailAction(eventId: number, subject: string, message: string, recipientSegment: string) {
    try {
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

        await getResend().emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: recipients,
            subject: subject,
            html: message,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error in sendEmailAction:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function sendTicketEmail(to: string, subject: string, react: React.ReactElement) {
  try {
    const html = render(react);
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
        return { success: false, error: `Could not send email: ${error.message}` };
    }
    return { success: false, error: 'Could not send email.' };
  }
}
