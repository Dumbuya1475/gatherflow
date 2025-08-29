'use client';

import { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sparkles } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { generatePromotionAction } from '@/lib/actions/ai';
import { useToast } from '@/hooks/use-toast';
import { createEventAction, updateEventAction } from '@/lib/actions/events';
import { useRouter } from 'next/navigation';
import { Event } from '@/lib/types';

const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Event title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  date: z.date({
    required_error: 'A start date and time is required.',
  }),
  end_date: z.date().optional(),
  location: z.string().min(2, {
    message: 'Location must be at least 2 characters.',
  }),
  capacity: z.coerce.number().int().positive({ message: "Capacity must be a positive number." }).optional(),
  scanners: z.string().optional(),
  targetAudience: z.string().min(2, {
    message: 'Target audience must be at least 2 characters.',
  }),
  cover_image: z.string().url({
    message: 'Please enter a valid image URL.'
  }).optional().or(z.literal('')),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface CreateEventFormProps {
    event?: Event;
    defaultValues?: Partial<EventFormValues>;
}

export function CreateEventForm({ event, defaultValues }: CreateEventFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaultValues || {
      title: '',
      description: '',
      location: '',
      targetAudience: '',
      cover_image: '',
      scanners: '',
      capacity: undefined,
    },
  });

  async function handleGenerateContent() {
    setIsGenerating(true);
    const { title, description, date, targetAudience } = form.getValues();
    
    if (!title || !date || !targetAudience) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in Event Title, Date/Time, and Target Audience to generate content.",
      });
      setIsGenerating(false);
      return;
    }

    const result = await generatePromotionAction({
        eventTitle: title,
        eventDescription: description || "No description provided.",
        eventDateTime: date.toISOString(),
        targetAudience,
    });
    
    if (result.success && result.data?.promotionalContent) {
        form.setValue('description', result.data.promotionalContent, { shouldValidate: true });
        toast({
            title: "Content Generated",
            description: "Promotional content has been added to the description.",
          });
    } else {
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: result.error || "Could not generate promotional content.",
          });
    }

    setIsGenerating(false);
  }

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);

    const action = event ? updateEventAction.bind(null, event.id) : createEventAction;
    const result = await action(data);
    
    if (result.success) {
      toast({
        title: event ? "Event Updated!" : "Event Created!",
        description: `Your event has been ${event ? 'updated' : 'saved'}.`,
      });
      router.push('/dashboard/events');
    } else {
      toast({
        variant: 'destructive',
        title: event ? 'Update Failed' : 'Creation Failed',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Summer Tech Summit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Event Description</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateContent}
                            disabled={isGenerating}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                        </Button>
                    </div>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your event..."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can use AI to generate a compelling description.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP p')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                         {/* Time picker would go here */}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date & Time (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP p')
                            ) : (
                              <span>Pick an end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < (form.getValues('date') || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA or Online" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Attendees (Capacity)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 500" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cover_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                   <FormDescription>
                    Use a service like <a href="https://picsum.photos/" target="_blank" rel="noopener noreferrer" className="underline">picsum.photos</a> for placeholder images. E.g., https://picsum.photos/600/400
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scanners"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Scanners</FormLabel>
                  <FormControl>
                    <Input placeholder="scanner1@example.com, scanner2@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter comma-separated emails. Invited users will be able to scan tickets for this event.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Developers, Music Lovers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (event ? 'Updating...' : 'Creating...') : (event ? 'Update Event' : 'Create Event')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
