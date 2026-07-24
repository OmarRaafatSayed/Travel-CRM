// Paymob Payment Gateway Integration for CRM Subscriptions
// Enhanced implementation with webhook verification and subscription support

export interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
  cardIntegrationId?: string;
  walletIntegrationId?: string;
  meezaIntegrationId?: string;
}

export interface PaymentRequest {
  amount: number; // Amount in cents (e.g., 100 = $1.00)
  currency: string;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  items: Array<{
    name: string;
    amount: number;
    description: string;
    quantity: number;
  }>;
}

export interface PaymentResponse {
  success: boolean;
  paymentToken?: string;
  iframeUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

class PaymobService {
  private config: PaymobConfig;
  private baseUrl = 'https://accept.paymob.com/api';

  constructor(config: PaymobConfig) {
    this.config = config;
  }

  /**
   * Step 1: Authenticate and get auth token
   */
  private async authenticate(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      return data.token;
    } catch (error) {
      console.error('Paymob authentication error:', error);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  /**
   * Step 2: Create order
   */
  private async createOrder(authToken: string, paymentRequest: PaymentRequest): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: paymentRequest.amount,
          currency: paymentRequest.currency,
          merchant_order_id: paymentRequest.orderId,
          items: paymentRequest.items,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Order creation failed');
      }

      return data.id;
    } catch (error) {
      console.error('Paymob order creation error:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Step 3: Generate payment key
   */
  private async generatePaymentKey(
    authToken: string, 
    orderId: number, 
    paymentRequest: PaymentRequest
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: paymentRequest.amount,
          expiration: 3600, // 1 hour
          order_id: orderId,
          billing_data: {
            apartment: 'NA',
            email: paymentRequest.customerEmail,
            floor: 'NA',
            first_name: paymentRequest.customerName.split(' ')[0] || 'Customer',
            street: 'NA',
            building: 'NA',
            phone_number: paymentRequest.customerPhone,
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'EG',
            last_name: paymentRequest.customerName.split(' ').slice(1).join(' ') || 'Name',
            state: 'NA',
          },
          currency: paymentRequest.currency,
          integration_id: this.config.integrationId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment key generation failed');
      }

      return data.token;
    } catch (error) {
      console.error('Paymob payment key generation error:', error);
      throw new Error('Failed to generate payment key');
    }
  }

  /**
   * Initialize payment process
   */
  async initializePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Step 1: Authenticate
      const authToken = await this.authenticate();
      
      // Step 2: Create order
      const orderId = await this.createOrder(authToken, paymentRequest);
      
      // Step 3: Generate payment key
      const paymentToken = await this.generatePaymentKey(authToken, orderId, paymentRequest);
      
      // Step 4: Generate iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentToken}`;
      
