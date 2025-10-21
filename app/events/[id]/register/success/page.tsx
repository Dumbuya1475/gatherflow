
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function RegistrationSuccessPage({
    searchParams,
}: {
    searchParams: { ticketId?: string };
}) {
    const ticketId = searchParams.ticketId;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4 sm:p-6 md:p-8">
            <Card className="w-full max-w-lg text-center">
                <CardHeader className="items-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl md:text-3xl font-headline">Registration Successful!</CardTitle>
                    <CardDescription>
                        Your registration is complete. A confirmation email has been sent.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {ticketId ? (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                You can view your ticket and check its status at any time using the link below.
                            </p>
                            <Button asChild size="lg" className="w-full">
                                <Link href={`/tickets/view/${ticketId}`}>View Your Ticket</Link>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-red-500">
                            Could not retrieve your ticket link. Please check your email for your ticket.
                        </p>
                    )}
                    <div className="pt-4 border-t">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/events">Browse More Events</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

