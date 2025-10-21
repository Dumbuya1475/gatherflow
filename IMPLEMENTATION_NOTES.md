# Implementation & Progress Notes

This document provides a summary of the current implementation status of the GatherFlow application, including completed features and outstanding challenges.

## 1. Core Features (Completed)

The following core functionalities have been successfully implemented and are operational:

-   **User Authentication**:
    -   Standard email/password sign-up and login.
    -   Guest user flow: Anonymous users are created silently, allowing them to register for events without creating an account. Their data is retained if they choose to create a full account later.

-   **Event Management**:
    -   Organizers can create, edit, and delete events.
    -   Support for event details like title, description, dates, location, capacity, and cover images.
    -   Configuration for free vs. paid events, including pricing.
    -   Public vs. private event visibility.

-   **Attendee & Registration Management**:
    -   Custom registration forms can be created for each event to collect specific attendee information.
    -   Support for both automatic and manual attendee approval workflows.
    -   Organizers can view and manage attendee lists, including approving or rejecting pending registrations.

-   **Ticketing System**:
    -   Unique QR codes are generated for all approved tickets.
    -   Tickets can be customized with an event's branding (logo and color).
    -   Automated confirmation emails with ticket details are sent upon successful registration.
    -   A ticket "resend" feature is available for users who lose their link.

-   **AI-Powered Features**:
    -   Integration with Genkit to generate compelling promotional content for event descriptions.

-   **Dashboard & Analytics**:
    -   A comprehensive dashboard for organizers to view key stats (total events, attendees, etc.).
    -   An analytics page showing registration trends and top-performing events.
    -   A dedicated "Finances" dashboard for organizers to track revenue from paid events.

## 2. Monime Payment Integration (In Progress)

The primary focus of recent development has been the integration of the **Monime.io** payment gateway to handle paid event registrations.

### Implementation Details:

-   **Monime Client**: A client library was generated from Monime's OpenAPI specification (`monime-openapi.yaml`) and integrated into the project under `lib/monime-client/`.
-   **Checkout Flow**: An API route (`app/api/checkout/create-session/route.ts`) has been created. It is responsible for:
    1.  Receiving registration details.
    2.  Creating a pending ticket in the database.
    3.  Calling the Monime API to create a checkout session.
    4.  Redirecting the user to the Monime-hosted payment page.
-   **Webhook Handling**: A webhook endpoint (`app/api/webhooks/monime/route.ts`) is set up to listen for `checkout_session.completed` events from Monime. Upon successful payment confirmation, it:
    1.  Verifies the webhook signature.
    2.  Updates the corresponding ticket's status to "approved".
    3.  Generates the QR code for the ticket.
    4.  Sends the ticket confirmation email.

### Current Challenge: API Environment Mismatch

We are currently blocked by an issue related to Monime's API environments.

1.  **Initial Error**: When using a **test API key** with the documented production URL (`https://api.monime.io`), the API returns a `403 Forbidden` error with the message:
    > `Test mode is not supported for this endpoint: '/v1/checkout-sessions'.`
    This indicates that the test key is not authorized to use the checkout session endpoint on the production server.

2.  **Troubleshooting Step**: We attempted to connect to a conventional sandbox URL (`https://api.sandbox.monime.io`).

3.  **Resulting Error**: This resulted in a `getaddrinfo ENOTFOUND api.sandbox.monime.io` error, confirming that this URL does not exist.

### Current Status & Next Steps

-   The code has been reverted to use the documented `https://api.monime.io` base URL to resolve the `ENOTFOUND` crash.
-   **The immediate next step is to determine the correct API Base URL for Monime's test/sandbox environment.** This information must be obtained from Monime's developer dashboard or by contacting their support team.
-   Once the correct sandbox URL is identified, it should be configured as the `MONIME_API_BASE_URL` environment variable in the Vercel project settings to proceed with testing.