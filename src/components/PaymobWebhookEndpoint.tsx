import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { paymobService } from '@/lib/paymob';
import { subscriptionService } from '@/lib/subscription';
import { toast } from 'sonner';

interface PaymobWebhookData {
  id: string;
  amount_cents: number;
  currency: string;
  success: boolean;
  error_occured: boolean;
  created_at: string;
  order: {
    id: string;
    merchant_order_id: string;
  };
  integration_id: string;
  hmac: string;
  [key: string]: any;
}

export const PaymobWebhookEndpoint: React.FC = () => {
  useEffect(() => {
    // This component handles webhook processing
    // In a real implementation, this would be a server-side endpoint
    const handleWebhook = async (webhookData: PaymobWebhookData) => {
      try {
        // Verify webhook signature
        const paymentResult = paymobService.verifyPaymentCallback(webhookData);
        
        if (!paymentResult.success) {
          console.error('Payment verification failed:', paymentResult.error);
          return;
        }

        // Extract subscription data from merchant_order_id
        const merchantOrderId = webhookData.order.merchant_order_id;
        if (!merchantOrderId.startsWith('SUB_')) {
          console.log('Not a subscription payment, skipping');
          return;
        }

        // Parse organization ID from order ID
        const parts = merchantOrderId.split('_');
        if (parts.length < 2) {
          console.error('Invalid merchant order ID format');
          return;
        }

        const organizationId = parts[1];

        // Update payment status in database
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: webhookData.success ? 'completed' : 'failed',
            transaction_id: webhookData.id.toString(),
          })
          .eq('transaction_id', merchantOrderId);

        if (updateError) {
          console.error('Failed to update payment status:', updateError);
          return;
        }

        // If payment successful, activate subscription
        if (webhookData.success) {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

          if (subscriptionError) {
            console.error('Failed to activate subscription:', subscriptionError);
          } else {
            console.log('Subscription activated successfully');
          }
        }

      } catch (error) {
        console.error('Webhook processing error:', error);
      }
    };

    // Listen for webhook events (this would typically be handled server-side)
    window.addEventListener('paymob-webhook', (event: any) => {
      handleWebhook(event.detail);
    });

    return () => {
      window.removeEventListener('paymob-webhook', () => {});
    };
  }, []);

  return null; // This component doesn't render anything
};

// Server-side webhook handler function (for reference)
export const handlePaymobWebhook = async (req: any, res: any) => {
  try {
    const webhookData = req.body;
    
    // Verify webhook signature
    const paymentResult = paymobService.verifyPaymentCallback(webhookData);
    
    if (!paymentResult.success) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Process the webhook data
    const merchantOrderId = webhookData.order.merchant_order_id;
    
    if (merchantOrderId.startsWith('SUB_')) {
      // Handle subscription payment
      const parts = merchantOrderId.split('_');
      const organizationId = parts[1];

      // Update payment and subscription status
      if (webhookData.success) {
        // Activate subscription
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('organization_id', organizationId);
          
        // Send confirmation email
        // await sendSubscriptionConfirmationEmail(organizationId);
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default PaymobWebhookEndpoint;