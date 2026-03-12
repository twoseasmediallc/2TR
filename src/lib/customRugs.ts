import { supabase } from './supabase';

export interface CustomRugOrder {
  name: string;
  email: string;
  description: string;
  dimensions: string;
  backing_option: string;
  cut_option: string;
  design_image?: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  coupon_code?: string;
}

export async function uploadDesignImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `designs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('custom-rug-designs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('custom-rug-designs')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function createCustomRugOrder(
  orderData: CustomRugOrder
): Promise<{ success: boolean; orderId?: number; orderNumber?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('Custom Rugs')
      .insert([
        {
          name: orderData.name,
          email: orderData.email,
          description: orderData.description,
          dimensions: orderData.dimensions,
          backing_option: orderData.backing_option,
          cut_option: orderData.cut_option,
          design_image: orderData.design_image,
          shipping_address_line1: orderData.shipping_address_line1,
          shipping_address_line2: orderData.shipping_address_line2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_zip: orderData.shipping_zip,
          shipping_country: orderData.shipping_country,
          coupon_code: orderData.coupon_code,
          status: 'pending'
        }
      ])
      .select('id, order_number')
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (data) {
      try {
        console.log('Sending email notifications...');

        const emailPromises = [
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                orderId: data.id,
                orderNumber: data.order_number,
                name: orderData.name,
                email: orderData.email,
                description: orderData.description,
                dimensions: orderData.dimensions,
                backing_option: orderData.backing_option,
                cut_option: orderData.cut_option,
                design_image: orderData.design_image,
                shipping_address_line1: orderData.shipping_address_line1,
                shipping_address_line2: orderData.shipping_address_line2,
                shipping_city: orderData.shipping_city,
                shipping_state: orderData.shipping_state,
                shipping_zip: orderData.shipping_zip,
                shipping_country: orderData.shipping_country,
              }),
            }
          ),
          fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-customer-confirmation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                orderNumber: data.order_number,
                name: orderData.name,
                email: orderData.email,
                description: orderData.description,
                dimensions: orderData.dimensions,
                backing_option: orderData.backing_option,
                cut_option: orderData.cut_option,
                shipping_address_line1: orderData.shipping_address_line1,
                shipping_address_line2: orderData.shipping_address_line2,
                shipping_city: orderData.shipping_city,
                shipping_state: orderData.shipping_state,
                shipping_zip: orderData.shipping_zip,
                shipping_country: orderData.shipping_country,
              }),
            }
          )
        ];

        const [adminResponse, customerResponse] = await Promise.all(emailPromises);

        console.log('Admin email status:', adminResponse.status);
        console.log('Customer email status:', customerResponse.status);

        if (!adminResponse.ok) {
          console.error('Admin email notification failed');
        } else {
          console.log('Admin email sent successfully!');
        }

        if (!customerResponse.ok) {
          console.error('Customer confirmation email failed');
        } else {
          console.log('Customer confirmation email sent successfully!');
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
      }
    }

    return { success: true, orderId: data?.id, orderNumber: data?.order_number };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}
