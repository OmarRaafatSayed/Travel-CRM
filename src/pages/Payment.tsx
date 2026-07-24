import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Wallet,
  Star,
  Clock,
  Users,
  Gift,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { subscriptionService } from '@/lib/subscription';
import { paymobClient } from '@/lib/paymob-client';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

interface SubscriptionData {
  tierId: string;
  tierName: string;
  pricePerUser: number;
  users: number;
  totalPrice: number;
}

const Payment: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subscriptionData = location.state as SubscriptionData;

  useEffect(() => {
    if (!subscriptionData) {
      navigate('/pricing');
    }

    // Handle Paymob payment callback
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const txnResponseCode = urlParams.get('txn_response_code');
    
    if (success === 'true' && txnResponseCode === 'APPROVED') {
      const storedData = localStorage.getItem('paymob-subscription-data');
      if (storedData) {
        localStorage.removeItem('paymob-subscription-data');
        toast.success('تم الدفع بنجاح! 🎉');
        navigate('/payment-success');
      }
    } else if (success === 'false') {
      toast.error('فشل في عملية الدفع. يرجى المحاولة مرة أخرى.');
      localStorage.removeItem('paymob-subscription-data');
    }
  }, [subscriptionData, navigate, t]);

  if (!subscriptionData) {
    return null;
  }

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'بطاقة ائتمان/خصم',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Visa, MasterCard, American Express',
      badge: 'الأكثر شيوعاً'
    },
    {
      id: 'meeza',
      name: 'ميزة',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'نظام الدفع الإلكتروني المصري',
      badge: 'محلي'
    },
    {
      id: 'wallet',
      name: 'المحفظة الرقمية',
      icon: <Wallet className="h-6 w-6" />,
      description: 'فوري، فودافون كاش، أورانج موني',
      badge: 'سريع'
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.phone) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    }

    if (selectedPaymentMethod === 'card') {
      if (!formData.cardNumber) {
        newErrors.cardNumber = 'رقم البطاقة مطلوب';
      } else if (formData.cardNumber.replace(/\s/g, '').length < 16) {
        newErrors.cardNumber = 'رقم البطاقة غير صحيح';
      }

      if (!formData.expiryDate) {
        newErrors.expiryDate = 'تاريخ الانتهاء مطلوب';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'تاريخ الانتهاء غير صحيح (MM/YY)';
      }

      if (!formData.cvv) {
        newErrors.cvv = 'CVV مطلوب';
      } else if (formData.cvv.length < 3) {
        newErrors.cvv = 'CVV غير صحيح';
      }

      if (!formData.cardholderName) {
        newErrors.cardholderName = 'اسم حامل البطاقة مطلوب';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };



  const processPaymobPayment = async (): Promise<{ success: boolean; iframeUrl?: string; error?: string }> => {
    try {
      if (!organization) {
        throw new Error('Organization is required for payment');
      }

      const result = await paymobClient.createSubscriptionPayment(
        subscriptionData.tierId,
        subscriptionData.users,
        {
          name: formData.cardholderName || user?.email?.split('@')[0] || 'Customer',
          email: formData.email,
          phone: formData.phone,
        }
      );

      if (result.success && result.iframeUrl) {
        // Store subscription data for after payment
        localStorage.setItem('paymob-subscription-data', JSON.stringify({
          subscriptionData,
          customerInfo: {
            email: formData.email,
            phone: formData.phone,
          }
        }));
        
        return {
          success: true,
          iframeUrl: result.iframeUrl,
        };
      } else {
        return {
          success: false,
          error: result.error || 'فشل في تهيئة عملية الدفع',
        };
      }
    } catch (error: any) {
      console.error('Paymob payment error:', error);
      return {
        success: false,
        error: error.message || 'فشل في عملية الدفع. يرجى المحاولة مرة أخرى.',
      };
    }
  };

  const processPayment = async (): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
    try {
      if (['card', 'meeza', 'wallet'].includes(selectedPaymentMethod)) {
        const result = await processPaymobPayment();
        if (result.success && result.iframeUrl) {
          // Open payment iframe in a modal or redirect
          window.open(result.iframeUrl, '_blank', 'width=600,height=800');
          return { success: true };
        } else {
          return {
            success: false,
            error: result.error || 'فشل في عملية الدفع. يرجى المحاولة مرة أخرى.',
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.',
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await processPayment();
      
      if (result.success && organization) {
        // Create subscription record
        try {
          await subscriptionService.createSubscription(
            organization.id,
            subscriptionData.tierId,
            subscriptionData.users,
            {
              transactionId: result.transactionId!,
              paymentMethod: selectedPaymentMethod,
              customerEmail: formData.email,
              customerPhone: formData.phone,
            }
          );
          
          toast.success('تم الدفع بنجاح! 🎉');
          
          // Navigate to success page with payment details
          navigate('/payment-success', {
            state: {
              subscription: subscriptionData,
              payment: {
                transactionId: result.transactionId,
                method: selectedPaymentMethod,
                email: formData.email,
                phone: formData.phone,
                date: new Date().toISOString(),
              },
            },
          });
        } catch (subscriptionError) {
          console.error('Failed to create subscription:', subscriptionError);
          toast.error('تم الدفع بنجاح ولكن فشل في إنشاء الاشتراك. يرجى التواصل مع الدعم.');
        }
      } else {
        toast.error(result.error || 'فشل في عملية الدفع');
      }
    } catch (error) {
      toast.error('خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للخطط
          </Button>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الخطة</span>
                  <Badge variant="secondary">{subscriptionData.tierName}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>عدد المستخدمين</span>
                  <span>{subscriptionData.users}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>السعر لكل مستخدم</span>
                  <span>${subscriptionData.pricePerUser}/شهر</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>المجموع</span>
                  <span>${subscriptionData.totalPrice}/شهر</span>
                </div>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    سيتم إصدار فاتورة شهرية. يمكنك الإلغاء في أي وقت.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  دفع آمن ومضمون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>تشفير SSL متقدم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>متوافق مع معايير PCI DSS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>مدعوم بواسطة Paymob</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل الدفع</CardTitle>
                <CardDescription>
                  أكمل عملية الدفع الآمنة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">معلومات الاتصال</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="john@example.com"
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">رقم الهاتف *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+20 10 1234 5678"
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">طريقة الدفع</h3>
                    
                    <div className="grid gap-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={() => setSelectedPaymentMethod(method.id)}
                              className="text-primary"
                            />
                            {method.icon}
                            <div className="flex-1">
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-muted-foreground">{method.description}</div>
                            </div>
                            {method.badge && (
                              <Badge variant="secondary">{method.badge}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Details */}
                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">تفاصيل البطاقة</h3>
                      
                      <div>
                        <Label htmlFor="cardholderName">اسم حامل البطاقة *</Label>
                        <Input
                          id="cardholderName"
                          value={formData.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                          placeholder="John Doe"
                          className={errors.cardholderName ? 'border-red-500' : ''}
                        />
                        {errors.cardholderName && (
                          <p className="text-sm text-red-500 mt-1">{errors.cardholderName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="cardNumber">رقم البطاقة *</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className={errors.cardNumber ? 'border-red-500' : ''}
                        />
                        {errors.cardNumber && (
                          <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
                          <Input
                            id="expiryDate"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className={errors.expiryDate ? 'border-red-500' : ''}
                          />
                          {errors.expiryDate && (
                            <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="cvv">CVV *</Label>
                          <Input
                            id="cvv"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            placeholder="123"
                            maxLength={4}
                            className={errors.cvv ? 'border-red-500' : ''}
                          />
                          {errors.cvv && (
                            <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment method info */}
                  {selectedPaymentMethod !== 'card' && (
                    <div className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          {selectedPaymentMethod === 'meeza' 
                            ? 'سيتم توجيهك إلى ميزة لإكمال عملية الدفع بأمان. ميزة هي نظام الدفع الإلكتروني المصري الآمن.'
                            : 'سيتم توجيهك إلى مزود المحفظة المحدد لإكمال الدفع. جميع المحافظ الرقمية المصرية مدعومة.'}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2">طرق الدفع المحلية المتاحة:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                          {selectedPaymentMethod === 'meeza' ? (
                            <>
                              <div>• ميزة - البطاقة المصرية</div>
                              <div>• جميع البنوك المصرية</div>
                              <div>• دفع آمن ومضمون</div>
                              <div>• بدون رسوم إضافية</div>
                            </>
                          ) : (
                            <>
                              <div>• فوري</div>
                              <div>• فودافون كاش</div>
                              <div>• أورانج موني</div>
                              <div>• إتصالات كاش</div>
                              <div>• أمان</div>
                              <div>• مصاري</div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          نعمل على إضافة المزيد من طرق الدفع الدولية قريباً.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري المعالجة...
                      </div>
                    ) : (
                      `تأكيد الدفع - $${subscriptionData.totalPrice}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;