
'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function getProfile() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'You are not authenticated.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching profile:', error);
    return { data: null, error: 'Could not fetch profile.' };
  }

  const profileData = data || { id: user.id, first_name: '', last_name: ''};

  return { data: { ...profileData, email: user.email }, error: null };
}

export async function updateProfile(prevState: { error: string | undefined, success?: boolean } | undefined, formData: FormData) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: 'Not authenticated' };
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
        },
        error: null
    };
}

export async function getScanners() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('profiles')
      .select("id, first_name, last_name, email:raw_user_meta_data->>'email'")
      .eq('role', 'scanner');
  
    if (error) {
      console.error('Error fetching scanners:', error);
      return { data: null, error: 'Could not fetch scanners.' };
    }
  
    return { data, error: null };
}
    
export async function upgradeGuestAccount(userId: string, password: string): Promise<{ error?: string; success?: boolean; }> {
  const cookieStore = cookies();
  const supabase = createServiceRoleClient(cookieStore);

  const { error: authError } = await supabase.auth.admin.updateUserById(
    userId,
    { password: password }
  );

  if (authError) {
    console.error('Error updating user password:', authError);
    return { error: 'Could not update user password.' };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_guest: false })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return { error: 'Could not update profile.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
