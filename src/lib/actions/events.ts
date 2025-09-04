'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadFile, deleteFile } from '../supabase/storage';
import { redirect } from 'next/navigation';

const EVENT_LIMIT = 3;

export async function createEventAction(formData: FormData) {
    console.log('🎪 Creating new event...');
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
        console.error('❌ Auth error:', authError);
        return { success: false, error: 'Authentication failed. Please log in again.' };
    }

    if (!user) {
        console.log('❌ No user found');
        return { success: false, error: 'You must be logged in.' };
    }

    console.log('✅ User authenticated:', user.id);

    // Check for profile and create if needed
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!profile && !profileError) {
        console.log('📝 Creating missing profile...');
        const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({ 
                id: user.id, 
                email: user.email,
                first_name: user.user_metadata?.first_name || '',
                last_name: user.user_metadata?.last_name || ''
            });
        
        if (createProfileError) {
            console.error('❌ Error creating profile:', createProfileError);
            return { success: false, error: 'Could not create user profile.' };
        }
        console.log('✅ Profile created successfully');
    }

    // Check event limit
    const { count, error: countError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id)
        .gt('date', new Date().toISOString());
        
    if (countError) {
        console.error('❌ Error counting events:', countError);
        return { success: false, error: 'Could not verify your event count.' };
    }

    if (count !== null && count >= EVENT_LIMIT) {
        return { success: false, error: `You have reached your limit of ${EVENT_LIMIT} active events on the free plan.` };
    }

    console.log('📊 Current events:', count, '/ Max:', EVENT_LIMIT);

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const end_date = formData.get('end_date') as string | null;
    const location = formData.get('location') as string;
    const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null;
    const scanners = JSON.parse(formData.get('scanners') as string || '[]') as string[];
    const cover_image_file = formData.get('cover_image_file') as File | null;
    const is_paid = formData.get('is_paid') === 'true';
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const is_public = formData.get('is_public') === 'true';
    const requires_approval = formData.get('requires_approval') === 'true';
    const customFields = JSON.parse(formData.get('customFields') as string || '[]') as { field_name: string; field_type: string; is_required: boolean }[];

    console.log('📋 Form data extracted:', { title, date, location, is_paid, is_public, requires_approval });

    if (!title || !description || !date || !location) {
        return { success: false, error: 'Please fill all required fields.' };
    }
    
    let finalCoverImage: string | null = null;
    
    // Handle cover image upload
    if (cover_image_file && cover_image_file.size > 0) {
        console.log('📸 Uploading cover image...');
        try {
            // Use 'event-covers' bucket instead of 'event-images'
            finalCoverImage = await uploadFile(cover_image_file, 'event-covers');
            console.log('✅ Cover image uploaded:', finalCoverImage);
        } catch (uploadError: any) {
            console.error('❌ Image upload failed:', uploadError);
            return { success: false, error: `Failed to upload cover image: ${uploadError.message || 'Unknown error'}` };
        }
    } else {
        // Use placeholder image
        finalCoverImage = `https://picsum.photos/seed/${Math.random()}/600/400`;
        console.log('🖼️ Using placeholder image:', finalCoverImage);
    }

    // Create the event
    console.log('🎪 Inserting event into database...');
    const { data: eventData, error: eventCreateError } = await supabase
        .from('events')
        .insert({
            title,
            description,
            date,
            end_date: end_date || null,
            location,
            cover_image: finalCoverImage,
            organizer_id: user.id,
            capacity,
            is_paid,
            price,
            is_public,
            requires_approval,
        })
        .select('id')
        .single();

    if (eventCreateError) {
        console.error('❌ Error creating event:', eventCreateError);
        return { success: false, error: `Could not create event: ${eventCreateError.message}` };
    }

    if (!eventData) {
        console.error('❌ No event data returned');
        return { success: false, error: 'Could not create event.' };
    }

    console.log('✅ Event created successfully:', eventData.id);

    // Insert custom form fields
    if (customFields.length > 0) {
        console.log('📝 Adding custom form fields...');
        const formFieldsToInsert = customFields.map((field, index) => ({
            ...field,
            event_id: eventData.id,
            order: index,
        }));

        const { error: formFieldsError } = await supabase
            .from('event_form_fields')
            .insert(formFieldsToInsert);

        if (formFieldsError) {
            console.error('⚠️ Error inserting form fields:', formFieldsError);
            // Don't fail the whole action, just log the error
        } else {
            console.log('✅ Custom form fields added');
        }
    }

    // Assign scanners
    const scannerEmails = scanners.filter(email => email.trim());
    if (scannerEmails.length > 0) {
        console.log('👥 Assigning scanners:', scannerEmails);
        
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', scannerEmails);

        if (profileError) {
            console.error('⚠️ Error fetching scanner profiles:', profileError);
        } else if (profiles && profiles.length > 0) {
            const scannerRecords = profiles.map(p => ({ event_id: eventData.id, user_id: p.id }));
            const { error: scannerError } = await supabase
                .from('event_scanners')
                .insert(scannerRecords);
                
            if (scannerError) {
                console.error('⚠️ Error assigning scanners:', scannerError);
            } else {
                console.log('✅ Scanners assigned successfully');
            }
        }
    }

    // Revalidate paths
    try {
        revalidatePath('/dashboard/events');
        revalidatePath('/dashboard');
        revalidatePath('/');
        console.log('♻️ Paths revalidated');
    } catch (revalidateError) {
        console.warn('⚠️ Revalidation warning:', revalidateError);
    }

    console.log('🎉 Event creation completed successfully');
    
    // Redirect to dashboard
    redirect('/dashboard/events');
}

