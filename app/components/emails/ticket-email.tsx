import { TicketView } from '@/components/tickets/ticket-view';
import { Ticket } from '@/lib/types';

// This is the React component that will be rendered to HTML for the email
export const TicketEmail = ({ ticket }: { ticket: any }) => {
  const eventName = ticket.events?.title || 'our event';

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Ticket for {eventName}</title>
        <style>
          {`
            body {
              font-family: sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background-color: #4a4a4a;
              color: #ffffff;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
            }
            .footer {
              font-size: 12px;
              text-align: center;
              color: #888888;
              padding: 20px;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Your Ticket is Confirmed!</h1>
          </div>
          <div className="content">
            <p>Hello,</p>
            <p>Thank you for registering for <strong>{eventName}</strong>. Your ticket is attached below. Please have it ready for scanning at the event.</p>
            <TicketView ticket={ticket} />
          </div>
          <div className="footer">
            <p>This email was sent via GatherFlow. &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  );
};
