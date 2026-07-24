import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, Eye, MousePointer } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  bounceRate: number;
  conversionRate: number;
  pageViews: number;
}

export const PerformanceAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectMetrics = async () => {
      try {
        // Collect real performance metrics
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

        // Simulate analytics data (in production, fetch from analytics service)
        const analyticsData = {
          loadTime: Math.round(loadTime),
          firstContentfulPaint: Math.round(fcp),
          largestContentfulPaint: Math.round(fcp * 1.2), // Simulated
          cumulativeLayoutShift: 0.1, // Simulated
          firstInputDelay: 50, // Simulated
          bounceRate: 25.4, // Simulated
          conversionRate: 3.2, // Simulated
          pageViews: 1247 // Simulated
        };

        setMetrics(analyticsData);
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, []);

  const getScoreColor = (score: number, thresholds: { good: number; needs: number }) => {
    if (score <= thresholds.good) return 'text-green-600 bg-green-100';
    if (score <= thresholds.needs) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number, thresholds: { good: number; needs: number }) => {
    if (score <= thresholds.good) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            تحليل الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            مقاييس الأداء الأساسية (Core Web Vitals)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Loading Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">وقت التحميل</span>
                <Badge className={getScoreColor(metrics.loadTime, { good: 2500, needs: 4000 })}>
                  {getScoreIcon(metrics.loadTime, { good: 2500, needs: 4000 })}
                  {metrics.loadTime}ms
                </Badge>
              </div>
              <div className="text-xs text-gray-500">الهدف: أقل من 2.5 ثانية</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">أول محتوى مرئي (FCP)</span>
                <Badge className={getScoreColor(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}>
                  {getScoreIcon(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}
                  {metrics.firstContentfulPaint}ms
                </Badge>
              </div>
              <div className="text-xs text-gray-500">الهدف: أقل من 1.8 ثانية</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">أكبر محتوى مرئي (LCP)</span>
                <Badge className={getScoreColor(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}>
                  {getScoreIcon(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}
                  {metrics.largestContentfulPaint}ms
                </Badge>
              </div>
              <div className="text-xs text-gray-500">الهدف: أقل من 2.5 ثانية</div>
            </div>
          </div>

          {/* Interactivity & Stability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">تأخير الإدخال الأول (FID)</span>
                <Badge className={getScoreColor(metrics.firstInputDelay, { good: 100, needs: 300 })}>
                  {getScoreIcon(metrics.firstInputDelay, { good: 100, needs: 300 })}
                  {metrics.firstInputDelay}ms
                </Badge>
              </div>
              <div className="text-xs text-gray-500">الهدف: أقل من 100ms</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">تحول التخطيط التراكمي (CLS)</span>
                <Badge className={getScoreColor(metrics.cumulativeLayoutShift * 1000, { good: 100, needs: 250 })}>
                  {getScoreIcon(metrics.cumulativeLayoutShift * 1000, { good: 100, needs: 250 })}
                  {metrics.cumulativeLayoutShift.toFixed(3)}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">الهدف: أقل من 0.1</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            مقاييس التحويل والمشاركة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <MousePointer className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.conversionRate}%</div>
              <div className="text-sm text-gray-500">معدل التحويل</div>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.bounceRate}%</div>
              <div className="text-sm text-gray-500">معدل الارتداد</div>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{metrics.pageViews.toLocaleString()}</div>
              <div className="text-sm text-gray-500">مشاهدات الصفحة</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            توصيات التحسين
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.loadTime > 3000 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800">تحسين سرعة التحميل</div>
                <div className="text-sm text-yellow-700">ضغط الصور وتحسين ملفات CSS/JS</div>
              </div>
            )}
            
            {metrics.firstContentfulPaint > 2000 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800">تحسين أول محتوى مرئي</div>
                <div className="text-sm text-blue-700">استخدام تقنيات التحميل المسبق للموارد الحرجة</div>
              </div>
            )}
            
            {metrics.bounceRate > 40 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800">تحسين معدل الارتداد</div>
                <div className="text-sm text-red-700">تحسين المحتوى ونقاط الحث على الإجراء</div>
              </div>
            )}
            
            {metrics.conversionRate < 2 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="font-medium text-purple-800">تحسين معدل التحويل</div>
                <div className="text-sm text-purple-700">تحسين تجربة المستخدم وعملية التسجيل</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};