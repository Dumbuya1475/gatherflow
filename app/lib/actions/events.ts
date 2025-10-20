
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { uploadFile } from '@@/app/lib/supabase/storage';
import type { EventFormFieldWithOptions } from '@/lib/types';

// 1. Create Event Action
export async function createEventAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create an event.' };
  }

  // Server-side event limit check
  const { count, error: countError } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organizer_id', user.id)
    .gt('date', new Date().toISOString()); // Only count future events

  if (countError) {
    console.error("Error checking event count:", countError);
    return { error: 'Failed to check event limit.' };
  }

  if (count && count >= 3) {
    return { error: 'You have reached your event creation limit (3 active events).' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    date: formData.get('date') as string,
    end_date: formData.get('end_date') as string,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string, 10) : null,
    is_paid: formData.get('is_paid') === 'true',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    is_public: formData.get('is_public') === 'true',
    requires_approval: formData.get('requires_approval') === 'true',
    customFields: JSON.parse(formData.get('customFields') as string || '[]') as EventFormFieldWithOptions[],
    cover_image_file: formData.get('cover_image_file') as File,
  };

  let coverImageUrl: string | null = null;
  if (rawData.cover_image_file && rawData.cover_image_file.size > 0) {
    const { publicUrl, error: uploadError } = await uploadFile(rawData.cover_image_file, 'event-covers');
    if (uploadError) {
      return { error: `Failed to upload cover image: ${uploadError.message}` };
    }
    coverImageUrl = publicUrl;
  }
  
  const supabaseAdmin = createServiceRoleClient();
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .insert({
      title: rawData.title,
      description: rawData.description,
      date: rawData.date,
      end_date: rawData.end_date,
      location: rawData.location,
      capacity: rawData.capacity,
      is_paid: rawData.is_paid,
      price: rawData.price,
      is_public: rawData.is_public,
      requires_approval: rawData.requires_approval,
      organizer_id: user.id,
      cover_image: coverImageUrl,
    })
    .select('id')
    .single();

  if (eventError) {
    console.error('Event creation error:', eventError);
    return { error: `Failed to create event: ${eventError.message}` };
  }

  if (rawData.customFields.length > 0) {
    for (const [index, field] of rawData.customFields.entries()) {
        const { data: newField, error: fieldError } = await supabaseAdmin
            .from('event_form_fields')
            .insert({
                event_id: event.id,
                field_name: field.field_name,
                field_type: field.field_type,
                is_required: field.is_required,
                order: index,
            })
            .select('id')
            .single();

        if (fieldError) {
            return { error: `Failed to create custom form field: ${fieldError.message}` };
        }

        if (field.options && field.options.length > 0) {
            const optionsToInsert = field.options.map(opt => ({
                form_field_id: newField.id,
                value: opt.value,
            }));

            const { error: optionsError } = await supabaseAdmin.from('event_form_field_options').insert(optionsToInsert);
            if (optionsError) {
                return { error: `Failed to create field options: ${optionsError.message}` };
            }
        }
    }
  }

  revalidatePath('/dashboard/events');
  redirect(`/dashboard/events/${event.id}/manage`);
}

