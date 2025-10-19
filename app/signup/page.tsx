'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signup } from '@/lib/actions/auth';
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

export default function SignupPage() {
  const [state, action] = useActionState(signup, undefined);
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Link href="/" className="inline-flex items-center justify-center mb-4">
                <AppLogo />
            </Link>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="firstName" placeholder="Max" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="lastName" placeholder="Robinson" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Creating Account...' : 'Create an account'}
            </Button>
            <Button variant="outline" className="w-full" type="button">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Sign up with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
