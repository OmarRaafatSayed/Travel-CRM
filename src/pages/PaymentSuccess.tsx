import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  Users,
  DollarSign,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { subscriptionService } from '@/lib/subscription';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';


interface PaymentSuccessData {
  subscription: {
    tierId: string;
    tierName: string;
    pricePerUser: number;
    users: number;
    totalPrice: number;
  };
  payment: {
    transactionId: string;
    method: string;
    email: string;
    phone: string;
    date: string;
  };
}

const PaymentSuccess: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<PaymentSuccessData | null>(location.state as PaymentSuccessData);



  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('payment.processing')}</p>
        </div>
      </div>
    );
  }



  if (!data) {
    navigate('/pricing');
    return null;
  }

  const { subscription, payment } = data;

  const generateInvoicePDF = () => {
    // In a real implementation, this would generate and download a PDF invoice
    // For now, we'll simulate the download
    const invoiceData = {
      invoiceNumber: `INV-${payment.transactionId}`,
      date: format(new Date(payment.date), 'PPP'),
      customerEmail: payment.email,
      customerPhone: payment.phone,
      plan: subscription.tierName,
      users: subscription.users,
      pricePerUser: subscription.pricePerUser,
      totalAmount: subscription.totalPrice,
      paymentMethod: payment.method,
      transactionId: payment.transactionId,
    };

    // Create a simple text-based invoice content
    const invoiceContent = `
INVOICE
Invoice Number: ${invoiceData.invoiceNumber}
Date: ${invoiceData.date}

BILL TO:
Email: ${invoiceData.customerEmail}
Phone: ${invoiceData.customerPhone}

SUBSCRIPTION DETAILS:
Plan: ${invoiceData.plan}
Users: ${invoiceData.users}
Price per User: $${invoiceData.pricePerUser}/month
Total Amount: $${invoiceData.totalAmount}/month

PAYMENT DETAILS:
Payment Method: ${invoiceData.paymentMethod}
Transaction ID: ${invoiceData.transactionId}
Status: Paid

Thank you for your business!
    `;

    // Create and download the file
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceData.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getPaymentMethodName = (method: string): string => {
    switch (method) {
      case 'card':
        return t('payment.methods.card', 'Credit/Debit Card');
      case 'meeza':
        return t('payment.methods.meeza', 'Meeza');
      case 'wallet':
        return t('payment.methods.wallet', 'Digital Wallet');

      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'meeza':
        return <Phone className="h-4 w-4" />;
      case 'wallet':
        return <DollarSign className="h-4 w-4" />;

      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black dark:bg-white rounded-full mb-6">
              <CheckCircle className="h-10 w-10 text-white dark:text-black" />
            </div>
            <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
              {t('payment_success.title', 'Payment Successful!')}
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
              {t('payment_success.subtitle', 'Thank you for subscribing to our CRM platform')}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t('payment_success.confirmation_sent', 'A confirmation email has been sent to')} {payment.email}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Subscription Details */}
            <Card className="bg-white dark:bg-black border-2 border-black dark:border-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                  <Users className="h-5 w-5 text-black dark:text-white" />
                  {t('payment_success.subscription_details', 'Subscription Details')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('payment_success.subscription_active', 'Your subscription is now active')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black dark:text-white">{t('payment_success.plan', 'Plan')}</span>
                  <Badge variant="secondary" className="bg-black text-white dark:bg-white dark:text-black">
                    {subscription.tierName}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.users', 'Number of Users')}</span>
                  <span className="font-semibold text-black dark:text-white">{subscription.users}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.price_per_user', 'Price per User')}</span>
                  <span className="text-black dark:text-white">${subscription.pricePerUser}/{t('payment_success.month', 'month')}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-black dark:text-white">{t('payment_success.monthly_total', 'Monthly Total')}</span>
                  <span className="text-black dark:text-white">${subscription.totalPrice}</span>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-black dark:border-white">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {t('payment_success.next_billing', 'Next billing date:')} {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'PPP')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="bg-white dark:bg-black border-2 border-black dark:border-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                  <CheckCircle className="h-5 w-5 text-black dark:text-white" />
                  {t('payment_success.payment_information', 'Payment Information')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('payment_success.transaction_completed', 'Transaction completed successfully')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.transaction_id', 'Transaction ID')}</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm text-black dark:text-white">
                    {payment.transactionId}
                  </code>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.payment_method', 'Payment Method')}</span>
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    {getPaymentMethodIcon(payment.method)}
                    <span>{getPaymentMethodName(payment.method)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.payment_date', 'Payment Date')}</span>
                  <span className="text-black dark:text-white">{format(new Date(payment.date), 'PPP')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-white">{t('payment_success.amount_paid', 'Amount Paid')}</span>
                  <span className="font-bold text-black dark:text-white">${subscription.totalPrice}</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4" />
                    <span>{payment.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Phone className="h-4 w-4" />
                    <span>{payment.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What's Next */}
          <Card className="mt-8 bg-white dark:bg-black border-2 border-black dark:border-white">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">{t('payment_success.whats_next', "What's Next?")}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('payment_success.get_started', 'Get started with your new CRM subscription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <h3 className="font-semibold mb-2 text-black dark:text-white">
                    {t('payment_success.step1_title', 'Set Up Your Team')}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t('payment_success.step1_desc', 'Invite team members and assign roles')}
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <h3 className="font-semibold mb-2 text-black dark:text-white">
                    {t('payment_success.step2_title', 'Import Your Data')}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t('payment_success.step2_desc', 'Import leads, contacts, and deals')}
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-white dark:text-black" />
                  </div>
                  <h3 className="font-semibold mb-2 text-black dark:text-white">
                    {t('payment_success.step3_title', 'Start Selling')}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t('payment_success.step3_desc', 'Begin managing your sales pipeline')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              onClick={generateInvoicePDF}
              variant="outline"
              className="flex items-center gap-2 border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            >
              <Download className="h-4 w-4" />
              {t('payment_success.download_invoice', 'Download Invoice')}
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-2 border-black dark:border-white"
              size="lg"
            >
              {t('payment_success.continue_to_dashboard')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Support Information */}
          <div className="text-center mt-12 p-6 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-black dark:border-white">
            <h3 className="font-semibold mb-2 text-black dark:text-white">
              {t('payment_success.need_help', 'Need Help Getting Started?')}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('payment_success.support_message', 'Our support team is here to help you get the most out of your CRM')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="sm" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                {t('payment_success.contact_support', 'Contact Support')}
              </Button>
              <Button variant="outline" size="sm" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                {t('payment_success.view_documentation', 'View Documentation')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;