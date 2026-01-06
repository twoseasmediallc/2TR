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
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Checkout error response:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return data;
}

export async function createCheckoutSessionForCart(items: Array<{ priceId: string; quantity: number }>) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      mode: 'payment',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Checkout error response:', errorData);
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return data;
}