
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin client for server-side operations requiring higher privileges
// This should only be used in API routes, never in client components
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server-side client helper for API routes
export async function createServerClient() {
    const cookieStore = await cookies();
    
    return createSSRServerClient(
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
                        // Ignore cookie setting errors in middleware
                    }
                },
            },
        }
    );
}

// Helper to get server session
export async function getServerSession() {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Helper to get server user
export async function getServerUser() {
    const session = await getServerSession();
    return session?.user ?? null;
}
