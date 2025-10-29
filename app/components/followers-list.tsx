'use client';

import { useEffect, useState } from 'react';
import { UserAvatar } from '@/app/components/ui/avatar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FollowersResponse {
  followers: Array<{
    id: string;
    created_at: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
      email: string;
    };
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export default function FollowersList({ organizationId }: { organizationId: string }) {
  const [followers, setFollowers] = useState<FollowersResponse['followers']>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/organizations/${organizationId}/followers?page=${page}&limit=20`
        );
        const data: FollowersResponse = await response.json();
        setFollowers(data.followers);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
      setIsLoading(false);
    };

    fetchFollowers();
  }, [organizationId, page]);

  if (isLoading) {
    return <FollowersLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {followers.map((follower) => (
          <div
            key={follower.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            <div className="flex items-center space-x-4">
              <UserAvatar
                user={{
                  name: `${follower.user.first_name} ${follower.user.last_name}`,
                  image: follower.user.avatar_url
                }}
                className="h-10 w-10"
              />
              <div>
                <h3 className="font-medium">
                  {follower.user.first_name} {follower.user.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Following since {formatDistanceToNow(new Date(follower.created_at))} ago
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="py-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function FollowersLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}