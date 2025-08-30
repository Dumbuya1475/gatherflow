

import { getTicketDetails } from "@/lib/actions/tickets";
import { TicketView } from "./_components/ticket-view";

export default async function TicketPage({ params }: { params: { id: string } }) {
    const ticketId = parseInt(params.id, 10);
    const { data: ticket, error } = await getTicketDetails(ticketId);

    if (error || !ticket || !ticket.events) {
        return <div className="text-center text-red-500 p-8">Error: {error || 'Ticket not found or you do not have permission to view it.'}</div>
    }

    return <TicketView ticket={ticket} />
}
