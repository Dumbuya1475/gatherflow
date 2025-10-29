
'use client';

import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import { useRouter } from 'next/navigation';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import Link from 'next/link';



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

import { cn } from '@@/app/lib/utils';

import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';

import { createEventAction, updateEventAction } from '@/lib/actions/events';

import type { Event } from '@/lib/types';

import { generatePromotionAction } from '@/lib/actions/server/ai';

import { RadioGroup, RadioGroupItem } from './ui/radio-group';

import { Label } from './ui/label';

import { Switch } from './ui/switch';



import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';



const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];



const eventFormSchema = z.object({

  title: z.string().min(2, {

    message: 'Event title must be at least 2 characters.',

  }),

  description: z.string().min(10, {

    message: 'Description must be at least 10 characters.',

  }),

  category: z.enum(['conference', 'workshop', 'festival', 'concert', 'seminar', 'networking', 'sports', 'community', 'other']).default('other'),

  date: z.date({

    required_error: 'A start date and time is required.',

  }),

  end_date: z.date().optional(),

  location: z.string().min(2, {

    message: 'Location must be at least 2 characters.',

  }),

  capacity: z.coerce.number().int().positive().optional(),

  scanners: z.array(z.object({ email: z.string().email({ message: "Please enter a valid email." }) })).optional(),

  targetAudience: z.string().min(2, {

    message: 'Target audience must be at least 2 characters.',

  }),

  cover_image_file: z

    .any()

    .refine((file) => file === undefined || file === null || (file instanceof File && ACCEPTED_IMAGE_TYPES.includes(file.type)), {

        message: "Only .jpg, .jpeg, .png and .webp formats are supported.",

    })

    .optional(),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  current_cover_image: z.string().url().optional(),

  is_paid: z.boolean().default(false),

  price: z.coerce.number().nonnegative().optional(),

  fee_bearer: z.enum(['organizer', 'buyer']).default('buyer'),

  is_public: z.boolean().default(true),

  requires_approval: z.boolean().default(false),

  customFields: z.array(z.object({

    field_name: z.string().min(1, { message: "Field name is required." }),

    field_type: z.enum(['text', 'number', 'date', 'boolean', 'multiple-choice', 'checkboxes', 'dropdown']),

    is_required: z.boolean().default(false),

    options: z.array(z.object({ value: z.string().min(1, { message: "Option value is required." }) })).optional(),

  })).optional(),

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



function CustomFieldOptions({ nestIndex, form }: { nestIndex: number, form: UseFormReturn<EventFormValues> }) {
  const { control, watch } = form;
  const fieldType = watch(`customFields.${nestIndex}.field_type`);

  const { fields, append, remove } = useFieldArray({
    control,
    name: `customFields.${nestIndex}.options`,
  });

  if (!['multiple-choice', 'checkboxes', 'dropdown'].includes(fieldType)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <FormLabel>Options</FormLabel>
      {fields.map((item, k) => (
        <div key={item.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`customFields.${nestIndex}.options.${k}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder={`Option ${k + 1}`} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(k)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ value: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Option
      </Button>
    </div>
  );
}

import { calculateEarlyBirdPricing, PricingResult } from '@@/lib/pricing';

// ... (rest of the imports)

// ... (rest of the component before the return statement)

export function CreateEventForm({ event, defaultValues }: CreateEventFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{[key: string]: string | null}>({
    cover_image: event?.cover_image || null,
  });
  const [feeDetails, setFeeDetails] = useState<PricingResult | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      // ... (default values)
    },
  });

  const { fields: scannerFields, append: appendScanner, remove: removeScanner } = useFieldArray({
    control: form.control,
    name: "scanners",
  });

  const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  const isPaid = form.watch('is_paid');
  const price = form.watch('price');
  const feeBearer = form.watch('fee_bearer');

  useEffect(() => {
    if (isPaid && price && price > 0) {
      const details = calculateEarlyBirdPricing(price, 0, feeBearer === 'organizer' ? 'organizer_pays' : 'buyer_pays');
      setFeeDetails(details);
    } else {
      setFeeDetails(null);
    }
  }, [isPaid, price, feeBearer]);

  useEffect(() => {
    if (isPaid) {
      form.setValue('requires_approval', false);
    }
  }, [isPaid, form]);

  // ... (rest of the functions: handleGenerateContent, onSubmit)

  return (
    // ... (rest of the JSX)
              {isPaid && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (SLE)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input type="number" placeholder="e.g., 50" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))} value={field.value ?? ''} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  >
                  <FormField
                    control={form.control}
                    name="fee_bearer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Fee</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4 pt-2"
                          >
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="buyer" />
                              </FormControl>
                              <Label htmlFor="is_paid-paid">Buyer pays fee</Label>
                            </FormItem>
                             <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <RadioGroupItem value="organizer" />
                              </FormControl>
                              <Label htmlFor="is_paid-paid">I&apos;ll pay fee</Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                         <Button variant="link" asChild className="p-0 h-auto">
                            <Link href="/dashboard/pricing" target="_blank">
                              (Preview fee structure)
                            </Link>
                          </Button>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
              )}
              {feeDetails && (
                <div className="p-4 border rounded-lg bg-muted/50 text-sm">
                  <h4 className="font-semibold mb-2">Fee Breakdown</h4>
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span>SLE {feeDetails.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>You Receive:</span>
                    <span>SLE {feeDetails.organizerGets.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Buyer Pays:</span>
                    <span>SLE {feeDetails.buyerPays.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
    // ... (rest of the JSX)


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

            <FormField
              control={form.control}
              name="requires_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Attendee Approval</FormLabel>
                    <FormDescription>
                      {field.value ? 'Manual: You must approve each attendee.' : 'Automatic: Attendees are approved upon registration.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPaid}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Invite Scanners</FormLabel>
              <FormDescription>Invited users will be able to scan tickets for this event.</FormDescription>
              <div className="space-y-2 mt-2">
                {scannerFields.map((field, index) => (
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
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeScanner(index)}>
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
                onClick={() => appendScanner({ email: "" })}
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

            <div>
              <FormLabel>Custom Registration Form</FormLabel>
              <FormDescription>
                Add custom fields to collect more information from attendees.
              </FormDescription>
              <div className="space-y-4 mt-4">
                {customFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1 w-full">
                      <FormField
                        control={form.control}
                        name={`customFields.${index}.field_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., T-Shirt Size" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`customFields.${index}.field_type`}
                        render={({ field: fieldType }) => (
                          <FormItem>
                            <FormLabel>Field Type</FormLabel>
                            <Select onValueChange={fieldType.onChange} defaultValue={fieldType.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="boolean">Yes/No</SelectItem>
                                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                <SelectItem value="checkboxes">Checkboxes</SelectItem>
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`customFields.${index}.is_required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Required</FormLabel>
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
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <CustomFieldOptions nestIndex={index} form={form} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => appendCustomField({ field_name: '', field_type: 'text', is_required: false, options: [] })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Custom Field
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (event ? 'Updating...' : 'Creating...') : (event ? 'Update Event' : 'Create Event')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    