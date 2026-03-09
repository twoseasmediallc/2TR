import { supabase } from './supabase';

export interface UserSubscription {
  customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  const { data: { user } } = await supabase.auth.getUser();

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      mode,
      userId: user?.id || null,
      userEmail: user?.email || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Checkout error response:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  return response.json();
}

export async function createCheckoutSessionForCart(priceIds: string[], mode: 'payment' | 'subscription') {
  const { data: { user } } = await supabase.auth.getUser();

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceIds,
      mode,
      userId: user?.id || null,
      userEmail: user?.email || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Checkout error response:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  return response.json();
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('stripe_user_subscriptions')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}