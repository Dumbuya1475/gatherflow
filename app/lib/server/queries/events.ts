
'use server';

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Get Event Details
export async function getEventDetails(eventId: number) {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            requires_approval,
            scanners:event_scanners(*, profiles(email)),
            event_form_fields(*, options:event_form_field_options(*)),
            organizer:profiles!events_organizer_id_fkey(id, first_name, last_name, email),
            organization:organizations(id, name, description, website, location)
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

    // Handle array responses from Supabase joins
    const processedData = {
        ...data,
        organizer: Array.isArray(data.organizer) ? data.organizer[0] : data.organizer,
        organization: Array.isArray(data.organization) ? data.organization[0] : data.organization,
        attendees: attendees || 0
    };

    return { 
        data: processedData, 
        error: null 
    };
}

// Get Event Form Fields
export async function getEventFormFields(eventId: number) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
        .from('event_form_fields')
        .select('*, options:event_form_field_options(*)')
        .eq('event_id', eventId)
        .order('order', { ascending: true });
    return { data, error };
}
