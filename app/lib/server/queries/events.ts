
'use server';

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

// Get Event Details
export async function getEventDetails(eventId: number) {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            requires_approval,
            scanners:event_scanners(*, profiles(email)),
            event_form_fields(*, options:event_form_field_options(*))
        `)
        .eq('id', eventId)
        .single();

    const { count: attendees, error: countError } = await supabase
        .from('tickets')
        .select('count', { count: 'exact' })
        .eq('event_id', eventId);

    if (error || countError) {
        return { 
            data: null, 
            error: error?.message || countError?.message 
        };
    }

    return { 
        data: { ...data, attendees: attendees || 0 }, 
        error: null 
    };
}

// Get Event Form Fields
export async function getEventFormFields(eventId: number) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_form_fields')
        .select('*, options:event_form_field_options(*)')
        .eq('event_id', eventId)
        .order('order', { ascending: true });
    return { data, error };
}
