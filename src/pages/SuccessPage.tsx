import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

export function SuccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const session = searchParams.get('session_id');
    if (!session) {
      navigate('/');
      return;
    }

    setSessionId(session);
  }, [user, searchParams, navigate]);

  if (!user || !sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-28 sm:pt-36 lg:pt-60">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto mb-6 w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" strokeWidth={2} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-xl text-gray-300 mb-8">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          <div className="bg-gray-900/50 rounded-xl border-2 border-gray-800 p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-semibold text-white">Order Details</h2>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Session ID:</span>
                <span className="text-white font-mono text-sm">{sessionId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Payment Status:</span>
                <span className="text-green-500 font-medium">Completed</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Email Confirmation:</span>
                <span className="text-white">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border-2 border-blue-600 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-3">What's Next?</h3>
            <div className="text-gray-300 space-y-2">
              <p>• You'll receive an email confirmation shortly</p>
              <p>• Your rugs will be carefully packaged and shipped</p>
              <p>• Track your order using the tracking information in your email</p>
              <p>• Delivery typically takes 5-7 business days</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/#tracker')}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Track Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}