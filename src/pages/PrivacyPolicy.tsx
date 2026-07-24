import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Users, Lock, Eye, Mail } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  
  return (
    <>
      <SEOHead 
        title="Privacy Policy – Sky CRM"
        description="Learn how Sky CRM collects, uses, and protects your personal data."
        canonical="https://skycrm.com/privacy-policy"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: January 1, 2025</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy Policy Overview</h2>
          <p className="text-gray-700 leading-relaxed">
            This Privacy Policy describes how Sky CRM collects, uses, and protects your personal information when you use our CRM platform. 
            We are committed to ensuring your privacy is protected and that we comply with all applicable data protection laws.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                1. Data Controller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Controller:</strong> Sky CRM</p>
              <p><strong>Contact:</strong> <a href="mailto:privacy@skycrm.com" className="text-blue-600 hover:underline">privacy@skycrm.com</a></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">A. Information you provide:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Name, email, phone, billing details, company name</li>
                  <li>• Profile and account information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">B. Usage information:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Login logs, pages visited, preferences, error reports</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">C. Technical info:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• IP address, device info, browser type</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">D. Cookies & similar technologies</h4>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. How We Collect Data</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>• Provided directly through registration, forms, uploads</li>
                <li>• Automatically via cookies and analytics tools</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Purposes of Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>• Provide and maintain the Service; account administration and billing</li>
                <li>• System notifications and customer support</li>
                <li>• Service improvement and analytics</li>
                <li>• Legal compliance and fraud prevention</li>
                <li>• Marketing (with consent)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Legal Bases</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Performance of contract, legal obligations, consent for marketing.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                6. Sharing & Third Parties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>• Payment processors (Paymob)</li>
                <li>• Hosting & DB providers (Supabase)</li>
                <li>• Analytics providers (Google Analytics) – optional</li>
                <li>• Legal requests & fraud prevention</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. International Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Data may be transferred to service providers in other countries; safeguards will be applied.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Data retained as needed for service and legal compliance (e.g., billing records for 7 years).</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>• Access, rectification, erasure, restrict processing, data portability, object</li>
                <li>• Contact <a href="mailto:privacy@skycrm.com" className="text-blue-600 hover:underline">privacy@skycrm.com</a> to exercise rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                10. Security Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>HTTPS, encryption, access controls, regular security reviews.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Types:</strong> essential, performance, analytics, marketing</p>
              <p>Cookie settings page available for users.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Children</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Not intended for children under 16 (or local minimum age).</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We will notify users of substantive changes.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                14. Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Privacy Questions & Requests:</p>
                <p>Email: <a href="mailto:privacy@skycrm.com" className="text-blue-600 hover:underline">privacy@skycrm.com</a></p>
                <p className="text-sm text-gray-600 mt-2">We respond to privacy requests within 30 days.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}