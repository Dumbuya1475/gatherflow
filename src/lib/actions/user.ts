'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You are not authenticated.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { error: 'Could not fetch profile.' };
  }

  return { data: { ...data, email: user.email } };
}

export async function updateProfile(prevState: { error: string | undefined, success?: boolean } | undefined, formData: FormData) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to update your profile.' };
    }

    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;

    const { error } = await supabase
        .from('profiles')
        .update({ first_name: firstName, last_name: lastName })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating profile:', error);
        return { error: 'Could not update profile.' };
    }

    revalidatePath('/dashboard/profile');
    return { success: true };
}

export async function getProfileStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { count: userEventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id);
    
    const { count: activeEventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', user.id)
        .gt('date', new Date().toISOString());

    const { count: totalEventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    const { data: userCountData } = await supabase.rpc('count_users');

    return {
        data: {
            userEventCount,
            activeEventCount,
            totalEventCount,
            totalUserCount: userCountData || 0,
        }
    }
}

export async function getScanners() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select("*, email:raw_user_meta_data->>'email'")
      .eq('role', 'scanner');
  
    if (error) {
      console.error('Error fetching scanners:', error);
      return { error: 'Could not fetch scanners.' };
    }
  
    return { data };
}
