export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SmObKCWVSnInCPVJdZUGQ3o',
    name: 'Test Rug 3',
    description: 'Test product for development',
    price: 3.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SmOb1CWVSnInCPVHkVZF0VA',
    name: 'Test Rug 1',
    description: 'Test product for development',
    price: 1.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhNlCWVSnInCPVZ9XE2eQ1',
    name: 'Live Music',
    description: '2\' x 2\' Music note on a lively colored staff (background color may vary)',
    price: 90.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhMOCWVSnInCPVakoCZsjG',
    name: 'Checkerboard B&R',
    description: '2\' x 2\' Black and red checkerboard',
    price: 85.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhLXCWVSnInCPVvh7ajg0h',
    name: 'Just Smile',
    description: '2\' x 2\' Smiley face in a square box (colors may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhKvCWVSnInCPVoJTSOcmX',
    name: 'Lightening Bolt',
    description: '2\' x 2\' Floating lightening bolt (background color may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhIuCWVSnInCPVjyFagIF8',
    name: 'Sunny Sunflower',
    description: '2\' x 2\' Sunflower petals (background color may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhGTCWVSnInCPVRTgVY0QO',
    name: 'Alive in Motion',
    description: '2\' x 2\' Abstract artwork of lines in motion (colors may vary)',
    price: 90.00,
    mode: 'payment'
  }
];