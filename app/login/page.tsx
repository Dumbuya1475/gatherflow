'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/actions/auth';
import { useFormStatus } from 'react-dom';
import { AppLogo } from '@/components/app-logo';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.53 16.59" />
      <path d="M22 12a10 10 0 0 0-16.59-7.53" />
      <path d="M2 12a10 10 0 0 0 7.53 9.47" />
      <path d="M12 22a10 10 0 0 0 9.47-7.53" />
      <path d="M12 12.5a2.5 2.5 0 0 0-2.5 2.5V17" />
      <path d="M12 8a2.5 2.5 0 0 0 2.5 2.5h.5" />
      <path d="M17 14.5a2.5 2.5 0 0 0-2.5-2.5h-5" />
    </svg>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(login, undefined);

  const { pending } = useFormStatus();

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Link href="/" className="inline-flex items-center justify-center mb-4">
                <AppLogo />
            </Link>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="outline" className="w-full" type="button">
              <GoogleIcon className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
