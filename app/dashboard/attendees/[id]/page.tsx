
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function AttendeeHistoryPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

    const { data: eventHistory, error: historyError } = await supabase.rpc('get_attendee_history', { attendee_id_param: params.id });

    if (profileError || historyError) {
        console.error('Error fetching attendee data:', profileError || historyError);
        return <div>Error loading attendee history.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>{(profile.first_name || '').charAt(0)}{(profile.last_name || '').charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{profile.first_name} {profile.last_name}</h1>
                    <p className="text-muted-foreground">{profile.email}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Event History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Checked In</TableHead>
                                <TableHead>Checked Out</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eventHistory?.map(event => (
                                <TableRow key={event.event_id}>
                                    <TableCell>
                                        <Link href={`/dashboard/events/${event.event_id}/manage`}>
                                            {event.event_title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={event.ticket_status === 'approved' ? 'default' : 'secondary'}>
                                            {event.ticket_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{event.checked_in ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{event.checked_out ? 'Yes' : 'No'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
