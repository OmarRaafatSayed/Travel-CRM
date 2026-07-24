import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, MessageSquare, Building2, Star, CheckCircle, Zap, Shield, Globe, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LazyImage } from "@/components/LazyImage";
import { usePerformance } from "@/hooks/usePerformance";
import { Hero } from "@/components/ui/animated-hero";
import heroImage from "@/assets/hero-crm.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  // Initialize performance optimizations
  usePerformance();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className={`flex items-center gap-3`}>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{t('app.name')}</h1>
                <p className="text-xs text-slate-500">{t('app.tagline')}</p>
              </div>
            </div>
            <div className={`flex items-center gap-4`}>
              <Button 
                variant="ghost" 
                onClick={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')}
                className="text-slate-600 hover:text-slate-900"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isRTL ? 'English' : 'العربية'}
              </Button>
              <Button 
                onClick={() => navigate('/pricing')} 
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                {t('landing.nav.pricing')}
              </Button>
              <Button 
                onClick={() => navigate('/auth')} 
                className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {t('landing.nav.login')}
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero language={isRTL ? 'ar' : 'en'} />

      {/* Stats Section */}
      <section className="py-20 overflow-hidden">
        <div className="relative">
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0">
                {[
                  { number: '10K+', label: t('landing.stats.users') },
                  { number: '99.9%', label: t('landing.stats.uptime') },
                  { number: '50+', label: t('landing.stats.countries') },
                  { number: '24/7', label: t('landing.stats.support') }
                ].map((stat, index) => (
                  <div key={`${setIndex}-${index}`} className="inline-flex flex-col items-center justify-center px-20 shrink-0">
                    <div className="text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                    <div className="text-slate-600 whitespace-nowrap">{stat.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <LazyImage 
                src={heroImage} 
                alt={t('landing.dashboardPreview')} 
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {t('landing.featuresDescription')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              { 
                icon: Users, 
                title: t('landing.features.teamManagement'), 
                desc: t('landing.features.teamManagementDesc')
              },
              { 
                icon: TrendingUp, 
                title: t('landing.features.salesAnalytics'), 
                desc: t('landing.features.salesAnalyticsDesc')
              },
              { 
                icon: MessageSquare, 
                title: t('landing.features.teamChat'), 
                desc: t('landing.features.teamChatDesc')
              },
              { 
                icon: Building2, 
                title: t('landing.features.accountManagement'), 
                desc: t('landing.features.accountManagementDesc')
              },
              { 
                icon: Zap, 
                title: t('landing.features.automation'), 
                desc: t('landing.features.automationDesc')
              },
              { 
                icon: Shield, 
                title: t('landing.features.security'), 
                desc: t('landing.features.securityDesc')
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                {/* Icon */}
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <feature.icon className="w-12 h-12 text-black stroke-[1.5]" />
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-slate-600 leading-relaxed text-base">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('landing.finalCTA.title')}</h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">{t('landing.finalCTA.subtitle')}</p>
            
            {/* Urgency Element */}
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Zap className="w-4 h-4" />
              {t('landing.finalCTA.urgency')}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => navigate('/auth')} 
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-bold px-10 py-5 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <CheckCircle className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('landing.finalCTA.button')}
              </Button>
            </div>
            
            {/* Risk Reversal */}
            <div className="mt-6 flex justify-center items-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>{t('landing.finalCTA.guarantee')}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{t('landing.finalCTA.support')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold">{t('app.name')}</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                {t('app.tagline')} - Transform your business with our all-in-one CRM platform.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><a href="mailto:support@skycrm.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-slate-400 text-sm mb-4 md:mb-0">
                © 2025 {t('app.name')}. {t('landing.footer.rights')}
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Made with ❤️ in Egypt</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
