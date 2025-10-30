
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function EventRegistrationPendingPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-secondary">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
                        <CheckCircle className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="mt-4">Registration Pending</CardTitle>
                    <CardDescription>Your registration is awaiting approval from the event organizer. You will be notified by email once it&apos;s confirmed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard/events">Go to My Events</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
