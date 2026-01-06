import { supabase } from './supabase';

export interface TrackingInfo {
  id: number;
  tracking_number: string;
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
  is_quality_check: boolean;
  is_shipped: boolean;
  is_delivered: boolean;
}

export async function lookupTracking(trackingNumber: string): Promise<{
  data: TrackingInfo | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('Custom Rugs')
      .select('*')
      .eq('tracking_number', trackingNumber.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      return { data: null, error: 'Failed to lookup tracking number. Please try again.' };
    }

    if (!data) {
      return { data: null, error: 'Tracking number not found. Please check and try again.' };
    }

    return { data: data as TrackingInfo, error: null };
  } catch (err) {
    return { data: null, error: 'An unexpected error occurred. Please try again.' };
  }
}

export function getOrderStageIndex(trackingInfo: TrackingInfo): number {
  if (trackingInfo.is_delivered) return 4;
  if (trackingInfo.is_shipped) return 3;
  if (trackingInfo.is_quality_check) return 2;
  if (trackingInfo.is_in_production) return 1;
  if (trackingInfo.is_order_placed) return 0;
  return 0;
}

export function getOrderStageLabel(status: string): string {
  const labels: { [key: string]: string } = {
    'pending': 'Order Placed',
    'in_production': 'In Production',
    'quality_check': 'Quality Check',
    'shipped': 'Shipped',
    'delivered': 'Delivered'
  };
  return labels[status.toLowerCase()] || 'Order Placed';
}
