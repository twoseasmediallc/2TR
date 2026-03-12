import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Download } from 'lucide-react';

interface OrderDetails {
  checkout_session_id: string;
  amount_total: number;
  currency: string;
  payment_status: string;
  receipt_url: string | null;
  created_at: string;
}

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-details?session_id=${sessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const data = await response.json();
        setOrderDetails(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-white text-lg">Loading order details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-400 text-lg">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>
        </div>

        {orderDetails && (
          <div className="bg-gray-900/50 rounded-xl p-6 border-2 border-gray-800 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-white">Order Details</h2>
            </div>
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white font-mono text-sm">{orderDetails.checkout_session_id.slice(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">
                  ${(orderDetails.amount_total / 100).toFixed(2)} {orderDetails.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 capitalize">{orderDetails.payment_status}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-300">
            You will receive an email confirmation shortly with your order details and tracking information.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {orderDetails?.receipt_url && (
              <a
                href={orderDetails.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </a>
            )}
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}