import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Users, BarChart3, ShieldCheck, PieChart, FileText } from 'lucide-react';


const reports = [
    {
        icon: <BarChart3 className="w-6 h-6 text-primary" />,
        title: "Event Analytics Report",
        description: "Comprehensive event performance metrics and attendance data.",
        points: ["Event attendance rates", "Registration trends", "Capacity utilization", "Revenue insights"]
    },
    {
        icon: <Users className="w-6 h-6 text-primary" />,
        title: "Attendee Report",
        description: "Detailed attendee information and engagement metrics.",
        points: ["Contact information", "Registration history", "Check-in timestamps", "Event participation"]
    },
    {
        icon: <ShieldCheck className="w-6 h-6 text-primary" />,
        title: "Activity Audit Log",
        description: "Complete system activity trail and security audit.",
        points: ["User actions", "System events", "Security logs", "Timestamps & IPs"]
    },
    {
        icon: <PieChart className="w-6 h-6 text-primary" />,
        title: "Scanner Performance",
        description: "Scanner assignment and performance analytics.",
        points: ["Scanner assignments", "Check-in efficiency", "Event coverage", "Performance metrics"]
    },
    {
        icon: <TrendingUp className="w-6 h-6 text-primary" />,
        title: "Trend Analysis",
        description: "Monthly and quarterly performance trends.",
        points: ["Growth metrics", "Seasonal patterns", "Comparative analysis", "Forecasting data"]
    },
    {
        icon: <FileText className="w-6 h-6 text-primary" />,
        title: "Custom Report",
        description: "Generate custom reports with specific date ranges and filters.",
        points: ["Custom date ranges", "Event filtering", "Specific metrics", "Multiple formats"]
    }
]


export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Reports & Analytics</h1>
                <p className="text-muted-foreground">Comprehensive insights and data exports.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Total Events</CardTitle>
                        <CardDescription>+2 this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">3</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Registrations</CardTitle>
                        <CardDescription>+0 this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Check-ins</CardTitle>
                         <CardDescription>0% attendance rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">0</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Scanners</CardTitle>
                        <CardDescription>Scanner assignments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">0</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader className="flex flex-row items-start gap-4">
                            {report.icon}
                            <div className="flex-1">
                                <CardTitle>{report.title}</CardTitle>
                                <CardDescription>{report.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {report.points.map((point, i) => (
                                     <li key={i} className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardContent>
                             <Button variant={index < 5 ? "outline" : "default"} className="w-full">
                                {index < 5 ? <Download className="mr-2" /> : null}
                                {index < 5 ? "Download CSV" : "Configure & Download"}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Event Performance Overview</CardTitle>
                    <CardDescription>Detailed metrics for all events</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>Checked In</TableHead>
                                <TableHead>Attendance Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No event data available
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent System Activity</CardTitle>
                    <CardDescription>Latest 10 system activities and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>role_changed</TableCell>
                                <TableCell>System activity</TableCell>
                                <TableCell>8/26/2025, 6:22:41 PM</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>role_changed</TableCell>
                                <TableCell>System activity</TableCell>
                                <TableCell>8/26/2025, 4:20:40 PM</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>user_registered</TableCell>
                                <TableCell>System activity</TableCell>
                                <TableCell>8/24/2025, 1:50:26 PM</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
