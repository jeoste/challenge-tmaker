import { NextRequest, NextResponse } from 'next/server';
import { polar } from '@/lib/polar';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

// Verify webhook signature from Polar.sh
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('polar-signature') || '';

    // Verify webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Polar Webhook] POLAR_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('[Polar Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    console.log(`[Polar Webhook] Received event: ${type}`);

    // Handle different event types
    switch (type) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
        await handleSubscriptionUpdate(data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;

      case 'subscription.past_due':
        await handleSubscriptionPastDue(data);
        break;

      case 'order.paid':
        await handleOrderPaid(data);
        break;

      default:
        console.log(`[Polar Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Polar Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('[Polar Webhook] No user_id in subscription metadata');
    return;
  }

  // Upsert subscription in database
  const { error } = await supabaseAdmin
    .from('polar_subscriptions')
    .upsert({
      user_id: userId,
      polar_subscription_id: subscription.id,
      polar_customer_id: subscription.customer_id,
      status: subscription.status,
      plan_id: subscription.product?.id || process.env.UNEARTH_MONTHLY_PLAN || 'monthly',
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'polar_subscription_id',
    });

  if (error) {
    console.error('[Polar Webhook] Error upserting subscription:', error);
    return;
  }

  // Update user metadata if subscription is active
  if (subscription.status === 'active') {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { plan: 'premium' },
    });
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('[Polar Webhook] No user_id in subscription metadata');
    return;
  }

  // Update subscription status
  const { error } = await supabaseAdmin
    .from('polar_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('polar_subscription_id', subscription.id);

  if (error) {
    console.error('[Polar Webhook] Error updating canceled subscription:', error);
  }

  // Update user metadata to free plan
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { plan: 'free' },
  });
}

async function handleOrderPaid(order: any) {
  // Order paid - subscription should already be active
  // This is mainly for logging/analytics
  console.log(`[Polar Webhook] Order paid: ${order.id}`);
  
  // If order has a subscription, ensure it's marked as active
  if (order.subscription_id) {
    const { error } = await supabaseAdmin
      .from('polar_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('polar_subscription_id', order.subscription_id);

    if (error) {
      console.error('[Polar Webhook] Error updating subscription after order paid:', error);
    }
  }
}

async function handleSubscriptionPastDue(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.error('[Polar Webhook] No user_id in subscription metadata');
    return;
  }

  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('polar_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('polar_subscription_id', subscription.id);

  if (error) {
    console.error('[Polar Webhook] Error updating past_due subscription:', error);
  }

  // Optionally: Update user metadata or send notification
  // You might want to keep premium access during grace period
  // or restrict it based on your business logic
}
