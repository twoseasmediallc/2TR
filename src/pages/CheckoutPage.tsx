import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { createCheckoutSessionForCart } from '../lib/stripe';
import type { PremadeRug } from '../lib/premadeRugs';

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartItems = (location.state?.cartItems as PremadeRug[]) || [];

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/');
    }
  }, [cartItems, navigate]);

  const calculateTotal = () => {
    return cartItems.reduce((sum, rug) => sum + (rug.price ? parseFloat(rug.price) : 0), 0);
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const priceIds = cartItems
        .map(rug => rug.stripe_price_id)
        .filter((id): id is string => id !== null && id !== undefined);

      if (priceIds.length === 0) {
        setError('No valid items in cart');
        setIsProcessing(false);
        return;
      }

      const result = await createCheckoutSessionForCart(priceIds, 'payment');

      if (!result || !result.url) {
        throw new Error('Failed to create checkout session. Please ensure Stripe is properly configured.');
      }

      window.location.href = result.url;
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unable to process checkout. Please try again.';
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  const getCartSummary = () => {
    const uniqueRugs = Array.from(new Map(cartItems.map(item => [item.id, item])).values());
    return uniqueRugs.map(rug => ({
      rug,
      quantity: cartItems.filter(item => item.id === rug.id).length
    }));
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-100 hover:text-orange-500 transition-colors"
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-lg font-medium">Back to Shop</span>
            </button>
            <img
              src="/2tr-logo-final-transparent.png"
              alt="Two Tuft Rugs Logo"
              className="w-32 h-32 object-contain"
            />
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">Checkout</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 rounded-2xl p-6 border-2 border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {getCartSummary().map(({ rug, quantity }) => (
                  <div key={rug.id} className="flex gap-4 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    {rug.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={rug.image}
                          alt={rug.title || 'Rug'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {rug.title || 'Untitled Rug'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                        {rug.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-500 font-bold text-lg">
                          ${rug.price ? parseFloat(rug.price).toFixed(2) : '0.00'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Qty: {quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-800 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300 text-lg">Subtotal:</span>
                  <span className="text-white text-lg font-semibold">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-300 text-lg">Shipping:</span>
                  <span className="text-white text-lg font-semibold">Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl text-white font-semibold">Total:</span>
                    <span className="text-3xl font-bold text-orange-500">
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-2xl p-6 border-2 border-gray-800">
              <h2 className="text-2xl font-semibold text-white mb-6">Payment Details</h2>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border-2 border-gray-700 text-center">
                  <Package className="w-16 h-16 text-orange-500 mx-auto mb-4" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-white mb-2">Secure Checkout</h3>
                  <p className="text-gray-400 mb-6">
                    You'll be redirected to our secure payment processor to complete your purchase.
                  </p>

                  {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border-2 border-red-600 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm text-left">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-lg flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </button>

                  <div className="mt-6 flex items-center justify-center gap-4 text-gray-400 text-sm">
                    <span>Powered by Stripe</span>
                    <span>•</span>
                    <span>256-bit SSL Secure</span>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-3">What happens next?</h4>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex gap-2">
                      <span className="text-orange-500 flex-shrink-0">1.</span>
                      <span>Complete payment securely through Stripe</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 flex-shrink-0">2.</span>
                      <span>Receive order confirmation via email</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 flex-shrink-0">3.</span>
                      <span>Your rug will be carefully prepared and shipped</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500 flex-shrink-0">4.</span>
                      <span>Track your order using the tracking number</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black border-t border-gray-800 py-6 px-4 mt-12">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm">
            Designed, created, and powered by Two Tier Tech LLC (2025)
          </p>
        </div>
      </footer>
    </div>
  );
}
