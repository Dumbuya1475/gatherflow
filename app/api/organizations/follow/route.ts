'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await req.formData();
    const organizationId = formData.get('organizationId') as string;

    if (!organizationId) {
      return new Response('Organization ID is required', { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_organization_id', organizationId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Follow
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_organization_id: organizationId
        });

      if (error) throw error;
    }

    revalidatePath(`/organizations/${organizationId}`);
    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Follow error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}