// 2. Update Event Action (with redirect)
export async function updateEventAction(eventId: number, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update an event.' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    date: formData.get('date') as string,
    end_date: formData.get('end_date') as string,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string, 10) : null,
    is_paid: formData.get('is_paid') === 'true',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    is_public: formData.get('is_public') === 'true',
    requires_approval: formData.get('requires_approval') === 'true',
    customFields: JSON.parse(formData.get('customFields') as string || '[]') as EventFormFieldWithOptions[],
    cover_image_file: formData.get('cover_image_file') as File,
    scanners: JSON.parse(formData.get('scanners') as string || '[]') as string[],
  };

  let coverImageUrl: string | undefined;
  if (rawData.cover_image_file && rawData.cover_image_file.size > 0) {
    const { publicUrl, error: uploadError } = await uploadFile(rawData.cover_image_file, 'event-covers');
    if (uploadError) return { error: `Failed to upload cover image: ${uploadError.message}` };
    coverImageUrl = publicUrl;
  }
  
  const supabaseAdmin = createServiceRoleClient();
  const { error: eventUpdateError } = await supabaseAdmin
    .from('events')
    .update({
      title: rawData.title,
      description: rawData.description,
      date: rawData.date,
      end_date: rawData.end_date,
      location: rawData.location,
      capacity: rawData.capacity,
      is_paid: rawData.is_paid,
      price: rawData.price,
      is_public: rawData.is_public,
      requires_approval: rawData.requires_approval,
      cover_image: coverImageUrl,
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (eventUpdateError) return { error: `Failed to update event: ${eventUpdateError.message}` };

  const { error: deleteFieldsError } = await supabaseAdmin.from('event_form_fields').delete().eq('event_id', eventId);
  if (deleteFieldsError) return { error: `Failed to update custom fields (step 1): ${deleteFieldsError.message}` };

  if (rawData.customFields.length > 0) {
    for (const [index, field] of rawData.customFields.entries()) {
        const { data: newField, error: fieldError } = await supabaseAdmin
            .from('event_form_fields').insert({
                event_id: eventId,
                field_name: field.field_name,
                field_type: field.field_type,
                is_required: field.is_required,
                order: index,
            }).select('id').single();
        if (fieldError) return { error: `Failed to update custom fields (step 2): ${fieldError.message}` };
        if (field.options && field.options.length > 0) {
            const optionsToInsert = field.options.map(opt => ({ form_field_id: newField.id, value: opt.value }));
            const { error: optionsError } = await supabaseAdmin.from('event_form_field_options').insert(optionsToInsert);
            if (optionsError) return { error: `Failed to update custom fields (step 3): ${optionsError.message}` };
        }
    }
  }

  const { error: deleteScannersError } = await supabaseAdmin.from('event_scanners').delete().eq('event_id', eventId);
  if (deleteScannersError) return { error: `Failed to update scanners (step 1): ${deleteScannersError.message}` };

  if (rawData.scanners.length > 0) {
    const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('id').in('email', rawData.scanners);
    if (profileError) return { error: `Failed to find scanner profiles: ${profileError.message}` };
    const scannersToInsert = profiles.map(p => ({ event_id: eventId, user_id: p.id }));
    const { error: insertScannersError } = await supabaseAdmin.from('event_scanners').insert(scannersToInsert);
    if (insertScannersError) return { error: `Failed to update scanners (step 2): ${insertScannersError.message}` };
  }

  revalidatePath(`/dashboard/events/${eventId}/edit`);
  revalidatePath(`/dashboard/events/${eventId}/manage`);
  redirect(`/dashboard/events/${eventId}/manage`);
}

// 3. Get Event Details
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

// 4. Get Event Form Fields
export async function getEventFormFields(eventId: number) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_form_fields')
        .select('*, options:event_form_field_options(*)')
        .eq('event_id', eventId)
        .order('order', { ascending: true });
    return { data, error };
}

// 5. Update Ticket Appearance
export async function updateTicketAppearance(eventId: number, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const brandColor = formData.get('ticket_brand_color') as string;
    const logoFile = formData.get('ticket_brand_logo') as File;

    let logoUrl: string | undefined = undefined;

    if (logoFile && logoFile.size > 0) {
        const { publicUrl, error: uploadError } = await uploadFile(logoFile, 'event-images');
        if (uploadError) {
            return { error: `Failed to upload logo: ${uploadError.message}` };
        }
        logoUrl = publicUrl;
    }

    const updates: { ticket_brand_color?: string, ticket_brand_logo?: string } = {};
    if (brandColor) updates.ticket_brand_color = brandColor;
    if (logoUrl) updates.ticket_brand_logo = logoUrl;

    if (Object.keys(updates).length === 0) {
        return { success: true };
    }

    const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .eq('organizer_id', user.id);

    if (error) {
        return { error: `Failed to update ticket appearance: ${error.message}` };
    }

    revalidatePath(`/dashboard/events/${eventId}/manage/ticket`);
    return { success: true, logoUrl: logoUrl };
}

// 6. Get Event Attendees (Secure)
export async function getEventAttendees(eventId: number) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_attendees_for_event', { event_id_param: eventId });

    if (error) {
        return { error: `Failed to fetch attendees: ${error.message}` };
    }
    return { data };
}

// 7. Delete Event Action
export async function deleteEventAction(formData: FormData) {
    const supabase = createServiceRoleClient();
    const eventId = formData.get('eventId');
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return { error: 'You must be logged in.' };

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('organizer_id', user.id);
    
    if (error) {
        return { error: 'Failed to delete event.' };
    }

    revalidatePath('/dashboard/events');
    redirect('/dashboard/events');
}
