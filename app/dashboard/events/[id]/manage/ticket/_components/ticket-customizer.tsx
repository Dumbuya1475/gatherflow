'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TicketCustomizer() {
  const [logo, setLogo] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState('#000000');

  // TODO: Fetch event data and set initial values

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrandColor(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Customization Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" type="file" onChange={(e) => setLogo(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
          </div>
          <div>
            <Label htmlFor="background-image">Background Image</Label>
            <Input id="background-image" type="file" onChange={(e) => setBackgroundImage(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)} />
          </div>
          <div>
            <Label htmlFor="brand-color">Brand Color</Label>
            <Input id="brand-color" type="color" value={brandColor} onChange={handleColorChange} />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Live Ticket Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
              {backgroundImage && <img src={backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              <div className="relative p-4 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  {logo && <img src={logo} alt="Logo" className="w-16 h-16 object-contain" />}
                  <div style={{ backgroundColor: brandColor }} className="w-8 h-8 rounded-full" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Event Title</h3>
                  <p className="text-white">John Doe</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
