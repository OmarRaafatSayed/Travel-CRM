import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowRight, Gift } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import loginIllustration from "@/assets/login-illustration.jpg";
import { AuthCleaner } from "@/components/AuthCleaner";

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    loginPhone: "",
    acceptedPolicy: false
  });
  const { toast } = useToast();
  
  // Get message from location state (for free trial)
  const stateMessage = location.state?.message;

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onAuthSuccess();
      }
    };
    checkAuth();
  }, [onAuthSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Send WhatsApp welcome message via Evolution API (proxied through Vite to avoid CORS)
  const sendWhatsAppWelcome = async (phone: string, name: string) => {
    try {
      // Normalize phone: remove leading 0 and add 20 (Egypt country code)
      let normalized = phone.replace(/\s+/g, "").replace(/[^0-9]/g, "");
      if (normalized.startsWith("0")) normalized = "2" + normalized; // 01x -> 201x
      if (!normalized.startsWith("20")) normalized = "20" + normalized;

      const message = `مرحباً ${name}! 👋\nتم تسجيل دخولك بنجاح إلى المنصة.\nنتمنى لك تجربة رائعة! 🚀`;

      await fetch("/evo-api/message/sendText/booking-bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "evo-super-secret-api-key-2024",
        },
        body: JSON.stringify({ number: normalized, text: message }),
      });
    } catch (err) {
      // WhatsApp is non-critical — silently ignore errors
      console.warn("WhatsApp notification skipped:", err);
    }
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });

        // Fetch profile to get phone & name then send WhatsApp
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone, first_name")
            .eq("user_id", data.user.id)
            .single();

          // Use phone from profile, or fallback to loginPhone field if user typed it
          const phone = profile?.phone || formData.loginPhone;
          const name = profile?.first_name || formData.email;

          if (phone) {
            // Also save phone to profile if it wasn't there
            if (!profile?.phone && formData.loginPhone) {
              supabase.from("profiles").update({ phone: formData.loginPhone }).eq("user_id", data.user.id);
            }
            sendWhatsAppWelcome(phone, name);
          }
        }

        onAuthSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithLinkedIn = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred with LinkedIn login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptedPolicy) {
      toast({
        title: "Error",
        description: t('auth.must_accept_policy'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            accepted_policy: formData.acceptedPolicy,
            phone: formData.phone,
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Save phone to profile if user was created
        if (data.user && formData.phone) {
          await supabase
            .from("profiles")
            .update({ phone: formData.phone })
            .eq("user_id", data.user.id);
        }

        toast({
          title: "Success",
          description: "Account created successfully! Please check your email for verification.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded transform rotate-45"></div>
            <div className="w-6 h-6 bg-primary/80 rounded transform rotate-45 -ml-3"></div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t('auth.welcome_back')}
              </h1>
              <p className="text-muted-foreground">
                {t('auth.please_enter_details')}
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-4">
                  {/* LinkedIn Login Button */}
                  <Button
                    onClick={handleSignInWithLinkedIn}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-11 border-border hover:bg-accent"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {isLoading ? "Connecting..." : t('auth.continue_with_linkedin')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('or')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">{t('auth.email_address')}</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginPhone">Phone Number (WhatsApp)</Label>
                    <Input
                      id="loginPhone"
                      name="loginPhone"
                      type="tel"
                      placeholder="e.g. 01012345678"
                      value={formData.loginPhone}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm">
                        {t('auth.remember_me')}
                      </Label>
                    </div>
                    <Button variant="link" className="px-0 font-normal text-sm">
                      {t('auth.forgot_password')}
                    </Button>
                  </div>

                  <Button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "Signing in..." : (
                      <>
                        {t('auth.login')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {t('auth.by_creating_account')}{' '}
                  <a 
                    href="/terms-of-service" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t('auth.terms_of_service')}
                  </a>{' '}
                  {t('auth.and')}{' '}
                  <a 
                    href="/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t('auth.privacy_policy')}
                  </a>
                </div>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">{t('auth.already_have_account')} </span>
                    <Button variant="link" className="px-1 h-auto font-semibold text-primary hover:text-primary/80">
                      {t('auth.signin')}
                    </Button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <AuthCleaner />
                  </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                {/* Free Trial Banner */}
                {stateMessage && (
                  <Alert className="border-green-200 bg-green-50">
                    <Gift className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {stateMessage}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">فترة تجريبية مجانية 15 يوم</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    استمتع بجميع الميزات مجاناً لمدة 15 يوم عند التسجيل
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* LinkedIn Signup Button */}
                  <Button
                    onClick={handleSignInWithLinkedIn}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-11 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {isLoading ? "Connecting..." : "Sign up with LinkedIn"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('or')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('emailAddress')}</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. 01012345678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('password')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptPolicy"
                      checked={formData.acceptedPolicy}
                      onCheckedChange={(checked) => setFormData({...formData, acceptedPolicy: checked as boolean})}
                      className="mt-1"
                    />
                    <Label htmlFor="acceptPolicy" className="text-sm leading-relaxed">
                      I have read and agree to the{' '}
                      <a 
                        href="/terms-of-service" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a 
                        href="/privacy-policy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </Label>
                  </div>

                  <Button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "Creating account..." : (
                      <>
                        {t('auth.signup')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 relative bg-gradient-to-br from-muted to-background">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/90 to-background/90"></div>
        
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-foreground">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/10 rounded-full blur-lg"></div>
          <div className="max-w-md text-center space-y-6">
            <img 
              src={loginIllustration} 
              alt="3D illustration of person working"
              className="w-full h-80 object-contain mx-auto rounded-2xl bg-white/10 p-8"
            />
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground">
                {t('auth.seamless_work')}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t('auth.everything_you_need')}
              </p>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center space-x-2 pt-4">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-8 h-2 bg-white/60 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}