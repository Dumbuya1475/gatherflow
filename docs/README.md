# GatherFlow Project Documentation

This document provides a high-level overview of the GatherFlow project, an event management platform.

## Project Overview

GatherFlow is a comprehensive platform designed to streamline event creation, management, and attendee engagement. It provides organizers with tools to:
*   Create and customize events.
*   Manage attendees, including approval workflows.
*   Generate and customize tickets.
*   Utilize AI for event promotion content.
*   Scan tickets at event entrances.

## Key Features

*   **Event Creation & Management:** Intuitive forms for setting up event details, dates, locations, capacity, pricing, and visibility.
*   **Attendee Management:** View, approve/reject, and manage attendees for each event.
*   **Customizable Tickets:** Design unique tickets with branding, logos, and colors.
*   **AI-Powered Promotion:** Generate compelling event descriptions using AI.
*   **Ticket Scanning:** Built-in scanner functionality for efficient check-ins.
*   **User Authentication:** Secure login and registration for organizers.

## Technology Stack

*   **Frontend:** Next.js (React, TypeScript)
*   **Styling:** Tailwind CSS, Shadcn/ui
*   **Backend/Database:** Supabase (PostgreSQL, Authentication, Storage, Realtime)
*   **AI Integration:** Genkit (for AI flows)
*   **Deployment:** Vercel (assumed, based on `.vercel` directory)

## Folder Structure Highlights

*   `app/`: Next.js application routes and pages.
*   `src/components/`: Reusable UI components.
*   `src/lib/actions/`: Server actions for data manipulation and business logic.
*   `src/lib/supabase/`: Supabase client and server configurations.
*   `src/ai/`: AI-related configurations and flows (e.g., Genkit).
*   `public/`: Static assets.
*   `docs/`: Project documentation.

## Getting Started

Refer to `SETUP.md` for detailed instructions on how to clone, set up, and run the project locally.

## Contributing

Information on contributing to the project will be added here.

## License

This project is licensed under the [LICENSE](LICENSE) file.
