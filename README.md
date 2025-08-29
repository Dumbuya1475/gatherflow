# GatherFlow

GatherFlow is a modern, all-in-one event management platform designed to streamline the process of organizing, promoting, and executing events of any scale. It provides organizers with the tools to create events, manage attendees with QR code ticketing, and gain insights through analytics, while offering attendees a seamless registration and check-in experience.

## The Problem It Solves

Traditional event management can be fragmented and complex, requiring multiple tools for ticketing, promotion, check-ins, and analytics. GatherFlow solves this by unifying these essential functions into a single, intuitive platform. It empowers event organizers to focus on creating memorable experiences rather than getting bogged down by logistics.

## Key Features

*   **Seamless Event Creation:** An intuitive interface to create and manage events with details like date, location, capacity, and cover images.
*   **AI-Powered Promotions:** Generate compelling event descriptions and marketing copy with a single click using integrated generative AI.
*   **QR Code Ticketing:** Automatic generation of unique QR code tickets for every registered attendee.
*   **Real-time Scanner:** A built-in QR code scanner for fast and efficient attendee check-ins, with real-time data synchronization.
*   **Attendee Management:** View and manage attendee lists for each event.
*   **Comprehensive Dashboard:** Get an at-a-glance overview of your events, attendees, and key statistics.
*   **User Profiles & Roles:** Manage user profiles and permissions for organizers and scanners.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [ShadCN UI](https://ui.shadcn.com/) components
*   **Database & Auth:** [Supabase](https://supabase.io/)
*   **Generative AI:** [Google's Gemini via Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

*   [Node.js](https://nodejs.org/en) (v18 or later)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A [Supabase](https://supabase.io/) account

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/gatherflow.git
    cd gatherflow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase:**
    *   Create a new project on Supabase.
    *   In your Supabase project dashboard, go to the **SQL Editor** and run the schema from the `schema.sql` file in this repository to set up the necessary tables and policies.
    *   Go to **Project Settings** > **API**. Find your Project URL and `anon` public key.

4.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the root of the project by copying the example file:
        ```bash
        cp .env.example .env.local
        ```
    *   Update `.env.local` with your Supabase credentials:
        ```
        NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
        GEMINI_API_KEY=your-google-ai-api-key
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application should now be running at [http://localhost:3000](http://localhost:3000).

## Roadmap & Coming Soon

*   **Advanced Analytics:** Detailed dashboards with visualizations for event performance.
*   **Customizable Ticket Designs:** Allow organizers to customize the look and feel of event tickets.
*   **Multi-user Teams:** Support for multiple organizers within a single account.
*   **Paid Events:** Integration with Stripe for paid ticketing.

## Contributing

Contributions are welcome! If you have suggestions for improving the app, please open an issue to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
