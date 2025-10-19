'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTicketAppearance } from '@/lib/actions/events';
import type { Event } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // Import format from date-fns

interface TicketCustomizerProps {
  event: Event;
}

export function TicketCustomizer({ event }: TicketCustomizerProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState({
    brandColor: event.ticket_brand_color || '#000000',
    brandLogo: event.ticket_brand_logo || null,
  });
  const [isSaving, setIsSaving] = useState(false);

  console.log("TicketCustomizer initialized with event:", event);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'brandLogo' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    const result = await updateTicketAppearance(event.id, formData);
    if (result?.success) {
      if (result.logoUrl) {
        // Rely on Next.js image optimization and unique Supabase URLs.
        // Avoid client-side Date.now() for hydration consistency.
        setPreview(prev => ({ ...prev, brandLogo: result.logoUrl }));
      }
      toast({ title: 'Success', description: 'Ticket appearance updated successfully.' });
    } else {
      toast({ title: 'Error', description: result?.error || 'Failed to update ticket appearance.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Customize Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ticket_brand_color">Brand Color</Label>
              <Input
                id="ticket_brand_color"
                name="ticket_brand_color"
                type="color"
                defaultValue={preview.brandColor}
                onChange={(e) => setPreview(prev => ({ ...prev, brandColor: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_brand_logo">Brand Logo</Label>
              <Input
                id="ticket_brand_logo"
                name="ticket_brand_logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'brandLogo')}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Ticket Preview */}
      <Card className="flex flex-col items-center justify-center p-6">
        <CardHeader>
          <CardTitle>Ticket Preview</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div 
            className="relative rounded-lg shadow-lg overflow-hidden bg-cover bg-center"
            style={{
              backgroundColor: preview.brandColor,
            }}
          >
            <div className="bg-black bg-opacity-50 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-white">
                        {preview.brandLogo ? (
                            <Image src={preview.brandLogo} alt="Brand Logo" width={120} height={120} className="mx-auto mb-4 rounded-full" />
                        ) : (
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-300 flex items-center justify-center text-black text-sm font-bold">Logo</div>
                        )}
                        <h1 className="text-4xl font-bold text-white font-headline">{event.title}</h1>
                        <p className="text-lg text-gray-200">{event.description || 'No description provided.'}</p>
                        <div className="flex items-center gap-4 mt-4">
                            <Calendar className="h-6 w-6" />
                            <span className="font-medium text-lg">{format(new Date(event.date), 'PPP p')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <MapPin className="h-6 w-6" />
                            <span className="font-medium text-lg">{event.location}</span>
                        </div>
                        <Button variant="outline" className="mt-6">View Event (Placeholder)</Button>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white rounded-lg p-6">
                        <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600">QR Code Placeholder</div>
                        <p className="text-xs text-muted-foreground mt-4">Ticket ID: [ID Placeholder]</p>
                        <div className="mt-4">
                            <Badge className="bg-blue-500 text-white">Status: Checked In (Placeholder)</Badge>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}