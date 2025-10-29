'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';



export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get the followers with pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: followers, error, count } = await supabase
      .from('followers')
      .select(`
        id,
        created_at,
        user:follower_id (
          id,
          first_name,
          last_name,
          avatar_url,
          email
        )
      `, { count: 'exact' })
      .eq('following_organization_id', params.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return Response.json({
      followers,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_organization_id', params.id)
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
          following_organization_id: params.id
        });

      if (error) throw error;
    }

    revalidatePath(`/organizations/${params.id}`);
    revalidatePath(`/organizations/${params.id}/followers`);
    
    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Error managing follow:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}