'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function createOrganizationAction(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create an organization.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const website = formData.get('website') as string;
  const location = formData.get('location') as string;

  if (!name || name.trim().length === 0) {
    return { error: 'Organization name is required.' };
  }

  // Check if organization name already exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', name.trim())
    .single();

  if (existingOrg) {
    return { error: 'An organization with this name already exists.' };
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      website: website?.trim() || null,
      location: location?.trim() || null,
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (orgError) {
    console.error('Organization creation error:', orgError);
    return { error: `Failed to create organization: ${orgError.message}` };
  }

  // Add creator as owner member
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    console.error('Member creation error:', memberError);
    // Delete the organization if member creation fails
    await supabase.from('organizations').delete().eq('id', org.id);
    return { error: 'Failed to set up organization membership.' };
  }

  revalidatePath('/dashboard/organizer/organizations');
  redirect(`/dashboard/organizer/organizations/${org.id}`);
}

export async function updateOrganizationAction(orgId: string, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update an organization.' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const website = formData.get('website') as string;
  const location = formData.get('location') as string;

  if (!name || name.trim().length === 0) {
    return { error: 'Organization name is required.' };
  }

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return { error: 'You do not have permission to update this organization.' };
  }

  // Check if new name conflicts with another organization
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', name.trim())
    .neq('id', orgId)
    .single();

  if (existingOrg) {
    return { error: 'An organization with this name already exists.' };
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      website: website?.trim() || null,
      location: location?.trim() || null,
    })
    .eq('id', orgId);

  if (updateError) {
    console.error('Organization update error:', updateError);
    return { error: `Failed to update organization: ${updateError.message}` };
  }

  revalidatePath(`/dashboard/organizer/organizations/${orgId}`);
  revalidatePath('/dashboard/organizer/organizations');
  return { success: true };
}

export async function deleteOrganizationAction(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  const orgId = formData.get('orgId') as string;

  // Verify user is the owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  if (!org || org.owner_id !== user.id) {
    return { error: 'Only the organization owner can delete it.' };
  }

  // Check if organization has any events
  const { count } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (count && count > 0) {
    return { error: 'Cannot delete organization with existing events. Please delete all events first.' };
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId);

  if (error) {
    console.error('Delete error:', error);
    return { error: 'Failed to delete organization.' };
  }

  revalidatePath('/dashboard/organizer/organizations');
  redirect('/dashboard/organizer/organizations');
}

export async function addOrganizationMemberAction(orgId: string, formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  const email = formData.get('email') as string;
  const role = formData.get('role') as 'admin' | 'member';

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return { error: 'You do not have permission to add members.' };
  }

  // Find user by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profile) {
    return { error: 'No user found with that email address.' };
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', profile.id)
    .single();

  if (existingMember) {
    return { error: 'This user is already a member of the organization.' };
  }

  const { error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: profile.id,
      role: role,
    });

  if (insertError) {
    console.error('Add member error:', insertError);
    return { error: 'Failed to add member.' };
  }

  revalidatePath(`/dashboard/organizer/organizations/${orgId}`);
  return { success: true };
}

export async function removeOrganizationMemberAction(orgId: string, userId: string) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.' };
  }

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return { error: 'You do not have permission to remove members.' };
  }

  // Cannot remove the owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', orgId)
    .single();

  if (org?.owner_id === userId) {
    return { error: 'Cannot remove the organization owner.' };
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', userId);

  if (error) {
    console.error('Remove member error:', error);
    return { error: 'Failed to remove member.' };
  }

  revalidatePath(`/dashboard/organizer/organizations/${orgId}`);
  return { success: true };
}
