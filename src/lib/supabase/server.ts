import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sunucu (server component / server function) tarafı Supabase istemcisi.
// Her istekte yeniden oluşturulmalı.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component render sırasında cookie yazılamaz; oturumu proxy yeniler.
          }
        },
      },
    }
  );
}
