'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createOrganizationAction, updateOrganizationAction } from '@/lib/actions/organizations';
import type { Organization } from '@/lib/types';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  description: z.string().max(500).optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(200).optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  organization?: Organization;
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      description: organization?.description || '',
      website: organization?.website || '',
      location: organization?.location || '',
    },
  });

  async function onSubmit(data: OrganizationFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('website', data.website || '');
    formData.append('location', data.location || '');

    try {
      const result = organization
        ? await updateOrganizationAction(organization.id, formData)
        : await createOrganizationAction(formData);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        setIsSubmitting(false);
      } else if (organization && 'success' in result && result.success) {
        toast({
          title: 'Success',
          description: 'Organization updated successfully.',
        });
        setIsSubmitting(false);
        router.refresh();
      }
      // For create, redirect happens in action
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Events Co." {...field} />
              </FormControl>
              <FormDescription>
                This name will be visible on all events created by this organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell people about your organization..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="City, Country"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Where is your organization based?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
