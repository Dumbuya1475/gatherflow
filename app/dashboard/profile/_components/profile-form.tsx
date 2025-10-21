'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActionState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types';
import { updateProfile } from '@/lib/actions/user';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const profileFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : 'Update Profile'}
        </Button>
        <Button variant="outline" type="button">Cancel</Button>
      </div>
    );
  }

export function ProfileForm({ profile }: { profile: Profile & { email?: string }}) {
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
    },
  });

  const [state, action] = useActionState(updateProfile, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully.',
        });
    } else if (state?.error) {
      toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: state.error,
        });
    }
  }, [state, toast]);

  return (
    <Form {...form}>
       <form action={action}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
              <FormField
                name="email"
                render={() => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input readOnly disabled value={profile.email} />
                        </FormControl>
                        <FormMessage>Email cannot be changed</FormMessage>
                    </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                        <Input {...field} />
                        </FormControl>
                    </FormItem>
                )}
               />

              <div className="space-y-2">
                  <Label>Role & Permissions</Label>
                  <p className="text-sm font-medium">Administrator</p>
                  <p className="text-sm text-muted-foreground">Full access to all features, event management, and user administration</p>
              </div>

          </CardContent>
          <CardContent>
            <SubmitButton />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
