import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export const useSubscriptionLimits = () => {
  const { organization } = useOrganization();
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionAndMembers = async () => {
      if (!organization?.id) return;

      try {
        // Fetch active subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('status', 'active')
          .single();

        setSubscription(subscriptionData);

        // Fetch current member count
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'approved');

        setMemberCount(count || 0);
      } catch (error) {
        console.error('Error fetching subscription limits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionAndMembers();
  }, [organization?.id]);

  const canAddMember = () => {
    if (!subscription) return true; // No subscription limits
    return memberCount < subscription.seats;
  };

  const getRemainingSeats = () => {
    if (!subscription) return null;
    return Math.max(0, subscription.seats - memberCount);
  };

  return {
    subscription,
    memberCount,
    loading,
    canAddMember,
    getRemainingSeats,
    maxSeats: subscription?.seats || null
  };
};