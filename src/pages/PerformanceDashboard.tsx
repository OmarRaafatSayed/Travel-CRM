import React from 'react';
import { PerformanceAnalytics } from '@/components/PerformanceAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';

const PerformanceDashboard: React.FC = () => {
  const handleExportReport = () => {
    // Generate and download performance report
    const reportData = {
      timestamp: new Date().toISOString(),
      metrics: 'Performance metrics data would be here',
      recommendations: 'Performance recommendations'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshMetrics = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم الأداء</h1>
            <p className="text-gray-600 mt-2">مراقبة وتحليل أداء الصفحة الرئيسية ومعدلات التحويل</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefreshMetrics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث البيانات
            </Button>
            <Button onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">متوسط وقت التحميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">2.1s</div>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                تحسن 15% من الشهر الماضي
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">معدل التحويل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">3.2%</div>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                زيادة 8% من الشهر الماضي
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">معدل الارتداد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">25.4%</div>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                انخفاض 12% من الشهر الماضي
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">نقاط الأداء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">92/100</div>
              <div className="text-xs text-gray-500">ممتاز</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <PerformanceAnalytics />

        {/* A/B Testing Results */}
        <Card>
          <CardHeader>
            <CardTitle>نتائج اختبار A/B للصفحة الرئيسية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">النسخة الأصلية (A)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>معدل التحويل:</span>
                    <span className="font-medium">2.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>معدل الارتداد:</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وقت البقاء:</span>
                    <span className="font-medium">2:15</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <h3 className="font-semibold mb-2 text-green-800">النسخة المحسنة (B) ✓</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>معدل التحويل:</span>
                    <span className="font-medium text-green-600">3.2% (+14%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>معدل الارتداد:</span>
                    <span className="font-medium text-green-600">25% (-22%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>وقت البقاء:</span>
                    <span className="font-medium text-green-600">2:45 (+22%)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-800">التحسينات المطبقة:</div>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• تحسين نقاط الحث على الإجراء (CTAs) بألوان أكثر وضوحاً</li>
                <li>• إضافة مؤشرات الثقة والضمانات</li>
                <li>• تحسين سرعة التحميل بنسبة 25%</li>
                <li>• إضافة عناصر الإلحاح والعروض المحدودة</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;