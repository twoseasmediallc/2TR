import { supabase } from './supabase';

export interface TrackingInfo {
  id: number;
  order_number: string;
  status: string;
  name: string;
  email: string;
  dimensions: string;
  backing_option: string;
  cut_option: string;
  created_at: string;
  updated_at: string;
  is_order_placed: boolean;
  is_in_production: boolean;
  is_post_production: boolean;
  is_quality_check: boolean;
  is_shipped: boolean;
  is_delivered: boolean;
  order_placed_at: string | null;
  in_production_at: string | null;
  post_production_at: string | null;
  quality_check_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export async function lookupTracking(orderNumber: string): Promise<{
  data: TrackingInfo | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('Custom Rugs')
      .select('*')
      .eq('order_number', orderNumber.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      return { data: null, error: 'Failed to lookup order number. Please try again.' };
    }

    if (!data) {
      return { data: null, error: 'Order number not found. Please check and try again.' };
    }

    return { data: data as TrackingInfo, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}

export function getOrderStageIndex(trackingInfo: TrackingInfo): number {
  if (trackingInfo.is_delivered) return 5;
  if (trackingInfo.is_shipped) return 4;
  if (trackingInfo.is_quality_check) return 3;
  if (trackingInfo.is_post_production) return 2;
  if (trackingInfo.is_in_production) return 1;
  if (trackingInfo.is_order_placed) return 0;
  return 0;
}

export function getOrderStageLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'pending': 'Order Placed',
    'in_production': 'In Production',
    'post_production': 'Post-Production',
    'quality_check': 'Quality Check',
    'shipped': 'Shipped',
    'delivered': 'Delivered'
  };
  return labels[status.toLowerCase()] || 'Order Placed';
}
