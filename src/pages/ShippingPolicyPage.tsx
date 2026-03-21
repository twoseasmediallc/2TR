import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ShippingPolicyPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Shipping Policy</h1>

        <div className="bg-gray-800/50 rounded-lg p-8 text-gray-300">
          <p className="text-sm text-gray-400 mb-6">Last Updated: March 2026</p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">a) Processing Time</h2>
              <p className="leading-relaxed">
                All rugs are handmade and require 5-7 business days before shipment.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">b) Shipping Time</h2>
              <p className="leading-relaxed">
                Shipping typically takes 3-5 business days depending on location.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">c) Shipping Responsibility</h2>
              <p className="leading-relaxed mb-3">
                Once your order is shipped:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not responsible for carrier delays</li>
                <li>We are not responsible for lost or stolen packages</li>
              </ul>
              <p className="leading-relaxed mt-3">
                If an issue occurs, we recommend contacting the shipping carrier directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
