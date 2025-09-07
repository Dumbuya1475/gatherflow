
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AttendeesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: events, error } = await supabase
        .from('events')
        .select('id, name, date')
        .eq('organizer_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching events:', error);
        return <div>Error loading events.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Your Events</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <Link key={event.id} href={`/dashboard/attendees/${event.id}`}>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle>{event.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{new Date(event.date).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            {events.length === 0 && (
                <p className="text-muted-foreground">You haven't created any events yet.</p>
            )}
        </div>
    );
}
