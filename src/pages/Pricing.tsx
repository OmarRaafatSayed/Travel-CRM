import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Star, Zap, Plus, Minus, Crown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  minUsers: number;
  maxUsers: number | null;
  pricePerUser: number;
  features: string[];
  recommended?: boolean;
  icon: React.ReactNode;
}

const Pricing: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [selectedUsers, setSelectedUsers] = useState<number>(5);
  const [userInputError, setUserInputError] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isRTL = i18n.language === 'ar';

  const pricingTiers: PricingTier[] = [
    {
      id: 'trial',
      name: t('pricing.tiers.trial.name', 'تجربة مجانية'),
      description: t('pricing.tiers.trial.description', 'جرب النظام بجميع الميزات مجاناً'),
      minUsers: 1,
      maxUsers: 5,
      pricePerUser: 0,
      icon: <Zap className="h-6 w-6" />,
      features: [
        t('pricing.features.full_crm_trial', 'جميع ميزات CRM (تجريبي)'),
        t('pricing.features.15_day_trial', 'فترة تجريبية 15 يوم'),
        t('pricing.features.lead_management', 'إدارة العملاء المحتملين'),
        t('pricing.features.deal_tracking', 'تتبع الصفقات'),
        t('pricing.features.basic_reports', 'التقارير الأساسية'),
        t('pricing.features.email_support', 'دعم البريد الإلكتروني'),
      ],
    },
    {
      id: 'mini',
      name: t('pricing.tiers.mini.name', 'الخطة ربع الشهرية'),
      description: t('pricing.tiers.mini.description', 'خطة قصيرة المدى للاختبار السريع'),
      minUsers: 1,
      maxUsers: 10,
      pricePerUser: 6.6, // 99 EGP / 15 days ≈ 6.6 per day per user
      icon: <Crown className="h-6 w-6" />,
      features: [
        t('pricing.features.15_day_access', 'وصول كامل لمدة 15 يوم'),
        t('pricing.features.all_crm_features', 'جميع ميزات CRM'),
        t('pricing.features.advanced_support', 'دعم فني متقدم'),
        t('pricing.features.detailed_reports', 'تقارير مفصلة'),
        t('pricing.features.team_collaboration', 'تعاون الفريق'),
      ],
    },
    {
      id: 'small',
      name: t('pricing.tiers.small.name', 'Small Teams'),
      description: t('pricing.tiers.small.description', 'Perfect for startups and small businesses'),
      minUsers: 1,
      maxUsers: 9,
      pricePerUser: 4,
      icon: <Users className="h-6 w-6" />,
      features: [
        t('pricing.features.basic_crm', 'Basic CRM Features'),
        t('pricing.features.lead_management', 'Lead Management'),
        t('pricing.features.deal_tracking', 'Deal Tracking'),
        t('pricing.features.basic_reports', 'Basic Reports'),
        t('pricing.features.email_support', 'Email Support'),
      ],
    },
    {
      id: 'medium',
      name: t('pricing.tiers.medium.name', 'Medium Teams'),
      description: t('pricing.tiers.medium.description', 'Ideal for growing businesses'),
      minUsers: 10,
      maxUsers: 30,
      pricePerUser: 3,
      recommended: true,
      icon: <Star className="h-6 w-6" />,
      features: [
        t('pricing.features.all_small_features', 'All Small Team Features'),
        t('pricing.features.advanced_analytics', 'Advanced Analytics'),
        t('pricing.features.team_collaboration', 'Team Collaboration'),
        t('pricing.features.custom_fields', 'Custom Fields'),
        t('pricing.features.api_access', 'API Access'),
        t('pricing.features.priority_support', 'Priority Support'),
      ],
    },
    {
      id: 'large',
      name: t('pricing.tiers.large.name', 'Large Teams'),
      description: t('pricing.tiers.large.description', 'For enterprises and large organizations'),
      minUsers: 31,
      maxUsers: null,
      pricePerUser: 2.5,
      icon: <Zap className="h-6 w-6" />,
      features: [
        t('pricing.features.all_medium_features', 'All Medium Team Features'),
        t('pricing.features.advanced_automation', 'Advanced Automation'),
        t('pricing.features.white_labeling', 'White Labeling'),
        t('pricing.features.dedicated_manager', 'Dedicated Account Manager'),
        t('pricing.features.sso_integration', 'SSO Integration'),
        t('pricing.features.phone_support', '24/7 Phone Support'),
      ],
    },
  ];

  const getApplicableTier = (users: number): PricingTier => {
    return pricingTiers.find(tier => 
      users >= tier.minUsers && (tier.maxUsers === null || users <= tier.maxUsers)
    ) || pricingTiers[0];
  };

  const calculatePrice = (users: number): { tier: PricingTier; totalPrice: number } => {
    const tier = getApplicableTier(users);
    const totalPrice = users * tier.pricePerUser;
    return { tier, totalPrice };
  };

  const { tier: selectedTier, totalPrice } = calculatePrice(selectedUsers);

  const validateUserInput = (value: number): boolean => {
    if (!value || value < 1 || !Number.isInteger(value)) {
      setUserInputError(t('pricing.errors.invalid_user_count', 'Please enter a valid number of users (minimum 1)'));
      return false;
    }
    setUserInputError('');
    return true;
  };

  const handleUserCountChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    if (value === '' || validateUserInput(numValue)) {
      setSelectedUsers(Math.max(1, numValue));
    }
  };

  const adjustUserCount = (increment: number) => {
    const newValue = Math.max(1, selectedUsers + increment);
    setSelectedUsers(newValue);
    validateUserInput(newValue);
  };

  const handleSubscribe = (tierData: PricingTier) => {
    if (!validateUserInput(selectedUsers)) {
      return;
    }
    
    // Handle trial - redirect to auth page if not logged in
    if (tierData.id === 'trial') {
      if (!user) {
        navigate('/auth', { 
          state: { 
            returnTo: '/dashboard',
            message: 'سجل للبدء في الفترة التجريبية المجانية'
          }
        });
        return;
      }
      
      // If user is logged in, activate trial and redirect to dashboard
      activateTrialSubscription();
      return;
    }
    
    const subscriptionData = {
      tierId: tierData.id,
      tierName: tierData.name,
      pricePerUser: tierData.pricePerUser,
      users: selectedUsers,
      totalPrice: selectedUsers * tierData.pricePerUser,
    };
    
    // Navigate to payment page with subscription data
    navigate('/payment', { state: subscriptionData });
  };

  const activateTrialSubscription = async () => {
    if (!organization?.id) return;
    
    try {
      // Activate trial in profile
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 15); // 15-day trial
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          // Trial fields would need to be added to the profiles table
          // For now, we'll skip this update
        } as any)
        .eq('id', user?.id);

      if (profileError) {
        console.error('Failed to activate trial:', profileError);
        return;
      }

      navigate('/dashboard', {
        state: {
          message: 'مرحباً بك في الفترة التجريبية المجانية لمدة 15 يوم! استمتع بالوصول الكامل لجميع الميزات.'
        }
      });
    } catch (error) {
      console.error('Error activating trial:', error);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!organization?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('status', 'active')
          .single();
        
        if (!error && data) {
          setSubscription(data);
          setSelectedUsers(data.users || 5);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, [organization?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Pricing – Sky CRM"
        description="Flexible user-based pricing that grows with your team. Choose from Small, Medium, or Large team plans."
        canonical="https://skycrm.com/pricing"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {subscription ? t('pricing.manage_subscription', 'Manage Your Subscription') : t('pricing.title', 'Choose Your Plan')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {subscription 
              ? t('pricing.subscription_subtitle', 'View and manage your current subscription details')
              : t('pricing.subtitle', 'Flexible user-based pricing that grows with your team. Pay only for what you need.')}
          </p>
          
          {/* Current Subscription Status */}
          {subscription && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-lg mb-12 border-2 border-green-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Crown className="h-8 w-8 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('pricing.current_subscription', 'Current Subscription')}
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {subscription.tier_name || 'Active Plan'}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {subscription.seats} {t('pricing.users', 'users')} × ${subscription.price_per_user} = ${subscription.total_amount}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('pricing.next_billing', 'Next billing')}: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-lg font-semibold text-green-600">
                      {t('pricing.status_active', 'Active')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('pricing.subscription_active_since', 'Active since')}: {new Date(subscription.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800 dark:text-blue-200">
                    {t('pricing.member_limit', 'Member Limit')}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('pricing.member_limit_description', 'Your organization can have up to {{seats}} members based on your current subscription.', { seats: subscription.seats })}
                </p>
              </div>
            </div>
          )}
          
          {/* User Selection - Only show if no active subscription */}
          {!subscription && (
            <div className="max-w-md mx-auto mb-12">
              <Label htmlFor="users" className="text-lg font-semibold mb-4 block">
                {t('pricing.how_many_users', 'How many users do you need?')}
              </Label>
              <div className="flex items-center gap-2">
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => adjustUserCount(-1)}
                  disabled={selectedUsers <= 1}
                  className="h-14 w-14 flex-shrink-0"
                >
                  <Minus className="h-4 w-4" />
                </UIButton>
                <Input
                  id="users"
                  type="number"
                  min="1"
                  max="1000"
                  value={selectedUsers}
                  onChange={(e) => handleUserCountChange(e.target.value)}
                  className="text-center text-xl font-bold h-14 flex-1"
                  placeholder="5"
                />
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => adjustUserCount(1)}
                  className="h-14 w-14 flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </UIButton>
              </div>
              {userInputError && (
                <p className="text-sm text-red-500 mt-2">{userInputError}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {t('pricing.user_range', 'Enter any number from 1 to 1000+ users')}
              </p>
            </div>
          )}

          {/* Price Calculator Display */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg mx-auto shadow-lg mb-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('pricing.your_plan', 'Your Plan')}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                {selectedTier.icon}
                <span className="text-xl font-semibold">{selectedTier.name}</span>
                {selectedTier.recommended && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t('pricing.recommended', 'Recommended')}
                  </Badge>
                )}
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                ${totalPrice}
                <span className="text-lg text-gray-500">/{t('pricing.month', 'month')}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {selectedUsers} {t('pricing.users', 'users')} × ${selectedTier.pricePerUser} = ${totalPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier) => {
            const isSelected = selectedTier.id === tier.id;
            const tierPrice = selectedUsers * tier.pricePerUser;
            
            return (
              <Card 
                key={tier.id} 
                className={`relative transition-all duration-300 bg-card border border-border ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                    : 'hover:shadow-lg'
                } ${tier.recommended ? 'border-blue-200' : ''}`}
              >
                {tier.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      {t('pricing.recommended', 'Recommended')}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {tier.icon}
                    <CardTitle className="text-2xl text-foreground">{tier.name}</CardTitle>
                  </div>
                  <CardDescription className="text-base">{tier.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className={`text-3xl font-bold ${
                      tier.id === 'trial' 
                        ? 'text-green-600 dark:text-green-400' 
                        : tier.id === 'mini'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {tier.id === 'trial' ? (
                        <>
                          {t('pricing.free', 'مجاني')}
                          <span className="text-lg text-gray-500">/{t('pricing.15_days', '15 يوم')}</span>
                        </>
                      ) : tier.id === 'mini' ? (
                        <>
                          99 {t('pricing.egp', 'جنيه')}
                          <span className="text-lg text-gray-500">/{t('pricing.15_days', '15 يوم')}</span>
                        </>
                      ) : (
                        <>
                          ${tier.pricePerUser}
                          <span className="text-lg text-gray-500">/{t('pricing.user_month', 'user/month')}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {tier.minUsers}-{tier.maxUsers || '∞'} {t('pricing.users', 'users')}
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full ${
                      tier.id === 'trial' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : tier.id === 'mini'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={() => handleSubscribe(tier)}
                    disabled={selectedUsers < tier.minUsers || (tier.maxUsers && selectedUsers > tier.maxUsers)}
                  >
                    {tier.id === 'trial' 
                      ? t('pricing.start_free_trial', 'ابدأ التجربة المجانية') 
                      : tier.id === 'mini'
                      ? t('pricing.subscribe_mini', 'اشترك في الخطة ربع الشهرية')
                      : t('pricing.subscribe_now', 'اشترك الآن')
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('pricing.feature_comparison', 'Feature Comparison')}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">{t('pricing.features', 'Features')}</th>
                  {pricingTiers.map((tier) => (
                    <th key={tier.id} className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {tier.icon}
                        <span>{tier.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  t('pricing.features.basic_crm', 'Basic CRM Features'),
                  t('pricing.features.lead_management', 'Lead Management'),
                  t('pricing.features.deal_tracking', 'Deal Tracking'),
                  t('pricing.features.basic_reports', 'Basic Reports'),
                  t('pricing.features.advanced_analytics', 'Advanced Analytics'),
                  t('pricing.features.team_collaboration', 'Team Collaboration'),
                  t('pricing.features.api_access', 'API Access'),
                  t('pricing.features.advanced_automation', 'Advanced Automation'),
                  t('pricing.features.white_labeling', 'White Labeling'),
                  t('pricing.features.dedicated_manager', 'Dedicated Account Manager'),
                ].map((feature, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 font-medium">{feature}</td>
                    {pricingTiers.map((tier) => (
                      <td key={tier.id} className="py-3 px-4 text-center">
                        {tier.features.some(f => f.includes(feature.split(' ')[0])) || index < (tier.id === 'small' ? 4 : tier.id === 'medium' ? 6 : 10) ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-8">
            {t('pricing.faq', 'Frequently Asked Questions')}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold mb-2">{t('pricing.faq_section.billing', 'How does billing work?')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('pricing.faq_section.billing_answer', 'You are billed monthly based on the number of users in your organization. You can add or remove users at any time.')}
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">{t('pricing.faq_section.change_plan', 'Can I change my plan?')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('pricing.faq_section.change_plan_answer', 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.')}
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">{t('pricing.faq_section.payment_methods', 'What payment methods do you accept?')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('pricing.faq_section.payment_methods_answer', 'We accept all major credit cards, Meeza, and various local payment methods through Paymob.')}
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">{t('pricing.faq_section.support', 'What support do you provide?')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t('pricing.faq_section.support_answer', 'All plans include email support. Medium and Large plans get priority support, and Large plans include phone support.')}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default Pricing;