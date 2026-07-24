import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall, Building2, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface HeroProps {
  language?: 'ar' | 'en';
}

function Hero({ language = 'ar' }: HeroProps) {
  const { t, i18n } = useTranslation();
  const [titleNumber, setTitleNumber] = useState(0);
  
  const titles = useMemo(() => {
    if (language === 'ar') {
      return ["ذكي", "متطور", "سهل", "فعال", "احترافي"];
    }
    return ["smart", "advanced", "easy", "effective", "professional"];
  }, [language]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const content = {
    ar: {
      badge: t('hero.badge'),
      mainTitle: t('hero.mainTitle'),
      description: t('hero.description'),
      callButton: t('hero.callButton'),
      signupButton: t('hero.signupButton'),
      organizationsFeature: t('hero.organizationsFeature'),
      teamManagementFeature: t('hero.teamManagementFeature'),
      analyticsFeature: t('hero.analyticsFeature')
    },
    en: {
      badge: t('hero.badge'),
      mainTitle: t('hero.mainTitle'),
      description: t('hero.description'),
      callButton: t('hero.callButton'),
      signupButton: t('hero.signupButton'),
      organizationsFeature: t('hero.organizationsFeature'),
      teamManagementFeature: t('hero.teamManagementFeature'),
      analyticsFeature: t('hero.analyticsFeature')
    }
  };

  const currentContent = content[language];

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col mb-[-160px]">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              {currentContent.badge} <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-4 flex-col">
            <h1 className={`text-5xl md:text-7xl max-w-4xl tracking-tighter font-regular ${language === 'ar' ? 'font-arabic' : ''}`} style={{ textAlign: 'center' }}>
              <span className="text-primary">
                {currentContent.mainTitle}
              </span>
              <span className="relative flex w-full items-center justify-center overflow-hidden pb-6 pt-2 md:pb-6 md:pt-1" style={{ textAlign: 'center' }}>
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold text-primary"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className={`text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-3xl mx-auto ${language === 'ar' ? 'font-arabic' : ''}`} style={{ textAlign: 'center' }}>
              {currentContent.description}
            </p>
          </div>

          {/* Features Icons */}
          <div className="flex flex-row gap-8 items-center justify-center mb-4">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">
                {currentContent.organizationsFeature}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">
                {currentContent.teamManagementFeature}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">
                {currentContent.analyticsFeature}
              </span>
            </div>
          </div>
          
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline">
              {currentContent.callButton} <PhoneCall className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4">
              {currentContent.signupButton} <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };