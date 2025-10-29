
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { uploadFile } from '@@/app/lib/supabase/storage';
import type { EventFormFieldWithOptions } from '@/lib/types';
import { cookies } from 'next/headers';

// 1. Create Event Action
export async function createEventAction(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServiceRoleClient(cookieStore);
  const { data: { user } } = await createClient(cookieStore).auth.getUser();

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
    category: (formData.get('category') as string) || 'other',
    date: formData.get('date') as string,
    end_date: formData.get('end_date') as string,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string, 10) : null,
    is_paid: formData.get('is_paid') === 'true',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    fee_bearer: formData.get('fee_bearer') as 'organizer' | 'buyer',
    is_public: formData.get('is_public') === 'true',
    requires_approval: formData.get('requires_approval') === 'true',
    event_type: (formData.get('event_type') as string) || 'individual',
    organization_id: formData.get('organization_id') as string | null,
    customFields: JSON.parse(formData.get('customFields') as string || '[]') as EventFormFieldWithOptions[],
    cover_image_file: formData.get('cover_image_file') as File,
  };

  // Monime financial account integration for paid events
  let monimeAccountId: string | null = null;
  if (rawData.is_paid) {
    try {
      const { createMonimeAccount } = await import('@/lib/monime/account');
      const account = await createMonimeAccount({
        name: `${rawData.title} Event Account`,
        currency: 'SLE', // or use rawData.currency if available
        reference: undefined,
        description: `Account for event: ${rawData.title}`,
        metadata: { eventTitle: rawData.title, organizerId: user.id }
      });
      monimeAccountId = account.id;
    } catch (err) {
      console.error('Monime account creation failed:', err);
      // Optionally, return error or continue without account
    }
  }

  let coverImageUrl: string | null = null;
  if (rawData.cover_image_file && rawData.cover_image_file.size > 0) {
    const { publicUrl, error: uploadError } = await uploadFile(rawData.cover_image_file, 'event-covers');
    if (uploadError) {
      return { error: `Failed to upload cover image: ${uploadError.message}` };
    }
    coverImageUrl = publicUrl;
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      title: rawData.title,
      description: rawData.description,
      category: rawData.category,
      date: rawData.date,
      end_date: rawData.end_date,
      location: rawData.location,
      capacity: rawData.capacity,
      is_paid: rawData.is_paid,
      price: rawData.price,
      fee_bearer: rawData.fee_bearer,
      is_public: rawData.is_public,
      requires_approval: rawData.requires_approval,
      event_type: rawData.event_type,
      organization_id: rawData.organization_id || null,
      organizer_id: user.id,
      cover_image: coverImageUrl,
      monime_account_id: monimeAccountId, // Store Monime account ID
    })
    .select('id')
    .single();

  if (eventError) {
    console.error('Event creation error:', eventError);
    return { error: `Failed to create event: ${eventError.message}` };
  }

  if (rawData.customFields.length > 0) {
    for (const field of rawData.customFields) {
        const fieldIndex = rawData.customFields.indexOf(field);
        const { data: newField, error: fieldError } = await supabase
            .from('event_form_fields')
            .insert({
                event_id: event.id,
                field_name: field.field_name,
                field_type: field.field_type,
                is_required: field.is_required,
                order: fieldIndex,
            })
            .select('id')
            .single();

        if (fieldError) {
            return { error: `Failed to create custom form field: ${fieldError.message}` };
        }

        if (field.options && field.options.length > 0) {
            const optionsToInsert = field.options.map((opt: { value: string }) => ({
                form_field_id: newField.id,
                value: opt.value,
            }));

            const { error: optionsError } = await supabase.from('event_form_field_options').insert(optionsToInsert);
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
  const cookieStore = await cookies();
  const supabase = createServiceRoleClient(cookieStore);
  const { data: { user } } = await createClient(cookieStore).auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update an event.' };
  }

  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    category: (formData.get('category') as string) || 'other',
    date: formData.get('date') as string,
    end_date: formData.get('end_date') as string,
    location: formData.get('location') as string,
    capacity: formData.get('capacity') ? parseInt(formData.get('capacity') as string, 10) : null,
    is_paid: formData.get('is_paid') === 'true',
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
    fee_bearer: formData.get('fee_bearer') as 'organizer' | 'buyer',
    is_public: formData.get('is_public') === 'true',
    requires_approval: formData.get('requires_approval') === 'true',
    event_type: (formData.get('event_type') as string) || 'individual',
    organization_id: formData.get('organization_id') as string | null,
    customFields: JSON.parse(formData.get('customFields') as string || '[]') as EventFormFieldWithOptions[],
    cover_image_file: formData.get('cover_image_file') as File,
    scanners: JSON.parse(formData.get('scanners') as string || '[]') as string[],
  };

  let coverImageUrl: string | undefined;
  if (rawData.cover_image_file && rawData.cover_image_file.size > 0) {
    const { publicUrl, error: uploadError } = await uploadFile(rawData.cover_image_file, 'event-covers');
    if (uploadError) return { error: `Failed to upload cover image: ${uploadError.message}` };
    coverImageUrl = publicUrl ?? undefined;
  }
  
  const { error: eventUpdateError } = await supabase
    .from('events')
    .update({
      title: rawData.title,
      description: rawData.description,
      category: rawData.category,
      date: rawData.date,
      end_date: rawData.end_date,
      location: rawData.location,
      capacity: rawData.capacity,
      is_paid: rawData.is_paid,
      price: rawData.price,
      fee_bearer: rawData.fee_bearer,
      is_public: rawData.is_public,
      requires_approval: rawData.requires_approval,
      event_type: rawData.event_type,
      organization_id: rawData.organization_id || null,
      cover_image: coverImageUrl,
    })
    .eq('id', eventId)
    .eq('organizer_id', user.id);

  if (eventUpdateError) return { error: `Failed to update event: ${eventUpdateError.message}` };

  const { error: deleteFieldsError } = await supabase.from('event_form_fields').delete().eq('event_id', eventId);
  if (deleteFieldsError) return { error: `Failed to update custom fields (step 1): ${deleteFieldsError.message}` };

  if (rawData.customFields.length > 0) {
    for (const field of rawData.customFields) {
        const fieldIndex = rawData.customFields.indexOf(field);
        const { data: newField, error: fieldError } = await supabase
            .from('event_form_fields').insert({
                event_id: eventId,
                field_name: field.field_name,
                field_type: field.field_type,
                is_required: field.is_required,
                order: fieldIndex,
            }).select('id').single();
        if (fieldError) return { error: `Failed to update custom fields (step 2): ${fieldError.message}` };
        if (field.options && field.options.length > 0) {
            const optionsToInsert = field.options.map((opt: { value: string }) => ({ form_field_id: newField.id, value: opt.value }));
            const { error: optionsError } = await supabase.from('event_form_field_options').insert(optionsToInsert);
            if (optionsError) return { error: `Failed to update custom fields (step 3): ${optionsError.message}` };
        }
    }
  }

  const { error: deleteScannersError } = await supabase.from('event_scanners').delete().eq('event_id', eventId);
  if (deleteScannersError) return { error: `Failed to update scanners (step 1): ${deleteScannersError.message}` };

  if (rawData.scanners.length > 0) {
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id').in('email', rawData.scanners);
    if (profileError) return { error: `Failed to find scanner profiles: ${profileError.message}` };
    const scannersToInsert = profiles.map(p => ({ event_id: eventId, user_id: p.id }));
    const { error: insertScannersError } = await supabase.from('event_scanners').insert(scannersToInsert);
    if (insertScannersError) return { error: `Failed to update scanners (step 2): ${insertScannersError.message}` };
  }

  revalidatePath(`/dashboard/events/${eventId}/edit`);
  revalidatePath(`/dashboard/events/${eventId}/manage`);
  redirect(`/dashboard/events/${eventId}/manage`);
}

// 5. Update Ticket Appearance
export async function updateTicketAppearance(eventId: number, formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
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
        logoUrl = publicUrl ?? undefined;
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.rpc('get_attendees_for_event', { event_id_param: eventId });

    if (error) {
        return { error: `Failed to fetch attendees: ${error.message}` };
    }
    return { data };
}

// 7. Delete Event Action
export async function deleteEventAction(formData: FormData) {
    const cookieStore = await cookies();
    const supabase = createServiceRoleClient(cookieStore);
    const eventId = formData.get('eventId');
    const { data: { user } } = await createClient(cookieStore).auth.getUser();
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
