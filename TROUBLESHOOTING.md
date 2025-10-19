# GatherFlow Troubleshooting Guide

This document provides solutions to common issues you might encounter while setting up or running GatherFlow.

## 1. `Module not found: Can't resolve '@/src/components/ui/card'`

**Issue:** This error indicates an incorrect import path for UI components.

**Solution:** Ensure your import paths for Shadcn/ui components are correct. They should typically be `@/components/ui/<component-name>`.

## 2. "Upload event" button stuck at "Uploading..." or image not saving

**Issue:** The event creation or ticket customization form hangs during image upload, or the image doesn't appear after saving.

**Possible Causes & Solutions:**

*   **Incorrect `uploadFile` return type:** Ensure `src/lib/supabase/storage.ts`'s `uploadFile` function returns an object with `publicUrl` and `error` properties, and that calling actions (`createEventAction`, `updateEventAction`, `updateTicketAppearance`) correctly handle this return type.
*   **Supabase Storage Configuration:** Verify your Supabase Storage bucket (`event-covers`, `event-images`) has the correct RLS policies to allow uploads.
*   **Network Issues:** Check your browser's network tab for failed upload requests.
*   **File Size Limits:** Supabase Storage has file size limits. Ensure the images you're uploading are within these limits.
*   **Cache Busting:** For ticket logos, ensure a cache-busting parameter (e.g., `?t=timestamp`) is appended to the image URL when updating the preview state in `ticket-customizer.tsx` to force the browser to fetch the new image.

## 3. "Generation Failed: (0, h.isContentInappropriate) is not a function"

**Issue:** This error occurs when the AI content generation attempts to call a content moderation function that is not correctly imported or defined.

**Solution:** This typically means the `isContentInappropriate` function (or similar) was either removed or not properly integrated. If content moderation is desired, ensure the function is correctly defined and imported where used.

## 4. "No pending applications." in Approval Tab, or "Unknown" status for attendees

**Issue:** Even when users are awaiting approval, the "Approvals" tab shows "No pending applications." or attendee statuses appear as "Unknown."

**Possible Causes & Solutions:**

*   **Supabase `get_attendees_for_event` Function Definition:** The most common cause is that your Supabase PostgreSQL function named `get_attendees_for_event` is not returning the `status` field with the value `'pending'` for users who are awaiting approval, or its return type definition is incorrect.

    **Solution:** Ensure your `get_attendees_for_event` function in Supabase matches the following definition. You can apply this by running the SQL in your Supabase SQL Editor:

    ```sql
    CREATE OR REPLACE FUNCTION public.get_attendees_for_event(event_id_param INT)
    RETURNS TABLE(
        ticket_id BIGINT,
        checked_in BOOLEAN,
        checked_out BOOLEAN,
        status public.ticket_status,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        avatar_url TEXT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = public
    AS $
    BEGIN
      IF ((SELECT organizer_id FROM public.events WHERE id = event_id_param) = auth.uid()) THEN
        RETURN QUERY
        SELECT
            t.id AS ticket_id,
            t.checked_in,
            t.checked_out,
            t.status,
            p.first_name,
            p.last_name,
            p.email,
            p.avatar_url
        FROM
            public.tickets t
        JOIN
            public.profiles p ON t.user_id = p.id
        WHERE
            t.event_id = event_id_param;
      END IF;
    END;
    $;
    ```

    **Steps to apply (for a fresh Supabase project or after clearing public schema):**
    1.  Go to your **Supabase Dashboard**.
    2.  Navigate to **Database** -> **SQL Editor**.
    3.  **Paste the entire SQL code block above into the editor.**
    4.  Click **Run**.

*   **`Attendee` Type Definition:** Ensure the `Attendee` type in `src/lib/types.ts` correctly includes the `status` field: `status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | 'unknown';`.
*   **Client-side Filtering:** Verify that `app/dashboard/events/[id]/manage/_components/manage-event-view.tsx`'s `ApprovalsTab` is correctly filtering attendees where `a.status === 'pending'`.

## 5. Event Limit Bypass

**Issue:** Users can create more than the allowed number of events despite client-side checks.

**Solution:** Ensure that `src/lib/actions/events.ts`'s `createEventAction` includes a server-side check for the active event count *before* inserting a new event into the database. This prevents bypasses of client-side UI limitations.

## 6. General Compilation Errors

**Issue:** The application fails to compile with various TypeScript or Webpack errors.

**Solution:**
*   **Check Terminal Output:** Read the error messages carefully. They often point directly to the problematic file and line number.
*   **Restart Development Server:** Sometimes, a simple restart (`npm run dev`) can resolve transient compilation issues.
*   **Clear Node Modules & Reinstall:** Delete `node_modules` and `package-lock.json` (or `yarn.lock`), then run `npm install` again.
*   **TypeScript Errors:** Address any TypeScript errors reported by your IDE or the compiler.
