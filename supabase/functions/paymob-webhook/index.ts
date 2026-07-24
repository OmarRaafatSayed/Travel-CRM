import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyHmacSignature } from '../_shared/paymob.ts';

interface WebhookPayload {
  type: string;
  obj?: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    integration_id: number;
    profile_id: number;
    has_parent_transaction: boolean;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: any;
      amount_cents: number;
      currency: string;
      is_payment_locked: boolean;
      merchant_order_id: string;
      wallet_notification: any;
      paid_amount_cents: number;
      items: any[];
      data: any;
    };
    created_at: string;
    transaction_processed_callback_responses: any[];
    currency: string;
    source_data: any;
    api_source: string;
    terminal_id: any;
    merchant_commission: number;
    installment: any;
    discount_details: any[];
    is_void: boolean;
    is_refund: boolean;
    data: any;
    is_hidden: boolean;
    payment_key_claims: any;
    error_occured: boolean;
    is_live: boolean;
    other_endpoint_reference: any;
    refunded_amount_cents: number;
    source_id: number;
    is_captured: boolean;
    captured_amount: number;
    merchant_staff_tag: any;
    updated_at: string;
    is_settled: boolean;
    bill_balanced: boolean;
    is_bill: boolean;
    owner: number;
    parent_transaction: any;
  };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Read raw body for HMAC verification
    const rawBody = await req.text();
    
    // Get signature from headers
    const signature = req.headers.get('X-Paymob-Signature') || 
                     req.headers.get('x-paymob-signature') ||
                     req.headers.get('signature');

    if (!signature) {
      console.error('No signature header found');
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify HMAC signature
    const isValidSignature = await verifyHmacSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error('Invalid HMAC signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    
    // Extract order ID
    let orderId: number | null = null;
    if (payload.obj?.order?.id) {
      orderId = payload.obj.order.id;
    } else if (payload.obj?.id) {
      orderId = payload.obj.id;
    }

    if (!orderId) {
      console.error('No order ID found in payload');
      return new Response('Bad Request', { status: 400 });
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase credentials not found');
      return new Response('Server configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('paymob_order_id', orderId.toString())
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', orderId);
      return new Response('Payment not found', { status: 404 });
    }

    // Check if transaction is successful
    const isSuccessful = payload.obj?.success === true && 
                        payload.obj?.is_capture === true &&
                        payload.obj?.pending === false;

    if (isSuccessful) {
      // Update payment status to success
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          transaction_id: payload.obj?.id?.toString(),
          raw_response: payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
        return new Response('Database error', { status: 500 });
      }

      // Update or create subscription
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          organization_id: payment.organization_id,
          plan: payment.plan,
          seats: payment.users_count,
          status: 'active',
          started_at: new Date().toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        });

      if (subscriptionError) {
        console.error('Failed to update subscription:', subscriptionError);
        // Don't return error here as payment was successful
      }

      console.log(`Payment successful for order ${orderId}, organization ${payment.organization_id}`);
    } else {
      // Update payment status to failed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          raw_response: payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Failed to update payment:', updateError);
      }

      console.log(`Payment failed for order ${orderId}`);
    }

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});