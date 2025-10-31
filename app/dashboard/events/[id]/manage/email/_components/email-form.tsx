
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendEmailAction } from '@/lib/actions/email';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const emailFormSchema = z.object({
  subject: z.string().min(2, { message: 'Subject must be at least 2 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
  recipient_segment: z.enum(['all', 'approved', 'checked_in', 'pending', 'rejected']).default('all'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailFormProps {
    eventId: number;
}

export function EmailForm({ eventId }: EmailFormProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: '',
      message: '',
      recipient_segment: 'all',
    },
  });

  async function onSubmit(data: EmailFormValues) {
    setIsSending(true);
    const result = await sendEmailAction(eventId, data.subject, data.message, data.recipient_segment);

    if (result?.success) {
      toast({
        title: "Email Sent!",
        description: "Your email has been queued for sending.",
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: "Email Failed",
        description: result?.error || 'Could not send email.',
      });
    }
    setIsSending(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="recipient_segment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient segment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">All Attendees</SelectItem>
                  <SelectItem value="approved">Approved Attendees</SelectItem>
                  <SelectItem value="checked_in">Checked-in Attendees</SelectItem>
                  <SelectItem value="pending">Pending Attendees</SelectItem>
                  <SelectItem value="rejected">Rejected Attendees</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Event Update" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Hi everyone, ..."
                  className="resize-none"
                  rows={10}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </form>
    </Form>
  );
}
