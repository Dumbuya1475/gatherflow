import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { OrganizationMembersClient } from './organization-members-client';

interface OrganizationMembersProps {
  organizationId: string;
  userRole: 'owner' | 'admin' | 'member';
  ownerId: string;
}

export async function OrganizationMembers({
  organizationId,
  userRole,
  ownerId,
}: OrganizationMembersProps) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      profiles (
        full_name,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('role', { ascending: true });

  const formattedMembers = members?.map(m => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  })) || [];

  return (
    <OrganizationMembersClient
      organizationId={organizationId}
      members={formattedMembers}
      userRole={userRole}
      ownerId={ownerId}
    />
  );
}
