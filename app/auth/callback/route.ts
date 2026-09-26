import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth", requestUrl));
    }

    const user = data.user;
    if (user?.email) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        { id: user.id, email: user.email, role: "customer" },
        { onConflict: "id", ignoreDuplicates: true },
      );

      if (profileError) {
        console.error("Failed to save profile after OAuth sign-in:", profileError);
        return NextResponse.json({ error: "Unable to save user profile." }, { status: 500 });
      }
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl));
}
