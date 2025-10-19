import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  console.log(`Middleware running for path: ${request.nextUrl.pathname}`);

  // Bypass middleware if Supabase credentials are not set
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "Supabase credentials are not set. Skipping middleware."
    );
    return NextResponse.next();
  }
  const { supabaseResponse, supabase } = await updateSession(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("User in middleware:", user);

  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    console.log("User is on dashboard path.");
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_guest")
      .eq("id", user.id)
      .single();

    console.log("User profile:", profile);

    if (profile?.is_guest) {
      console.log("Redirecting guest user.");
      return NextResponse.redirect(
        new URL("/login?message=Please create an account to access the dashboard.", request.url)
      );
    }
  }

  console.log("Middleware finished.");
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};