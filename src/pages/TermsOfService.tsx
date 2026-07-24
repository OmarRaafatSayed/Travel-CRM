import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SEOHead } from '@/components/SEOHead';

export default function TermsOfService() {
  const { t } = useTranslation();
  
  return (
    <>
      <SEOHead 
        title="Terms of Service – Sky CRM"
        description="Terms of Service for Sky CRM — usage rules, subscriptions, billing and legal terms."
        canonical="https://skycrm.com/terms-of-service"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Effective date: January 1, 2025</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Welcome to Sky CRM ("we", "us", "our"). By using our services at skycrm.com you agree to these Terms of Service. 
            If you do not agree, please do not use the platform.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>"Service"</strong> means our web-based CRM system, associated APIs, and related services.</p>
              <p><strong>"User"</strong> or "you" means any person or entity accessing the Service.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Account Creation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>You must provide accurate information. You are responsible for your account credentials and all activity under your account.</p>
              <p>We reserve the right to suspend or terminate accounts suspected of misuse or breaches.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. License and Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>We grant you a limited, non-exclusive, non-transferable license to use the Service under these Terms.</p>
              <p>You shall not use the Service for unlawful activities or infringing content.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscriptions & Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Subscriptions are billed monthly or annually according to the selected plan. Prices are shown on the Pricing page.</p>
              <p>Payments are processed in EGP through third-party providers (Paymob).</p>
              <p>Cancellation takes effect at the end of the current billing period unless otherwise specified.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Refunds are handled under the Refund Policy at <a href="/refund-policy" className="text-blue-600 hover:underline">skycrm.com/refund-policy</a>.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Changes to Service & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We may modify the Service or prices; we will notify customers of material changes as required by law.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <p>All IP, software, branding, and content on the platform are owned by Sky CRM or licensors. No rights to resell, redistribute or reuse content without written permission.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>To the fullest extent permitted by law, Sky CRM is not liable for indirect, incidental, special, or consequential damages arising from use of the Service.</p>
              <p>The maximum liability shall not exceed amounts paid in the prior three (3) months.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We protect your data as outlined in our Privacy Policy: <a href="/privacy" className="text-blue-600 hover:underline">skycrm.com/privacy</a>.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We may terminate or suspend access for any reason, especially breach of these Terms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p>These Terms are governed by the laws of Egypt. Disputes will be resolved in the courts of Egypt.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <p>For questions, contact: <a href="mailto:support@skycrm.com" className="text-blue-600 hover:underline">support@skycrm.com</a></p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}