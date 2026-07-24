import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function RefundPolicy() {
  const { t } = useTranslation();
  
  return (
    <>
      <SEOHead 
        title="Refund Policy – Sky CRM"
        description="Refund and cancellation policy for subscriptions and payments at Sky CRM."
        canonical="https://skycrm.com/refund-policy"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-600">Effective date: January 1, 2025</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            This Refund Policy applies to subscriptions and digital services provided via skycrm.com. 
            It outlines customers' refund rights and how to request refunds.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                1. Subscription Refunds (Monthly/Annual)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Monthly Subscriptions</h4>
                <p className="text-green-700">Refunds may be requested within 14 days of purchase if service has not been materially used and the issue stems from our technical fault.</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Annual Subscriptions</h4>
                <p className="text-yellow-700">Partial refunds may be considered within 30 days based on prorated unused period (e.g., if 3 months used out of 12, refund for remaining period after processing fees).</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Cancellation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Users may cancel at any time; access continues until the end of the current billing period. No automatic pro-rata refunds unless agreed otherwise.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                3. Eligible Refund Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Major technical failure on our side preventing service use</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Duplicate subscription charged in error (e.g., two identical charges within 48 hours)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Billing system errors attributable to Sky CRM</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                4. Ineligible Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Change of mind after reasonable use</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Inability to use due to local device or system incompatibility on the customer side</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                  <span>Bank-initiated chargebacks unrelated to our documented errors</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Request Procedure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">How to Request a Refund:</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Submit refund request to <a href="mailto:support@skycrm.com" className="underline">support@skycrm.com</a> with proof of payment and explanation</li>
                  <li>We respond within 5–7 business days to start an investigation</li>
                  <li>Approved refunds processed within 7–14 business days depending on payment provider and bank</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Fees & Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Processing fees or service fees may be deducted where applicable and disclosed.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Provider-specific Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Refunds are issued through the payment gateway used (Paymob). Processing times and policies may vary.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Chargebacks & Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>For chargebacks, we will cooperate and provide evidence via the payment processor. We reserve the right to contest illegitimate disputes.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We may update this policy; users will be notified of material changes.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Refunds & Support:</p>
                <p>Email: <a href="mailto:support@skycrm.com" className="text-blue-600 hover:underline">support@skycrm.com</a></p>
                <p className="text-sm text-gray-600 mt-2">Please include your subscription details and reason for refund request.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Important Note</h3>
              <p className="text-yellow-700">
                All refund requests are reviewed on a case-by-case basis. We aim to be fair and reasonable while protecting against abuse. 
                For the fastest resolution, please provide detailed information about your refund request.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}