
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upgradeGuestAccount } from '@/lib/actions/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UpgradeAccountForm({ userId }: { userId: string }) {
    const [state, action] = useActionState(async (prevState, formData) => {
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            return { error: 'Passwords do not match.' };
        }

        return await upgradeGuestAccount(userId, password);
    }, undefined);

    if (state?.success) {
        return (
            <div className="text-center p-4">
                <p className="text-green-500">Account upgraded successfully! You can now log in to your dashboard.</p>
            </div>
        );
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Create a Full Account</CardTitle>
                <CardDescription>Create a password to get full access to your dashboard and manage your events.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required />
                    </div>
                    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
                    <Button type="submit">Create Account</Button>
                </form>
            </CardContent>
        </Card>
    );
}
