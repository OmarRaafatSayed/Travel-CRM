import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  createOrder, 
  generatePaymentKey, 
  getSubscriptionPriceFromDB,
  BillingData 
} from '../_shared/paymob.ts';

interface InitPaymentRequest {
  organization_id: string;
  user_id: string;
  planKey: string;
  users_count: number;
  billing: BillingData;
}

interface InitPaymentResponse {
  paymentKey: string;
  iframeId: string;
  orderId: number;
  iframeUrl: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: InitPaymentRequest = await req.json();
    
    // Validate input
    if (!body.organization_id || !body.user_id || !body.planKey || !body.users_count || !body.billing) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.billing.first_name || !body.billing.last_name || !body.billing.email || !body.billing.phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required billing fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const integrationId = Deno.env.get('PAYMOB_INTEGRATION_ID');
    const iframeId = Deno.env.get('PAYMOB_IFRAME_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!integrationId || !iframeId || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription price
    const { amount_cents, currency } = await getSubscriptionPriceFromDB(body.planKey, body.users_count);
    
    // Create merchant order ID
    const merchantOrderId = `${body.organization_id}-${Date.now()}`;
    
    // Create Paymob order
    const order = await createOrder(
      amount_cents,
      currency,
      merchantOrderId,
      {
        organization_id: body.organization_id,
        user_id: body.user_id,
        plan: body.planKey,
        users_count: body.users_count
      }
    );

    // Generate payment key
    const paymentKey = await generatePaymentKey(
      order.id,
      amount_cents,
      body.billing,
      integrationId
    );

    // Save payment record
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        organization_id: body.organization_id,
        user_id: body.user_id,
        paymob_order_id: order.id.toString(),
        amount_cents,
        currency,
        plan: body.planKey,
        users_count: body.users_count,
        method: 'paymob',
        status: 'pending'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save payment record' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    const response: InitPaymentResponse = {
      paymentKey,
      iframeId,
      orderId: order.id,
      iframeUrl
    };

    console.log(`Payment initialized for organization ${body.organization_id}, order ${order.id}`);

    return new Response(
      JSON.stringify(response), 
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        } 
      }
    );

  } catch (error) {
    console.error('Payment initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 : 
                      errorMessage.includes('validation') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: statusCode, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
});