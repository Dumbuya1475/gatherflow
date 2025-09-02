
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

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
import { CalendarIcon, PlusCircle, Sparkles, Upload, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createEventAction, updateEventAction } from '@/lib/actions/events';
import type { Event } from '@/lib/types';
import { generatePromotionAction } from '@/lib/actions/server/ai';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
  capacity: z.coerce.number().int().positive().optional(),
  scanners: z.array(z.object({ email: z.string().email({ message: "Please enter a valid email."}) })).optional(),
  targetAudience: z.string().min(2, {
    message: 'Target audience must be at least 2 characters.',
  }),
  cover_image_file: z
    .any()
    .refine((file) => file === undefined || file === null || (file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type)), {
        message: "Only .jpg, .jpeg, .png and .webp formats are supported.",
    })
    .optional(),
  current_cover_image: z.string().url().optional(),
  is_paid: z.boolean().default(false),
  price: z.coerce.number().nonnegative().optional(),
  is_public: z.boolean().default(true),
}).refine(data => {
    if (data.is_paid) {
        return data.price !== undefined && data.price > 0;
    }
    return true;
}, {
    message: "Price must be a positive number for paid events.",
    path: ["price"],
});


type EventFormValues = z.infer<typeof eventFormSchema>;

interface CreateEventFormProps {
    event?: Event;
    defaultValues?: Partial<EventFormValues>;
}

export function CreateEventForm({ event, defaultValues }: CreateEventFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValues?.current_cover_image || null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...defaultValues,
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      location: defaultValues?.location || '',
      targetAudience: defaultValues?.targetAudience || 'General Audience',
      scanners: defaultValues?.scanners || [],
      capacity: defaultValues?.capacity || undefined,
      is_paid: defaultValues?.is_paid || false,
      price: defaultValues?.price || undefined,
      is_public: defaultValues?.is_public ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "scanners",
  });

  const isPaid = form.watch('is_paid');

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
  
    const formData = new FormData();
  
    // Append all form data safely
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
  
      if (key === 'cover_image_file' && value instanceof File) {
        formData.append(key, value);
      } else if (key === 'scanners' && Array.isArray(value)) {
        const filtered = value.map(s => s.email).filter(Boolean); // remove empty emails
        formData.append(key, JSON.stringify(filtered));
    }
     else if (key === 'is_paid' || key === 'is_public') {
        formData.append(key, value ? 'true' : 'false');
      }else if (value instanceof Date && !isNaN(value.getTime())) {
        formData.append(key, value.toISOString());
    }
     else {
        formData.append(key, String(value));
      }
    });
  
    const action = event ? updateEventAction.bind(null, event.id) : createEventAction;
  
    const result = await action(formData);
  
    if (result?.success) {
      toast({
        title: event ? "Event Updated!" : "Event Created!",
        description: `Your event has been ${event ? 'updated' : 'saved'}.`,
      });
      // Redirect is now handled by the server action on create
      if (event) {
          router.push('/dashboard/events');
      }
    } else if (result?.error) {
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <FormLabel>Event Description</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateContent}
                            disabled={isGenerating}
                            className="self-start sm:self-center"
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

            <FormField
              control={form.control}
              name="cover_image_file"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                    <FormLabel>Cover Image (Optional)</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            <div className="w-32 h-20 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                                {preview ? (
                                    <Image src={preview} alt="Cover image preview" width={128} height={80} className="object-cover w-full h-full" />
                                ) : (
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            <Input
                                {...fieldProps}
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onChange(file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setPreview(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    } else {
                                        onChange(null);
                                        setPreview(null);
                                    }
                                }}
                                className="flex-1"
                            />
                        </div>
                    </FormControl>
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
                         <div className="p-3 border-t border-border">
                            <Input
                                type="time"
                                value={field.value ? format(field.value, 'HH:mm') : ''}
                                onChange={(e) => {
                                    const time = e.target.value;
                                    const [hours, minutes] = time.split(':').map(Number);
                                    const baseDate = field.value instanceof Date ? field.value : new Date();
                                    const newDate = new Date(baseDate); // make a new copy
                                                                        newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    field.onChange(newDate);
                                }}
                            />
                        </div>
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
                         <div className="p-3 border-t border-border">
                            <Input
                                type="time"
                                value={field.value ? format(field.value, 'HH:mm') : ''}
                                onChange={(e) => {
                                    const time = e.target.value;
                                    const [hours, minutes] = time.split(':').map(Number);
                                    const baseDate = field.value instanceof Date ? field.value : new Date();
                                    const newDate = new Date(baseDate); // make a new copy
                                                                        newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    field.onChange(newDate);
                                }}
                            />
                        </div>
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
                      <Input type="number" placeholder="e.g., 500" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="is_paid"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Ticket Price</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === 'paid')}
                        defaultValue={field.value ? 'paid' : 'free'}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="free" id="free" />
                          </FormControl>
                          <Label htmlFor="free">Free Event</Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="paid" id="paid" />
                          </FormControl>
                          <Label htmlFor="paid">Paid Event</Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPaid && (
                  <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SLE)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 500000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Event Visibility</FormLabel>
                    <FormDescription>
                      {field.value ? 'Public: Discoverable by everyone.' : 'Private: Only visible to people with the link.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Invite Scanners</FormLabel>
              <FormDescription>Invited users will be able to scan tickets for this event.</FormDescription>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`scanners.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} placeholder="scanner@example.com" />
                          </FormControl>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ email: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Scanner
              </Button>
            </div>
            
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
