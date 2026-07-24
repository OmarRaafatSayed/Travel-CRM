// Server-side webhook handler for Paymob payments
// This should be deployed as a serverless function or API endpoint

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const paymobHmacSecret = process.env.PAYMOB_HMAC_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

/**
 * Calculate HMAC for webhook verification
 */
function calculateHmac(data: PaymobWebhookData): string {
  const concatenatedString = [
    data.amount_cents,
    data.created_at,
    data.currency,
    data.error_occured,
    data.has_parent_transaction,
    data.id,
    data.integration_id,
    data.is_3d_secure,
    data.is_auth,
    data.is_capture,
    data.is_refunded,
    data.is_standalone_payment,
    data.is_voided,
    data.order?.id,
    data.owner,
    data.pending,
    data.source_data_pan,
    data.source_data_sub_type,
    data.source_data_type,
    data.success
  ].join('');
  
  return crypto.createHmac('sha512', paymobHmacSecret)
    .update(concatenatedString)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(data: PaymobWebhookData): boolean {
  const calculatedHmac = calculateHmac(data);
  return calculatedHmac === data.hmac;
}

/**
 * Send subscription confirmation email
 */
async function sendSubscriptionConfirmationEmail(organizationId: string, subscriptionData: any) {
  // Implementation depends on your email service (SendGrid, AWS SES, etc.)
  console.log(`Sending confirmation email for organization ${organizationId}`);
  
  // Example with a generic email service
  try {
    // Get organization and user details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, owner_id')
      .eq('id', organizationId)
      .single();

    if (org) {
      const { data: user } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', org.owner_id)
        .single();

      if (user) {
        // Send email using your preferred service
        console.log(`Sending email to ${user.email} for ${org.name}`);
        // await emailService.send({
        //   to: user.email,
        //   subject: 'Subscription Activated - Sky CRM',
        //   template: 'subscription-confirmation',
        //   data: { ...subscriptionData, organizationName: org.name }
        // });
      }
    }
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

/**
 * Main webhook handler function
 */
export async function handlePaymobWebhook(request: Request): Promise<Response> {
  try {
    const webhookData: PaymobWebhookData = await request.json();
    
    // Verify webhook signature
    if (!verifyWebhookSignature(webhookData)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 400 });
    }

    console.log('Processing Paymob webhook:', webhookData.id);

    // Extract subscription data from merchant_order_id
    const merchantOrderId = webhookData.order.merchant_order_id;
    
    if (!merchantOrderId.startsWith('SUB_')) {
      console.log('Not a subscription payment, skipping');
      return new Response('Not a subscription payment', { status: 200 });
    }

    // Parse organization ID from order ID
    const parts = merchantOrderId.split('_');
    if (parts.length < 2) {
      console.error('Invalid merchant order ID format:', merchantOrderId);
      return new Response('Invalid order ID format', { status: 400 });
    }

    const organizationId = parts[1];
    const timestamp = parts[2];

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
      return new Response('Database update failed', { status: 500 });
    }

    // If payment successful, activate subscription
    if (webhookData.success) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .select()
        .single();

      if (subscriptionError) {
        console.error('Failed to activate subscription:', subscriptionError);
        return new Response('Subscription activation failed', { status: 500 });
      }

      console.log('Subscription activated successfully:', subscription.id);

      // Send confirmation email
      await sendSubscriptionConfirmationEmail(organizationId, {
        tierName: subscription.tier_name,
        users: subscription.users,
        totalPrice: subscription.total_price,
        transactionId: webhookData.id,
      });

      // Log successful payment
      console.log(`Payment successful: ${webhookData.id} for organization ${organizationId}`);
    } else {
      console.log(`Payment failed: ${webhookData.id} for organization ${organizationId}`);
      
      // Optionally, send failure notification
      // await sendPaymentFailureNotification(organizationId, webhookData);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// For Vercel/Netlify deployment
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'content-type': 'application/json' },
    });

    const response = await handlePaymobWebhook(request);
    const text = await response.text();
    
    return res.status(response.status).json({ message: text });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// For Express.js deployment
export function expressHandler(req: any, res: any) {
  return handler(req, res);
}