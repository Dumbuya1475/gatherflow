
import type { Database } from './database.types';

export type Event = Database['public']['Tables']['events']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'] & { email?: string };
export type Ticket = Database['public']['Tables']['tickets']['Row'];

export type EventWithAttendees = Event & {
  attendees: number;
  ticket_id?: number;
  type?: 'attended' | 'organized';
};

export type Attendee = {
    ticket_id: number;
    checked_in: boolean;
    profiles: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        raw_user_meta_data: any;
    } | null
}
