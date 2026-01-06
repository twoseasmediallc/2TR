import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { getUserSubscription, type UserSubscription } from '../lib/stripe';
import { stripeProducts } from '../stripe-config';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    loadUserSubscription();
  }, []);

  const loadUserSubscription = async () => {
    try {
      const userSubscription = await getUserSubscription();
      setSubscription(userSubscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const getSubscriptionPlanName = () => {
    if (!subscription?.price_id) return null;
    
    const product = stripeProducts.find(p => p.priceId === subscription.price_id);
    return product?.name || 'Unknown Plan';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-8 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-gray-400 text-lg">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {sessionId && (
            <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-white">Order Details</h2>
              </div>
              <div className="text-gray-300">
                <p className="mb-2">Session ID: <span className="font-mono text-sm">{sessionId}</span></p>
                <p className="text-sm">You will receive an email confirmation shortly.</p>
              </div>
            </div>
          )}

          {subscription && subscription.subscription_status === 'active' && (
            <div className="bg-orange-600/20 border-2 border-orange-600 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Active Subscription</h3>
              <p className="text-orange-400">
                Plan: {getSubscriptionPlanName()}
              </p>
              {subscription.current_period_end && (
                <p className="text-gray-400 text-sm mt-2">
                  Next billing: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Home
            </Link>
            
            <div className="text-gray-400 text-sm">
              <p>Need help? Contact us at orders@twotuftrugs.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}