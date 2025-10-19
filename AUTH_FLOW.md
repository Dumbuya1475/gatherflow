# Authentication and Guest User Flow

## 1. Overview

This document outlines the authentication flow for the platform, including the handling of anonymous (guest) users and registered users. The primary goal is to reduce friction for new users by allowing them to access core features without creating an account upfront.

This is achieved by using Supabase's "Anonymous Sign-In" feature.

## 2. The User Journey

Here is a step-by-step breakdown of the user experience:

### Step 1: First-Time Visit

- When a user visits the website for the first time, they are automatically and silently signed in as an **anonymous user**.
- In the backend, this creates a temporary user in Supabase's `auth.users` table and a corresponding entry in our `public.profiles` table with the `is_guest` flag set to `true`.

### Step 2: Guest Actions

- As a guest, the user has limited permissions but can perform key actions:
  - Browse events.
  - Register for an event.

### Step 3: Ticket Access for Guests

- When a guest registers for an event, a ticket is created and associated with their guest profile.
- They receive an email containing a **unique, secure link** to their ticket page.
- They can use this link to view their ticket and QR code at any time, without needing to log in.

### Step 4: Becoming a Registered User

- A guest is prompted to create a full account only when they try to access a feature that requires it. The primary trigger for this is clicking the **"Create Event"** button.
- At this point, they will be redirected to a sign-up page where they can create a permanent account with their email and a password.

### Step 5: Account Conversion

- When the guest signs up, their session is seamlessly upgraded.
- Their anonymous user account is converted into a permanent, registered user account.
- Their profile in the `public.profiles` table is updated (`is_guest` is set to `false`).
- All their existing data, such as event tickets they registered for as a guest, is automatically retained and linked to their new account.

## 3. Data & Security Model

- **`profiles.is_guest` flag**: This boolean column is the primary way we distinguish between a guest and a registered user within our application and database.
- **Row Level Security (RLS)**: RLS policies are crucial. Since both anonymous and registered users have the `authenticated` role from Supabase's perspective, our policies use the `is_guest` flag to grant or deny permissions. For example, the policy for creating events will check if `is_guest` is `false`.
