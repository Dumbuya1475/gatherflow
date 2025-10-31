'use server';

import { getAnalytics } from '@/lib/actions/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Ticket, CheckCircle, Percent } from 'lucide-react';
import { ChartContainer } from "@/components/ui/chart"

import { RegistrationChart } from './_components/registration-chart';

export default async function AnalyticsPage() {
    const analyticsData = await getAnalytics();

    if (analyticsData.error) {
        return <p className="text-red-500">{analyticsData.error}</p>;
    }

    const { totalEvents, totalRegistrations, totalCheckIns, attendanceRate, chartData, eventsPerformance } = analyticsData;

    const chartConfig = {
        registrations: {
            label: "Registrations",
            color: "hsl(var(--chart-1))",
        },
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Comprehensive insights and performance metrics for your events.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEvents}</div>
                        <p className="text-xs text-muted-foreground">All-time organized events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRegistrations}</div>
                        <p className="text-xs text-muted-foreground">Across all your events</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCheckIns}</div>
                        <p className="text-xs text-muted-foreground">Verified attendees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attendanceRate}%</div>
                        <p className="text-xs text-muted-foreground">Check-ins vs Registrations</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registration Trends</CardTitle>
                    <CardDescription>Registrations over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <RegistrationChart chartData={chartData ?? []} />
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Events</CardTitle>
                    <CardDescription>Your most popular events by registration numbers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead className="text-center">Registrations</TableHead>
                                <TableHead className="text-center">Check-ins</TableHead>
                                <TableHead className="text-right">Attendance Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.isArray(eventsPerformance) && eventsPerformance.map(event => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">{event.title}</TableCell>
                                    <TableCell className="text-center">{event.registrations}</TableCell>
                                    <TableCell className="text-center">{event.check_ins}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={typeof event.attendance_rate === 'number' && event.attendance_rate > 75 ? 'default' : 'secondary'} className={`${typeof event.attendance_rate === 'number' && event.attendance_rate > 75 ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                                            {typeof event.attendance_rate === 'number' ? `${event.attendance_rate.toFixed(1)}%` : 'N/A'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}