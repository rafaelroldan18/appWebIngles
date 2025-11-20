// ============================================================================
// SUPABASE API CLIENT
// Cliente Supabase estandarizado para API Routes
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // En Next.js 15, las cookies pueden ser read-only en algunos contextos
            console.warn('Unable to set cookies:', error);
          }
        },
      },
    }
  );
}
