import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Terms & Conditions</h1>

        <div className="bg-gray-800/50 rounded-lg p-8 text-gray-300 space-y-6">
          <p className="text-sm text-gray-400 italic">Last Updated: March 2026</p>

          <p className="text-lg leading-relaxed">
            Welcome to Two Tuft Rugs. By accessing this website and placing an order, you agree to the following terms:
          </p>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">1. Custom Product Agreement</h2>
              <p className="leading-relaxed">
                All products sold by Two Tuft Rugs are custom-made. By placing an order, you acknowledge that your item is created specifically for you based on your selected or submitted design.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">2. Design Approval</h2>
              <p className="leading-relaxed">
                If a mockup or design is provided, approval from the customer confirms that the design, colors, and layout are accepted. Once approved, no changes can be made.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">3. All Sales Are Final</h2>
              <p className="leading-relaxed">
                Due to the custom nature of our products, all sales are final. No refunds, returns, or exchanges will be accepted once production has begun.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">4. Production Time</h2>
              <p className="leading-relaxed">
                Each rug is handmade. Production times may vary but are typically between 5-7 business days. Delays may occur during high demand periods.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">5. Handmade Disclaimer</h2>
              <p className="leading-relaxed">
                All rugs are handcrafted. Slight variations in color, shape, and texture are natural and should be expected.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">6. Limitation of Liability</h2>
              <p className="leading-relaxed">
                Two Tuft Rugs is not liable for any indirect, incidental, or consequential damages related to the use of our products.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">7. Custom Order Policy</h2>

              <div className="space-y-3 mt-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">a) Design Submission</h3>
                  <p className="leading-relaxed">
                    Customers may submit logos, images, or ideas for custom rugs.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-1">b) Mockups (if applicable)</h3>
                  <p className="leading-relaxed mb-2">
                    If a mockup is provided:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Customer approval is required before production</li>
                    <li>Approval = final confirmation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-1">c) Color & Detail Disclaimer</h3>
                  <p className="leading-relaxed mb-2">
                    Due to materials and lighting:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Colors may vary slightly from digital designs</li>
                    <li>Fine details may be adjusted for tufting feasibility</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-1">d) Artistic Interpretation</h3>
                  <p className="leading-relaxed">
                    Some designs may be slightly adapted to ensure durability and quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
