import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Sparkles, Target, Users, BarChart3, X } from 'lucide-react';

interface WelcomeOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

const onboardingSteps = [
  {
    title: 'مرحباً بك في نظام إدارة العلاقات! 🎉',
    description: 'نحن سعداء لانضمامك إلينا. دعنا نأخذك في جولة سريعة لاستكشاف النظام',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    title: 'إدارة العملاء المحتملين 🎯',
    description: 'تتبع وإدارة جميع العملاء المحتملين من مكان واحد. حول الفرص إلى صفقات ناجحة',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'فريق العمل والتعاون 👥',
    description: 'تعاون مع فريقك، وزع المهام، وتابع الأداء لتحقيق أفضل النتائج',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    title: 'تقارير وإحصائيات شاملة 📊',
    description: 'احصل على رؤى عميقة حول أداء مبيعاتك مع تقارير تفصيلية ولوحات تحكم ذكية',
    icon: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  }
];

export function WelcomeOnboarding({ isOpen, onComplete }: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <Card className="relative animate-in fade-in-0 zoom-in-95 duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipOnboarding}
            className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-8 text-center">
            <div className={`mx-auto w-20 h-20 rounded-full ${currentStepData.bgColor} flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500 delay-150`}>
              <Icon className={`w-10 h-10 ${currentStepData.color} animate-in fade-in-0 duration-300 delay-300`} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-900 animate-in slide-in-from-bottom-4 duration-500 delay-200">
              {currentStepData.title}
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-300">
              {currentStepData.description}
            </p>
            
            {/* Progress indicators */}
            <div className="flex justify-center space-x-2 mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-400">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-primary scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center animate-in slide-in-from-bottom-4 duration-500 delay-500">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 transition-all hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4" />
                السابق
              </Button>
              
              <Button
                onClick={nextStep}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all hover:scale-105 shadow-lg"
              >
                {currentStep === onboardingSteps.length - 1 ? 'يلا بينا نبدأ! 🚀' : 'التالي'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Skip option */}
            <div className="mt-4">
              <Button
                variant="link"
                onClick={skipOnboarding}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                تخطي الجولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}