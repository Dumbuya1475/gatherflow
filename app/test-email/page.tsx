'use client';

import { sendTicketEmail } from '@/lib/actions/email';
import { Button } from '@/components/ui/button';

export default function TestEmailPage() {
  const handleSendTestEmail = async () => {
    // Use the verified Resend 'to' address and the required 'from' address for testing
    const to = 'dumbuya366@gmail.com';
    const subject = 'Test Email from GatherFlow';
    const html = '<h1>Hello!</h1><p>This is a test email to confirm your Resend setup is working.</p>';

    console.log(`Attempting to send email to ${to}...`);

    const result = await sendTicketEmail(to, subject, html);

    if (result.success) {
      alert('Test email sent successfully! Check your inbox.');
    } else {
      alert(`Failed to send test email: ${result.error}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Email Send Test</h1>
        <p className="mb-4">Click the button below to send a test email to <strong>dumbuya366@gmail.com</strong>.</p>
        <p className="text-sm text-gray-500 mb-6">The 'from' address will be <strong>onboarding@resend.dev</strong> as required for testing.</p>
        <Button onClick={handleSendTestEmail}>Send Test Email</Button>
      </div>
    </div>
  );
}
