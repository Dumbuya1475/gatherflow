'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type Follower = {
  id: string;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    email: string;
  };
};

type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
};

export default function OrganizationFollowersPage({ params }: { params: { id: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 20;

  useEffect(() => {
    const fetchOrganization = async () => {
      const supabase = createClient();
      
      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, logo_url')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return;
      }

      setOrganization(org);
    };

    fetchOrganization();
  }, [params.id]);

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
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
        `)
        .eq('following_organization_id', params.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      setFollowers(data || []);
      setHasMore(data?.length === perPage);
      setLoading(false);
    };

    fetchFollowers();
  }, [params.id, page]);

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/organizations/${params.id}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Followers</h1>
      </div>

      <div className="grid gap-4">
        {loading ? (
          // Loading skeletons
          [...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-[150px] bg-muted rounded" />
                    <div className="h-3 w-[100px] bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : followers.length > 0 ? (
          followers.map((follower) => (
            <Card key={follower.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      {follower.user.avatar_url ? (
                        <AvatarImage src={follower.user.avatar_url} alt={`${follower.user.first_name} ${follower.user.last_name}`} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {follower.user.first_name} {follower.user.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Following since {format(new Date(follower.created_at), 'PP')}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/users/${follower.user.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No followers yet</h3>
            <p className="text-muted-foreground">
              Share your organization to gain followers
            </p>
          </div>
        )}
      </div>

      {followers.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}