import { NextRequest, NextResponse } from 'next/server';
import { polar } from '@/lib/polar';
import { getServerSession } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();

    // Use the plan ID from environment variable or provided planId
    const variantId = planId || process.env.UNEARTH_MONTHLY_PLAN;
    
    if (!variantId) {
      return NextResponse.json(
        { error: 'Plan ID not configured. Please set UNEARTH_MONTHLY_PLAN environment variable.' },
        { status: 500 }
      );
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';

    // Create checkout session
    // Polar.sh uses products array for checkout creation
    const checkout = await polar.checkouts.create({
      products: [variantId],
      customerEmail: session.user.email!,
      customerName: session.user.user_metadata?.full_name || undefined,
      successUrl: `${baseUrl}/pricing/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        user_id: session.user.id,
        plan: 'monthly',
      },
    });

    return NextResponse.json({ 
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('[Polar Checkout] Error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
