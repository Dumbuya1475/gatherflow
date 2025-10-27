
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EmailForm } from './_components/email-form';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default async function EmailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createClient(await cookies());
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
        redirect('/login');
    }

    const { data: event, error } = await supabase
        .from('events')
        .select('id, title')
        .eq('id', id)
        .single();

    if (error || !event) {
        return <div>Event not found.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center mb-6">
                <Link href={`/dashboard/events/${id}/manage`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="ml-4">
                    <h1 className="text-3xl font-bold">Send Email</h1>
                    <p className="text-muted-foreground">Event: {event.title}</p>
                </div>
            </div>
            <EmailForm eventId={event.id} />
        </div>
    );
}
