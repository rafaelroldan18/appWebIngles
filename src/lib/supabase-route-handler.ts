// ============================================================================
// SUPABASE ROUTE HANDLER CLIENT
// Cliente específico para API Routes que maneja cookies correctamente
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

interface Cookie {
  name: string;
  value: string;
  options?: any;
}

export function createRouteHandlerClient(request: NextRequest) {
  const cookiesToSet: Cookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSetArray) {
          cookiesToSet.push(...cookiesToSetArray);
        },
      },
    }
  );

  return { supabase, cookiesToSet };
}