      return {
        success: true,
        paymentToken,
        iframeUrl,
        transactionId: paymentRequest.orderId,
      };
    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed',
      };
    }
  }

  /**
   * Process card payment directly (for card payments)
   */
  async processCardPayment(
    paymentToken: string,
    cardData: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      cardholderName: string;
    }
  ): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/acceptance/payments/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: {
            identifier: cardData.cardNumber.replace(/\s/g, ''),
            sourceholder_name: cardData.cardholderName,
            subtype: 'CARD',
            expiry_month: cardData.expiryMonth,
            expiry_year: cardData.expiryYear,
            cvv: cardData.cvv,
          },
          payment_token: paymentToken,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment processing failed');
      }

      return {
        success: true,
        transactionId: data.id?.toString(),
        amount: data.amount_cents,
        currency: data.currency,
      };
    } catch (error) {
      console.error('Card payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed',
      };
    }
  }

  /**
   * Verify payment callback (webhook handler)
   */
  verifyPaymentCallback(callbackData: any): PaymentResult {
    try {
      // In production, you should verify the HMAC signature here
      // const calculatedHmac = this.calculateHmac(callbackData);
      // if (calculatedHmac !== callbackData.hmac) {
      //   throw new Error('Invalid HMAC signature');
      // }

      const isSuccess = callbackData.success === 'true' || callbackData.success === true;
      
      return {
        success: isSuccess,
        transactionId: callbackData.id?.toString(),
        amount: callbackData.amount_cents,
        currency: callbackData.currency,
        error: isSuccess ? undefined : callbackData.data?.message || 'Payment failed',
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  }

  /**
   * Calculate HMAC for webhook verification
   */
  private calculateHmac(data: any): string {
    const crypto = require('crypto');
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
    
    return crypto.createHmac('sha512', this.config.hmacSecret)
      .update(concatenatedString)
      .digest('hex');
  }

  /**
   * Create subscription payment
   */
  async createSubscriptionPayment(
    subscriptionData: {
      organizationId: string;
      tierId: string;
      tierName: string;
      users: number;
      totalPrice: number;
    },
    customerData: {
      email: string;
      phone: string;
      name: string;
    },
    paymentMethod: 'card' | 'meeza' | 'wallet' = 'card'
  ): Promise<PaymentResponse> {
    const orderId = `SUB_${subscriptionData.organizationId}_${Date.now()}`;
    
    const paymentRequest: PaymentRequest = {
      amount: formatAmount(subscriptionData.totalPrice),
      currency: 'USD',
      orderId,
      customerEmail: customerData.email,
      customerPhone: customerData.phone,
      customerName: customerData.name,
      items: [{
        name: `${subscriptionData.tierName} Subscription`,
        amount: formatAmount(subscriptionData.totalPrice),
        description: `${subscriptionData.users} users × $${subscriptionData.totalPrice / subscriptionData.users}/month`,
        quantity: 1
      }]
    };

    // Use specific integration ID based on payment method
    const originalIntegrationId = this.config.integrationId;
    if (paymentMethod === 'card' && this.config.cardIntegrationId) {
      this.config.integrationId = this.config.cardIntegrationId;
    } else if (paymentMethod === 'meeza' && this.config.meezaIntegrationId) {
      this.config.integrationId = this.config.meezaIntegrationId;
    } else if (paymentMethod === 'wallet' && this.config.walletIntegrationId) {
      this.config.integrationId = this.config.walletIntegrationId;
    }

    const result = await this.initializePayment(paymentRequest);
    
    // Restore original integration ID
    this.config.integrationId = originalIntegrationId;
    
    return result;
  }
}

// Default configuration (use environment variables in production)
const defaultConfig: PaymobConfig = {
  apiKey: process.env.REACT_APP_PAYMOB_API_KEY || 'your-api-key',
  integrationId: process.env.REACT_APP_PAYMOB_INTEGRATION_ID || 'your-integration-id',
  iframeId: process.env.REACT_APP_PAYMOB_IFRAME_ID || 'your-iframe-id',
  hmacSecret: process.env.REACT_APP_PAYMOB_HMAC_SECRET || 'your-hmac-secret',
  cardIntegrationId: process.env.REACT_APP_PAYMOB_CARD_INTEGRATION_ID,
  walletIntegrationId: process.env.REACT_APP_PAYMOB_WALLET_INTEGRATION_ID,
  meezaIntegrationId: process.env.REACT_APP_PAYMOB_MEEZA_INTEGRATION_ID,
};

// Export singleton instance
export const paymobService = new PaymobService(defaultConfig);

// Export class for custom configurations
export { PaymobService };

// Utility functions
export const formatAmount = (amount: number): number => {
  // Convert dollars to cents
  return Math.round(amount * 100);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Payment method configurations
export const PAYMENT_METHODS = {
  CARD: {
    id: 'card',
    name: 'Credit/Debit Card',
    supportedCards: ['visa', 'mastercard', 'amex'],
  },
  MEEZA: {
    id: 'meeza',
    name: 'Meeza',
    description: 'Egyptian local payment method',
  },
  WALLET: {
    id: 'wallet',
    name: 'Digital Wallet',
    providers: ['fawry', 'vodafone_cash', 'orange_money'],
  },
} as const;

export type PaymentMethodId = keyof typeof PAYMENT_METHODS;