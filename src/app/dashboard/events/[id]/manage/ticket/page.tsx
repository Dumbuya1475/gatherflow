
import { TicketCustomizer } from './_components/ticket-customizer';

export default function TicketCustomizationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Customize Ticket</h1>
      <TicketCustomizer />
    </div>
  );
}
