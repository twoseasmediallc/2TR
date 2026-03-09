export async function syncRugsToStripe() {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-rugs-to-stripe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Sync error response:', errorData);
    throw new Error(errorData.error || 'Failed to sync rugs to Stripe');
  }

  return response.json();
}

export async function syncSingleRugToStripe(rugId: number, title: string, description: string, price: number, imageUrl?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/sync-single-rug`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rugId,
      title,
      description,
      price,
      imageUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Sync error response:', errorData);
    throw new Error(errorData.error || 'Failed to sync rug to Stripe');
  }

  return response.json();
}
