import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { Rocket } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary text-center p-6">
      <Card className="max-w-md w-full p-8">
        <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <Rocket className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight font-headline mt-6">404</h1>
            <p className="text-xl font-semibold text-muted-foreground mt-2">Page Not Found</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Oops! The page you&apos;re looking for seems to have ventured into the unknown.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}