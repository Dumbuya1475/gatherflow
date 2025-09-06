
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AttendeesList } from './_components/attendees-list';

export default async function AttendeesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: attendees, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .order('last_name', { ascending: true });

    if (error) {
        console.error('Error fetching attendees:', error);
        return <div>Error loading attendees.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">All Attendees</h1>
            <AttendeesList attendees={attendees || []} />
        </div>
    );
}
