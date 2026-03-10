export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      mode,
      userId: null,
      userEmail: null,
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
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceIds,
      mode,
      userId: null,
      userEmail: null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Checkout error response:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  return response.json();
}