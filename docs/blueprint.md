# **App Name**: Eventide

## Core Features:

- User Authentication: Authentication using Supabase Auth, supporting email/password and Google OAuth.  User roles (Admin, Event Planner, Attendee, Scanner) will be assigned upon sign-up but will not restrict any user from creating events.
- User Dashboards: Users have a dashboard with clear navigation. A distinct scanner dashboard will allow users assigned as scanners to access specific functionalities related to scanning tickets.
- Event Management: Create, edit, delete, and share events. Event details include title, description, date, time, location, cover image, registration link and ticketing options. All users are able to perform this action. QR code generation included.
- Registration & Ticketing: Attendees register for events, generating unique QR code tickets. Placeholder integration for Monime.io payments.
- QR Code Scanning: Scanner interface to check attendees in/out by scanning QR codes. Offline support with local storage (IndexedDB) and automatic data sync when online.
- Real-time Synchronization: Supabase real-time updates for event info and check-in logs. Offline-first approach for events and logs cached locally and synced when online.
- AI content generation: Generate suggested promotional content.  The LLM will act as a tool, generating promotional text (a short message) for the user, which the user can accept, edit, or reject.

## Style Guidelines:

- Primary color: Indigo (#667EEA) - evokes a sense of trust and professionalism suitable for event management, with a hint of creativity.
- Background color: Light gray (#F7FAFC) - provides a clean and neutral backdrop.
- Accent color: Purple (#9F7AEA) - for interactive elements, providing a complementary contrast to the primary indigo.
- Body and headline font: 'Inter', a grotesque sans-serif font providing a modern and neutral aesthetic suitable for both headings and body text.
- Minimal, consistent icons from a set like Remix Icon or Feather, ensuring clarity and ease of use.
- Mobile-first, responsive design leveraging Shadcn UI components for forms, modals, and dashboards. A clean, modern layout inspired by Luma, with intuitive navigation.
- Subtle transitions and animations (e.g., fade-ins, loading spinners) to enhance user experience without being distracting.