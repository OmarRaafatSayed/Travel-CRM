import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  minUsers: number;
  maxUsers: number | null;
  pricePerUser: number;
  features: string[];
  recommended?: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  tierId: string;
  users: number;
  totalPrice: number;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'small',
    name: 'Small Teams',
    description: 'Perfect for startups and small businesses',
    minUsers: 1,
    maxUsers: 9,
    pricePerUser: 4,
    features: [
      'Basic CRM Features',
      'Lead Management',
      'Deal Tracking',
      'Basic Reports',
      'Email Support',
    ],
  },
  {
    id: 'medium',
    name: 'Medium Teams',
    description: 'Ideal for growing businesses',
    minUsers: 10,
    maxUsers: 30,
    pricePerUser: 3,
    recommended: true,
    features: [
      'All Small Team Features',
      'Advanced Analytics',
      'Team Collaboration',
      'Custom Fields',
      'API Access',
      'Priority Support',
    ],
  },
  {
    id: 'large',
    name: 'Large Teams',
    description: 'For enterprises and large organizations',
    minUsers: 31,
    maxUsers: null,
    pricePerUser: 2.5,
    features: [
      'All Medium Team Features',
      'Advanced Automation',
      'White Labeling',
      'Dedicated Account Manager',
      'SSO Integration',
      '24/7 Phone Support',
    ],
  },
];

class SubscriptionService {
  /**
   * Get the appropriate tier for a given number of users
   */
  getTierForUsers(users: number): SubscriptionTier {
    return SUBSCRIPTION_TIERS.find(tier => 
      users >= tier.minUsers && (tier.maxUsers === null || users <= tier.maxUsers)
    ) || SUBSCRIPTION_TIERS[0];
  }

  /**
   * Calculate pricing for a subscription
   */
  calculatePricing(users: number): { tier: SubscriptionTier; totalPrice: number } {
    const tier = this.getTierForUsers(users);
    const totalPrice = users * tier.pricePerUser;
    return { tier, totalPrice };
  }

  /**
   * Create a new subscription
   */
  async createSubscription(
    organizationId: string,
    tierId: string,
    users: number,
    paymentData: {
      transactionId: string;
      paymentMethod: string;
      customerEmail: string;
      customerPhone: string;
    }
  ): Promise<{ subscription: Subscription; payment: PaymentRecord }> {
    try {
      const { tier, totalPrice } = this.calculatePricing(users);
      
      if (tier.id !== tierId) {
        throw new Error('Invalid tier for the specified number of users');
      }

      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Create subscription record
      const subscriptionData = {
        organization_id: organizationId,
        tier_id: tierId,
        users: users,
        total_price: totalPrice,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        cancel_at_period_end: false,
      };

      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      // Create payment record
      const paymentData_record = {
        subscription_id: subscription.id,
        transaction_id: paymentData.transactionId,
        amount: totalPrice,
        currency: 'USD',
        status: 'completed',
        payment_method: paymentData.paymentMethod,
        customer_email: paymentData.customerEmail,
        customer_phone: paymentData.customerPhone,
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData_record)
        .select()
        .single();

      if (paymentError) {
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }

      return {
        subscription: this.mapSubscriptionFromDB(subscription),
        payment: this.mapPaymentFromDB(payment),
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription by organization ID
   */
  async getSubscriptionByOrganization(organizationId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No subscription found
        }
        throw new Error(`Failed to get subscription: ${error.message}`);
      }

      return this.mapSubscriptionFromDB(data);
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription users
   */
  async updateSubscriptionUsers(subscriptionId: string, newUsers: number): Promise<Subscription> {
    try {
      const { tier, totalPrice } = this.calculatePricing(newUsers);

      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          tier_id: tier.id,
          users: newUsers,
          total_price: totalPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update subscription: ${error.message}`);
      }

      return this.mapSubscriptionFromDB(data);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    try {
      const updateData: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      };

      if (!cancelAtPeriodEnd) {
        updateData.status = 'cancelled';
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      return this.mapSubscriptionFromDB(data);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a subscription
   */
  async getPaymentHistory(subscriptionId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get payment history: ${error.message}`);
      }

      return data.map(this.mapPaymentFromDB);
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Check if organization has active subscription
   */
  async hasActiveSubscription(organizationId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionByOrganization(organizationId);
      return subscription !== null && subscription.status === 'active';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get subscription usage and limits
   */
  async getSubscriptionUsage(organizationId: string): Promise<{
    subscription: Subscription | null;
    tier: SubscriptionTier | null;
    usage: {
      currentUsers: number;
      maxUsers: number | null;
      utilizationPercentage: number;
    };
  }> {
    try {
      const subscription = await this.getSubscriptionByOrganization(organizationId);
      
      if (!subscription) {
        return {
          subscription: null,
          tier: null,
          usage: {
            currentUsers: 0,
            maxUsers: null,
            utilizationPercentage: 0,
          },
        };
      }

      const tier = SUBSCRIPTION_TIERS.find(t => t.id === subscription.tierId) || null;
      
      // Get actual user count from organization members
      const { count: currentUsers } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      const maxUsers = tier?.maxUsers || null;
      const utilizationPercentage = maxUsers 
        ? Math.round((currentUsers || 0) / maxUsers * 100)
        : 0;

      return {
        subscription,
        tier,
        usage: {
          currentUsers: currentUsers || 0,
          maxUsers,
          utilizationPercentage,
        },
      };
    } catch (error) {
      console.error('Error getting subscription usage:', error);
      throw error;
    }
  }

  /**
   * Map database subscription to interface
   */
  private mapSubscriptionFromDB(data: any): Subscription {
    return {
      id: data.id,
      organizationId: data.organization_id,
      tierId: data.tier_id,
      users: data.users,
      totalPrice: data.total_price,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map database payment to interface
   */
  private mapPaymentFromDB(data: any): PaymentRecord {
    return {
      id: data.id,
      subscriptionId: data.subscription_id,
      transactionId: data.transaction_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.payment_method,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

// Export class for custom instances
export { SubscriptionService };