
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';

interface AttendeesListProps {
    attendees: Profile[];
}

export function AttendeesList({ attendees }: AttendeesListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const filteredAttendees = attendees.filter(attendee => {
        const fullName = `${attendee.first_name || ''} ${attendee.last_name || ''}`.toLowerCase();
        const email = attendee.email?.toLowerCase() || '';
        return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

    const handleRowClick = (attendeeId: string) => {
        router.push(`/dashboard/attendees/${attendeeId}`);
    };

    return (
        <div>
            <div className="mb-4">
                <Input
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAttendees.map(attendee => (
                        <TableRow key={attendee.id} onClick={() => handleRowClick(attendee.id)} className="cursor-pointer">
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={attendee.avatar_url || undefined} />
                                        <AvatarFallback>{(attendee.first_name || '').charAt(0)}{(attendee.last_name || '').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        {attendee.first_name} {attendee.last_name}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{attendee.email}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
