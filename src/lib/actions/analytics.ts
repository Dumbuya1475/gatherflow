
'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAnalytics() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to view analytics.' };
    }

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, date, capacity')
        .eq('organizer_id', user.id);

    if (eventsError) {
        return { error: 'Could not fetch events.' };
    }

    const eventIds = events.map(e => e.id);

    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('event_id, created_at, checked_in, checked_in_at')
        .in('event_id', eventIds);

    if (ticketsError) {
        return { error: 'Could not fetch tickets.' };
    }

    const totalEvents = events.length;
    const totalRegistrations = tickets.length;
    const totalCheckIns = tickets.filter(t => t.checked_in).length;
    const attendanceRate = totalRegistrations > 0 ? (totalCheckIns / totalRegistrations) * 100 : 0;

    const registrationsByDay = tickets.reduce((acc, ticket) => {
        const date = new Date(ticket.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(registrationsByDay).map(([date, count]) => ({
        date,
        registrations: count,
    }));

    const eventsPerformance = events.map(event => {
        const eventTickets = tickets.filter(t => t.event_id === event.id);
        const registered = eventTickets.length;
        const checkedIn = eventTickets.filter(t => t.checked_in).length;
        const attendance = registered > 0 ? (checkedIn / registered) * 100 : 0;
        return {
            ...event,
            registered,
            checkedIn,
            attendance,
        };
    });

    return {
        totalEvents,
        totalRegistrations,
        totalCheckIns,
        attendanceRate: attendanceRate.toFixed(2),
        chartData,
        eventsPerformance,
    };
}
