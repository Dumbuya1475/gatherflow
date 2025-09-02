'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadFile } from '../supabase/storage';

const EVENT_LIMIT = 3;

export async function createEventAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'You must be logged in.' };

    // Count active events
    const { count, error: countError } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', user.id)
        .gt('date', new Date().toISOString());

    if (countError) return { success: false, error: 'Could not verify event count.' };

    if ((count ?? 0) >= EVENT_LIMIT) {
        return { success: false, error: `You have reached your limit of ${EVENT_LIMIT} active events.` };
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

    if (!title || !description || !date || !location) {
        return { success: false, error: 'Please fill all required fields.' };
    }

    let finalCoverImage = `https://picsum.photos/seed/${Math.random()}/600/400`;

    if (cover_image_file && cover_image_file.size > 0) {
        try {
            finalCoverImage = await uploadFile(cover_image_file, 'event-images');
        } catch {
            return { success: false, error: 'Failed to upload cover image.' };
        }
    }

    const { data: eventData, error } = await supabase
        .from('events')
        .insert({
            title,
            description,
            date,
            end_date,
            location,
            cover_image: finalCoverImage,
            organizer_id: user.id,
            capacity,
            is_paid,
            price,
            is_public,
        })
        .select('id')
        .single();

    if (error || !eventData) {
        console.error('Error creating event:', error);
        return { success: false, error: 'Could not create event.' };
    }

    // Assign scanners
    const scannerEmails = scanners.filter(email => email);
    if (scannerEmails.length > 0) {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('email', scannerEmails);

        if (profileError) console.error(profileError);

        if (profiles?.length) {
            const scannerRecords = profiles.map(p => ({ event_id: eventData.id, user_id: p.id }));
            const { error: scannerError } = await supabase.from('event_scanners').insert(scannerRecords);
            if (scannerError) console.error(scannerError);
        }
    }

    revalidatePath('/dashboard/events');
    revalidatePath('/dashboard');
    revalidatePath('/');

    return { success: true, data: eventData };
}
