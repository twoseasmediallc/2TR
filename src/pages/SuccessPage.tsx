import React, { useEffect, useState } from 'react';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { getUserOrders, type UserOrder } from '../lib/stripe';
import { useAuth } from '../components/AuthProvider';

export const SuccessPage: React.FC = () => {
  const [latestOrder, setLatestOrder] = useState<UserOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLatestOrder = async () => {
      if (!user) return;
      
      try {
        const orders = await getUserOrders();
        if (orders.length > 0) {
          setLatestOrder(orders[0]); // Most recent order
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOrder();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400">Please sign in to view your order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-300 mb-8">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        {loading ? (
          <div className="bg-gray-900/50 rounded-2xl p-8 border-2 border-gray-800">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : latestOrder ? (
          <div className="bg-gray-900/50 rounded-2xl p-8 border-2 border-gray-800 mb-8">
            <div className="flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-semibold text-white">Order Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <p className="text-gray-400 text-sm mb-1">Order ID</p>
                <p className="text-white font-mono text-sm">{latestOrder.order_id}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Amount</p>
                <p className="text-white font-semibold">
                  ${(latestOrder.amount_total / 100).toFixed(2)} {latestOrder.currency.toUpperCase()}
                </p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Payment Status</p>
                <p className="text-green-400 font-medium capitalize">{latestOrder.payment_status}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-1">Order Date</p>
                <p className="text-white">
                  {new Date(latestOrder.order_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 rounded-2xl p-8 border-2 border-gray-800 mb-8">
            <p className="text-gray-400">Order details will be available shortly.</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-300">
            You will receive an email confirmation shortly with your order details and tracking information.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/premade"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
            
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};