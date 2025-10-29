import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch organizations where user is a member
    const { data: memberships, error: orgsError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations (
          id,
          name
        )
      `)
      .eq('user_id', user.id);

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 }
      );
    }

    // Transform the data to a simpler format
    const formattedOrgs = memberships?.map(m => {
      const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
      return {
        id: org.id,
        name: org.name
      };
    }).sort((a, b) => a.name.localeCompare(b.name)) || [];

    return NextResponse.json({ organizations: formattedOrgs });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
