import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="bg-gray-800/50 rounded-lg p-8 text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 italic">Last Updated: March 2026</p>

          <p className="text-lg leading-relaxed">
            We respect your privacy.
          </p>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">a) Information We Collect</h2>
              <ul className="list-disc list-inside space-y-1 ml-4 leading-relaxed">
                <li>Name</li>
                <li>Email</li>
                <li>Shipping address</li>
                <li>Payment details (processed securely via Stripe)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">b) How We Use It</h2>
              <ul className="list-disc list-inside space-y-1 ml-4 leading-relaxed">
                <li>To process orders</li>
                <li>To communicate updates</li>
                <li>To improve customer experience</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">c) Protection</h2>
              <p className="leading-relaxed">
                Your data is securely handled and never sold to third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
