import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { createCheckoutSessionForCart } from '../lib/stripe';
import { stripeProducts } from '../stripe-config';

interface CartItem {
  id: number;
  title: string;
  description: string;
  price: string;
  stripe_price_id: string;
  image?: string;
}

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const items = location.state?.cartItems as CartItem[];
    if (!items || items.length === 0) {
      navigate('/');
      return;
    }

    setCartItems(items);
  }, [user, location.state, navigate]);

  const handleCheckout = async () => {
    if (!cartItems.length) return;

    setIsLoading(true);
    try {
      // Group items by price ID and count quantities
      const itemCounts = cartItems.reduce((acc, item) => {
        const priceId = item.stripe_price_id;
        acc[priceId] = (acc[priceId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Convert to format expected by checkout function
      const checkoutItems = Object.entries(itemCounts).map(([priceId, quantity]) => ({
        priceId,
        quantity
      }));

      const { url } = await createCheckoutSessionForCart(checkoutItems);
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to process checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getItemTotal = () => {
    return cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);
  };

  const getItemsByType = () => {
    const itemCounts = cartItems.reduce((acc, item) => {
      const key = `${item.id}-${item.title}`;
      if (!acc[key]) {
        acc[key] = { item, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { item: CartItem; count: number }>);

    return Object.values(itemCounts);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-28 sm:pt-36 lg:pt-60">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-400">Review your order and complete your purchase</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 rounded-xl border-2 border-gray-800 p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <ShoppingCart className="w-6 h-6" />
                Order Summary
              </h2>

              <div className="space-y-4">
                {getItemsByType().map(({ item, count }) => (
                  <div key={`${item.id}-${item.title}`} className="flex gap-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    {item.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Quantity: {count}</span>
                        <span className="text-2xl font-bold text-orange-500">
                          ${(parseFloat(item.price) * count).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 rounded-xl border-2 border-gray-800 p-6 sticky top-8">
              <h3 className="text-xl font-semibold text-white mb-6">Payment Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${getItemTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span className="text-orange-500">${getItemTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isLoading || cartItems.length === 0}
                className="w-full px-6 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Purchase'
                )}
              </button>

              <p className="text-gray-500 text-sm mt-4 text-center">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}