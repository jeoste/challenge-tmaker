import { Polar } from '@polar-sh/sdk';

// Initialize Polar client
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
});

// Polar API types (if SDK doesn't export them)
export interface PolarCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  metadata?: Record<string, string>;
}

export interface PolarSubscription {
  id: string;
  customer_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end?: boolean;
}
