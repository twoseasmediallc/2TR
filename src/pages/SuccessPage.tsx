import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft } from 'lucide-react';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // In a real app, you might want to fetch order details using the session_id
    // For now, we'll just show a success message
    if (sessionId) {
      setOrderDetails({ sessionId });
    }
  }, [sessionId]);

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

        {sessionId && (
          <div className="bg-gray-900/50 rounded-xl p-6 border-2 border-gray-800 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-white">Order Details</h2>
            </div>
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Session ID:</span>
                <span className="text-white font-mono text-sm">{sessionId.slice(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400">Confirmed</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-300">
            You will receive an email confirmation shortly with your order details and tracking information.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
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