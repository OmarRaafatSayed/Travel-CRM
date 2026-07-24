interface BillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}

interface CreatePaymentRequest {
  organization_id: string;
  user_id: string;
  planKey: string;
  users_count: number;
  billing: BillingData;
}

interface CreatePaymentResponse {
  paymentKey: string;
  iframeId: string;
  orderId: number;
  iframeUrl: string;
}

export async function createSubscriptionPayment(
  planKey: string,
  users_count: number,
  billing: BillingData,
  organization_id: string,
  user_id: string
): Promise<CreatePaymentResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  const request: CreatePaymentRequest = {
    organization_id,
    user_id,
    planKey,
    users_count,
    billing
  };

  const response = await fetch(`${supabaseUrl}/functions/v1/paymob-init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

export function openPaymobIframe(iframeUrl: string): void {
  const popup = window.open(
    iframeUrl,
    'paymob-payment',
    'width=800,height=600,scrollbars=yes,resizable=yes'
  );

  if (!popup) {
    window.location.href = iframeUrl;
  }
}

// Paymob client object
export const paymobClient = {
  async createSubscriptionPayment(
    tierId: string,
    users: number,
    customer: { name: string; email: string; phone: string }
  ): Promise<{ success: boolean; iframeUrl?: string; error?: string }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/paymob-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          tierId,
          users,
          customer
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        return {
          success: false,
          error: error.error || `HTTP ${response.status}`
        };
      }

      const result = await response.json();
      return {
        success: true,
        iframeUrl: result.iframeUrl
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment initialization failed'
      };
    }
  }
};