export async function updateEventAction(eventId: number, formData: FormData) {
    console.log('✏️ Updating event:', eventId);
    
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'You must be logged in.' };
    }

    // Verify ownership
    const { data: currentEvent, error: fetchError } = await supabase
        .from('events')
        .select('organizer_id, cover_image')
        .eq('id', eventId)
        .single();

    if (fetchError || !currentEvent) {
        console.error('❌ Event fetch error:', fetchError);
        return { success: false, error: 'Event not found.' };
    }

    if (currentEvent.organizer_id !== user.id) {
        return { success: false, error: 'You are not authorized to edit this event.' };
    }

    // Parse form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const end_date = formData.get('end_date') as string | null;
    const location = formData.get('location') as string;
    const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null;
    const scanners = JSON.parse(formData.get('scanners') as string || '[]') as string[];
    const cover_image_file = formData.get('cover_image_file') as File | null;
    const is_paid = formData.get('is_paid') === 'true';
    const price = formData.get('price') ? Number(formData.get('price')) : null;
    const is_public = formData.get('is_public') === 'true';
    const requires_approval = formData.get('requires_approval') === 'true';
    const customFields = JSON.parse(formData.get('customFields') as string || '[]') as { field_name: string; field_type: string; is_required: boolean }[];

    let finalCoverImage = currentEvent.cover_image;
    const oldCoverImage = currentEvent.cover_image;

    // Handle new cover image
    if (cover_image_file && cover_image_file.size > 0) {
        console.log('📸 Uploading new cover image...');
        try {
            finalCoverImage = await uploadFile(cover_image_file, 'event-covers');
            console.log('✅ New cover image uploaded');
            if (oldCoverImage) {
                const oldImageKey = oldCoverImage.split('/').pop();
                if (oldImageKey) {
                    await deleteFile('event-covers', oldImageKey);
                    console.log('✅ Old cover image deleted');
                }
            }
        } catch (uploadError: any) {
            console.error('❌ Cover image upload failed:', uploadError);
            return { success: false, error: `Failed to upload new cover image: ${uploadError.message || 'Unknown error'}` };
        }
    }

    // Update the event
    const { error: updateError } = await supabase
        .from('events')
        .update({
            title,
            description,
            date,
            end_date: end_date || null,
            location,
            capacity,
            cover_image: finalCoverImage,
            is_paid,
            price,
            is_public,
            requires_approval,
        })
        .eq('id', eventId);

    if (updateError) {
        console.error('❌ Error updating event:', updateError);
        return { success: false, error: `Could not update event: ${updateError.message}` };
    }

    // Update scanners
    const scannerEmails = scanners.filter(email => email.trim());
    if (scannerEmails.length > 0) {
        console.log('👥 Assigning scanners:', scannerEmails);
        
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', scannerEmails);

        if (profileError) {
            console.error('⚠️ Error fetching scanner profiles:', profileError);
        } else if (profiles && profiles.length > 0) {
            // First, remove all existing scanners for this event
            const { error: deleteScannersError } = await supabase
                .from('event_scanners')
                .delete()
                .eq('event_id', eventId);

            if (deleteScannersError) {
                console.error('⚠️ Error deleting old scanners:', deleteScannersError);
            }

            const scannerRecords = profiles.map(p => ({ event_id: eventId, user_id: p.id }));
            const { error: scannerError } = await supabase
                .from('event_scanners')
                .insert(scannerRecords);
                
            if (scannerError) {
                console.error('⚠️ Error assigning scanners:', scannerError);
            } else {
                console.log('✅ Scanners assigned successfully');
            }
        }
    } else {
        // If there are no scanners in the form, remove all existing scanners for this event
        const { error: deleteScannersError } = await supabase
            .from('event_scanners')
            .delete()
            .eq('event_id', eventId);

        if (deleteScannersError) {
            console.error('⚠️ Error deleting old scanners:', deleteScannersError);
        }
    }

    // Update custom form fields
    const { error: deleteFieldsError } = await supabase
        .from('event_form_fields')
        .delete()
        .eq('event_id', eventId);

    if (deleteFieldsError) {
        console.error('⚠️ Error deleting old form fields:', deleteFieldsError);
    }

    if (customFields.length > 0) {
        const formFieldsToInsert = customFields.map((field, index) => ({
            ...field,
            event_id: eventId,
            order: index,
        }));

        const { error: formFieldsError } = await supabase
            .from('event_form_fields')
            .insert(formFieldsToInsert);

        if (formFieldsError) {
            console.error('⚠️ Error inserting new form fields:', formFieldsError);
        }
    }

    // Revalidate paths
    revalidatePath(`/dashboard/events`);
    revalidatePath(`/dashboard/events/${eventId}/edit`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/');

    console.log('✅ Event updated successfully');
    return { success: true };
}

