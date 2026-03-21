import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Refund Policy</h1>

        <div className="bg-gray-800/50 rounded-lg p-8 text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 italic">Last Updated: March 2026</p>

          <p className="text-lg leading-relaxed">
            At Two Tuft Rugs, every piece is made to order.
          </p>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">All Sales Are Final</h2>
              <p className="leading-relaxed">
                We do not accept returns, cancellations, or refunds once production has started.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">a) Exceptions (We Take Care of Our People)</h2>
              <p className="leading-relaxed mb-3">
                We will only offer a resolution if:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your item arrives damaged, or</li>
                <li>There is a clear error made by us</li>
              </ul>
              <p className="leading-relaxed mt-3">
                If this occurs, contact us within 48 hours of delivery with photo proof.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">b) Non-Refundable Situations</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Minor variations in color or texture</li>
                <li>Change of mind after ordering</li>
                <li>Incorrect information provided by customer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
