-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    cover_image_url text,
    website text,
    location text,
    owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_verified boolean DEFAULT false,
    UNIQUE(name)
);

-- Create organization members table (for multi-admin support)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role text CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    UNIQUE(organization_id, user_id)
);

-- Add organization_id and event_type to events table
ALTER TABLE public.events 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
ADD COLUMN event_type text CHECK (event_type IN ('individual', 'organization')) DEFAULT 'individual';

-- Create followers table (can follow users or organizations)
CREATE TABLE IF NOT EXISTS public.followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    CHECK (
        (following_user_id IS NOT NULL AND following_organization_id IS NULL) OR
        (following_user_id IS NULL AND following_organization_id IS NOT NULL)
    ),
    UNIQUE(follower_id, following_user_id),
    UNIQUE(follower_id, following_organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_user_id ON public.followers(following_user_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_org_id ON public.followers(following_organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations are viewable by everyone"
    ON public.organizations FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organizations"
    ON public.organizations FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their organizations"
    ON public.organizations FOR DELETE
    USING (auth.uid() = owner_id);

-- RLS Policies for organization_members
CREATE POLICY "Organization members are viewable by everyone"
    ON public.organization_members FOR SELECT
    USING (true);

CREATE POLICY "Organization owners can add members"
    ON public.organization_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update members"
    ON public.organization_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners and members themselves can delete membership"
    ON public.organization_members FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
    );

-- RLS Policies for followers
CREATE POLICY "Followers are viewable by everyone"
    ON public.followers FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.followers FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.followers FOR DELETE
    USING (auth.uid() = follower_id);

-- Update existing events to be individual type
UPDATE public.events 
SET event_type = 'individual' 
WHERE event_type IS NULL;
