# GatherFlow Local Development Setup Guide

This guide provides step-by-step instructions to get the GatherFlow project running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Git:** For cloning the repository.
*   **Node.js (LTS) & npm:** For running the Next.js application.
*   **Supabase Account & Project:** GatherFlow relies heavily on Supabase for its backend (database, authentication, storage). You'll need to set up a Supabase project.

## 1. Clone the Repository

Open your terminal or command prompt and run the following command to clone the project:

```bash
git clone <repository-url>
cd studio # Or whatever your project root directory is named
```

Replace `<repository-url>` with the actual URL of your Git repository.

## 2. Install Dependencies

Navigate into the project directory and install the Node.js dependencies:

```bash
npm install
```

## 3. Set Up Supabase Project

### a. Create a New Supabase Project

If you haven't already, create a **new, empty project** on [Supabase](https://app.supabase.com/). This ensures a clean slate for your database schema.

### b. Get Supabase API Keys

Once your new project is created, navigate to `Project Settings > API` in your Supabase dashboard. You'll need the following:

*   **`SUPABASE_URL`**: Your project URL.
*   **`SUPABASE_ANON_KEY`**: Your `anon` public key.

### c. Configure Environment Variables

Create a `.env.local` file in the root of your project directory (where `package.json` is located) and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

# For server-side actions (if different from public keys, though often the same for anon)
# SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY" # Only if you need admin access on the server
```

**Important:** Never commit your `.env.local` file to Git. It's already included in `.gitignore`.

### d. Apply Database Schema

GatherFlow requires a specific database schema, including tables, RLS policies, and functions. You will apply this schema using the `schema.sql` file located in your project's root directory.

1.  **Open your Supabase Dashboard** for your new project.
2.  Navigate to **Database** -> **SQL Editor**.
3.  **Copy the entire content** of your local `schema.sql` file (`/home/user/studio/schema.sql`).
4.  **Paste the copied SQL content** into the Supabase SQL Editor.
5.  Click **Run**.

This will create all necessary tables, enums, RLS policies, and database functions, including the `get_attendees_for_event` function with the correct `status` and `avatar_url` fields.

## 4. Run the Development Server

Once dependencies are installed and environment variables are set, you can start the Next.js development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:3000` (or another port if 3000 is in use).

## 5. Access the Application

Open your web browser and navigate to the address provided by the `npm run dev` command (usually `http://localhost:3000`).

## Troubleshooting

Refer to `TROUBLESHOOTING.md` for common issues and solutions.
