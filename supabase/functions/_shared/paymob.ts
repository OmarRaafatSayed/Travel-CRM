import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';

export interface BillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}

export interface PaymobOrder {
  id: number;
  amount_cents: number;
  currency: string;
  merchant_order_id: string;
}

export async function retryFetch(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        const delay = 300 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export async function createAuthToken(): Promise<string> {
  const apiKey = Deno.env.get('PAYMOB_API_KEY');
  if (!apiKey) {
    throw new Error('PAYMOB_API_KEY not found in environment');
  }

  const response = await retryFetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey })
  });

  if (!response.ok) {
    throw new Error(`Failed to get auth token: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

export async function createOrder(
  amount_cents: number,
  currency: string,
  merchant_order_id: string,
  metadata?: object
): Promise<PaymobOrder> {
  const token = await createAuthToken();

  const response = await retryFetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents,
      currency,
      merchant_order_id,
      items: [],
      ...(metadata && { data: metadata })
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.status}`);
  }

  return await response.json();
}

export async function generatePaymentKey(
  orderId: number,
  amount_cents: number,
  billingData: BillingData,
  integration_id: string
): Promise<string> {
  const token = await createAuthToken();

  const response = await retryFetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      amount_cents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: "NA",
        email: billingData.email,
        floor: "NA",
        first_name: billingData.first_name,
        street: "NA",
        building: "NA",
        phone_number: billingData.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: billingData.city,
        country: billingData.country,
        last_name: billingData.last_name,
        state: "NA"
      },
      currency: "EGP",
      integration_id: parseInt(integration_id)
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate payment key: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

export async function verifyHmacSignature(rawBody: string, signatureHeader: string): Promise<boolean> {
  const hmacSecret = Deno.env.get('PAYMOB_HMAC_SECRET');
  if (!hmacSecret) {
    throw new Error('PAYMOB_HMAC_SECRET not found in environment');
  }

  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(hmacSecret);
    const data = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hexSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (hexSignature.length !== signatureHeader.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < hexSignature.length; i++) {
      result |= hexSignature.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    
    return result === 0;
  } catch {
    return false;
  }
}

export async function getSubscriptionPriceFromDB(
  planKey: string,
  users_count: number
): Promise<{ amount_cents: number; currency: 'EGP' | 'USD' }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase credentials not found in environment');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('price_usd, price_egp')
      .eq('key', planKey.toLowerCase())
      .single();

    if (error || !plan) {
      const fallbackPrices = { small: 4, medium: 3, large: 2.5 };
      const priceUsd = fallbackPrices[planKey.toLowerCase() as keyof typeof fallbackPrices] || 4;
      const exchangeRate = parseFloat(Deno.env.get('EXCHANGE_RATE_USD_TO_EGP') || '50');
      
      return {
        amount_cents: Math.round(priceUsd * users_count * exchangeRate * 100),
        currency: 'EGP'
      };
    }

    if (plan.price_egp) {
      return {
        amount_cents: Math.round(plan.price_egp * users_count * 100),
        currency: 'EGP'
      };
    }

    if (plan.price_usd) {
      const exchangeRate = parseFloat(Deno.env.get('EXCHANGE_RATE_USD_TO_EGP') || '50');
      return {
        amount_cents: Math.round(plan.price_usd * users_count * exchangeRate * 100),
        currency: 'EGP'
      };
    }

    throw new Error('No valid price found for plan');
  } catch (error) {
    console.error('Error fetching subscription price:', error);
    throw error;
  }
}