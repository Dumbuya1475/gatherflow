'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    // Note: Dark mode is not fully implemented in the template, 
    // this is a starting point.
    // const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your application settings.
        </p>
      </div>
       <Card>
           <CardHeader>
               <CardTitle>Appearance</CardTitle>
               <CardDescription>Customize the look and feel of the app.</CardDescription>
           </CardHeader>
           <CardContent>
                <div className="flex items-center space-x-2">
                    <Switch id="dark-mode" disabled />
                    <Label htmlFor="dark-mode">Dark Mode (coming soon)</Label>
                </div>
           </CardContent>
       </Card>
    </div>
  );
}
