import { supabase } from './auth';

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface UserSubscription {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface UserOrder {
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const createCheckoutSession = async (
  priceId: string,
  mode: 'payment' | 'subscription' = 'payment'
): Promise<StripeCheckoutResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/success`;
  const cancelUrl = `${baseUrl}/#premade`;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      mode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
};

export const createCheckoutSessionForCart = async (
  priceIds: string[],
  mode: 'payment' | 'subscription' = 'payment'
): Promise<StripeCheckoutResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/success`;
  const cancelUrl = `${baseUrl}/#premade`;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      price_ids: priceIds,
      success_url: successUrl,
      cancel_url: cancelUrl,
      mode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
};

export const getUserSubscription = async (): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('stripe_user_subscriptions')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
};

export const getUserOrders = async (): Promise<UserOrder[]> => {
  const { data, error } = await supabase
    .from('stripe_user_orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
};