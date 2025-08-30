
import { getTicketDetails } from "@/lib/actions/tickets";
import { TicketView } from "./_components/ticket-view";

export default async function TicketPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { data: ticket, error } = await getTicketDetails(id);

    if (error || !ticket || !ticket.events) {
        return <div className="text-center text-red-500 p-8">Error: {error || 'Ticket not found'}</div>
    }

    return <TicketView ticket={ticket} />
}
