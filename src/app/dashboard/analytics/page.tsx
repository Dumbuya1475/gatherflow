import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Clock, Mail, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  // Placeholder data
  const totalEvents = 3;
  const totalRegistrations = 0;
  const totalCheckIns = 0;
  const attendanceRate = 0;
  const emailsSent = 0;

  const events = [
    { name: 'Tech Summit', date: '10/12/2025', location: 'Lungi', status: 'active', attendance: 0, registered: 0, checkedIn: 0, pending: 0, capacityUtilization: 0 },
    { name: 'Sample Tech Conference 2024', date: '8/31/2025', location: 'Convention Center, Main Hall', status: 'published', attendance: 0, registered: 0, checkedIn: 0, pending: 0, capacityUtilization: 0 },
    { name: 'Birthday', date: '8/24/2025', location: 'Lungi, Sierra Leone', status: 'draft', attendance: 0, registered: 0, checkedIn: 0, pending: 0, capacityUtilization: 0 },
  ];

  const recentActivity = [
    // Placeholder for activity
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights and performance metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckIns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailsSent}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Peak Check-in Time</CardTitle>
            <CardDescription>Busiest hour for event check-ins</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No check-in data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Session Performance</CardTitle>
            <CardDescription>Multi-session event statistics</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-4xl font-bold">0</p>
              <p className="text-muted-foreground">Total sessions created</p>
            </div>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {/* Map activities here */}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Performance Dashboard</CardTitle>
          <CardDescription>Comprehensive metrics for all events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{event.name}</CardTitle>
                    <CardDescription>{event.date} • {event.location}</CardDescription>
                  </div>
                  <Badge variant={event.status === 'active' ? 'default' : 'outline'}>{event.status}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{event.attendance}%</p>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.registered}</p>
                    <p className="text-sm text-muted-foreground">Registered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.checkedIn}</p>
                    <p className="text-sm text-muted-foreground">Checked In</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{event.capacityUtilization}%</p>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
