import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeAccountForm } from "./upgrade-account-form";
import { CheckCircle } from "lucide-react";

export function UpgradeAccountPrompt({ userId }: { userId: string }) {
  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle>Upgrade Your Account</CardTitle>
        <CardDescription>
          Create a free account to get the most out of your event experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Manage all your tickets in one place.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Get important event updates from organizers.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Connect with other attendees.</span>
          </li>
        </ul>
        <UpgradeAccountForm userId={userId} />
      </CardContent>
    </Card>
  );
}