export async function getEventDetails(eventId: number) {
    if (isNaN(eventId)) {
        return { data: null, error: 'Invalid event ID.' };
    }
    
    console.log('🔍 Fetching event details for:', eventId);
    
    const supabase = createClient();
    const { data: event, error } = await supabase
        .from('events')
        .select(`
            *, 
            organizer:profiles(first_name, last_name), 
            scanners:event_scanners(profiles(email)), 
            event_form_fields(*)
        `)
        .eq('id', eventId)
        .single();
    
    if (error) {
        console.error(`❌ Error fetching event ${eventId}:`, error);
        return { data: null, error: 'Event not found.' };
    }

    const supabaseAdmin = createServiceRoleClient();
    const { data: countData, error: countError } = await supabaseAdmin
        .rpc('get_event_attendee_count', { event_id_param: eventId });

    if (countError) {
        console.error(`❌ Error fetching attendee count for event ${eventId}:`, countError);
        // Don't fail the whole request, just default to 0
    }

    const eventWithAttendees = {
        ...event,
        attendees: countData || 0,
        organizer: Array.isArray(event.organizer) ? event.organizer[0] : event.organizer,
    };

    console.log('✅ Event details fetched successfully');
    return { data: eventWithAttendees, error: null };
}

export async function getEventAttendees(eventId: number) {
    if (isNaN(eventId)) {
        return { data: null, error: 'Invalid event ID.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('tickets')
        .select(`
            ticket_id: id,
            checked_in,
            checked_out,
            status,
            profiles (
                first_name,
                last_name,
                email
            ),
            attendee_form_responses (
                field_value,
                event_form_fields (
                    field_name
                )
            )
        `)
        .eq('event_id', eventId);

    if (error) {
        console.error(`❌ Error fetching attendees for event ${eventId}:`, error);
        return { data: null, error: 'Could not fetch attendees.' };
    }

    const attendees = data.map(item => ({
        ticket_id: item.ticket_id,
        checked_in: item.checked_in,
        checked_out: item.checked_out,
        status: item.status,
        first_name: item.profiles?.first_name || null,
        last_name: item.profiles?.last_name || null,
        email: item.profiles?.email || null,
        form_responses: item.attendee_form_responses.map(r => ({
            field_name: r.event_form_fields?.field_name || 'Unknown Field',
            field_value: r.field_value,
        }))
    }));

    return { data: attendees, error: null };
}

export async function deleteEventAction(formData: FormData) {
    const supabase = createClient();
    const eventId = formData.get('eventId') as string;

    if (!eventId) {
        console.error('❌ No eventId provided for deletion');
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

    if (eventError || !event || event.organizer_id !== user.id) {
        throw new Error('Unauthorized or event not found.');
    }

    // Delete the event (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (deleteError) {
        console.error('❌ Error deleting event:', deleteError);
        return;
    }

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard');
    revalidatePath('/');
    redirect('/dashboard/events');
}

export async function getEventFormFields(eventId: number) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_form_fields')
        .select('*')
        .eq('event_id', eventId)
        .order('order');

    if (error) {
        console.error('❌ Error fetching form fields:', error);
        return { data: [], error: 'Could not fetch form fields.' };
    }

    return { data, error: null };
}