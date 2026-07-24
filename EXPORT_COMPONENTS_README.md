# مكونات تصدير التقارير - Export Components

تم إنشاء مجموعة شاملة من مكونات تصدير التقارير لنظام CRM. هذه المكونات تدعم تصدير البيانات إلى PDF و Excel و CSV بشكل احترافي ومنظم.

## المكونات المتاحة

### 1. ExportButton - زر التصدير العام
مكون عام يمكن استخدامه في أي مكان لتصدير البيانات أو عناصر HTML.

```tsx
import { ExportButton } from '@/components/ExportButton';

<ExportButton
  data={[
    ['المؤشر', 'القيمة', 'التغيير'],
    ['إجمالي الإيرادات', '$50,000', '+12%'],
    ['العملاء الجدد', '25', '+5']
  ]}
  headers={['المؤشر', 'القيمة', 'التغيير']}
  filename="تقرير-الداشبورد"
  title="تقرير الداشبورد الشامل"
  elementId="dashboard-content" // اختياري - لتصدير عنصر HTML محدد
  organizationName="اسم الشركة"
/>
```

### 2. DataTableExporter - مصدر بيانات الجداول
مكون متخصص لتصدير البيانات من الجداول مع دعم المرشحات.

```tsx
import { DataTableExporter } from '@/components/DataTableExporter';

<DataTableExporter
  data={leads} // مصفوفة البيانات
  columns={[
    { key: 'first_name', label: 'الاسم الأول' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'company', label: 'الشركة' }
  ]}
  filename="العملاء-المحتملون"
  title="تقرير العملاء المحتملين"
  organizationName="نظام إدارة العلاقات"
  includeFilters={true}
  filters={{
    'البحث': searchTerm,
    'الحالة': statusFilter
  }}
/>
```

### 3. ReportExporter - مصدر التقارير الشاملة
مكون متخصص للتقارير الشاملة مع الرسوم البيانية.

```tsx
import { ReportExporter } from '@/components/ReportExporter';

<ReportExporter
  reportData={reportData}
  salesData={salesData}
  performanceData={performanceData}
  revenueData={revenueData}
  industryData={industryData}
  timelineData={timelineData}
  timeframe="30"
  organizationName="اسم الشركة"
/>
```

### 4. UserReportExporter - مصدر تقارير المستخدمين
مكون متخصص لتقارير أداء المستخدمين.

```tsx
import { UserReportExporter } from '@/components/UserReportExporter';

<UserReportExporter
  metrics={userMetrics}
  performanceData={performanceData}
  activityData={activityData}
  timelineData={timelineData}
  timeframe="thisMonth"
  userName="أحمد محمد"
/>
```

## الميزات الرئيسية

### 1. تصدير PDF
- تصدير عناصر HTML كاملة مع التنسيق
- إضافة هيدر احترافي مع معلومات الشركة
- دعم الصفحات المتعددة
- تنسيق الجداول بشكل احترافي

### 2. تصدير Excel
- إنشاء ملفات Excel متعددة الأوراق
- ورقة البيانات الرئيسية
- ورقة معلومات التقرير
- تنسيق الأعمدة تلقائياً
- دعم البيانات العربية

### 3. تصدير CSV
- تصدير البيانات بتنسيق CSV
- دعم الترميز العربي (UTF-8 BOM)
- معالجة الفواصل والاقتباسات

## كيفية الاستخدام في المكونات الموجودة

### الداشبورد
تم تحديث مكون Dashboard لإضافة زر تصدير شامل:

```tsx
// في Dashboard.tsx
<ExportButton
  data={dashboardData}
  elementId="dashboard-content"
  filename="تقرير-الداشبورد"
  title="تقرير الداشبورد الشامل"
/>
```

### إدارة العملاء المحتملين
تم تحديث مكون LeadsManagement لإضافة تصدير البيانات:

```tsx
// في LeadsManagement.tsx
<DataTableExporter
  data={filteredLeads}
  columns={leadsColumns}
  filename="العملاء-المحتملون"
  includeFilters={true}
  filters={currentFilters}
/>
```

### التقارير الشاملة
تم تحديث مكون ComprehensiveReports:

```tsx
// في ComprehensiveReports.tsx
<ReportExporter
  reportData={reportData}
  salesData={salesData}
  // ... باقي البيانات
/>
```

## التخصيص والتطوير

### إضافة تنسيقات جديدة
يمكن إضافة تنسيقات تصدير جديدة بسهولة:

```tsx
const exportToJSON = () => {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  // ... باقي الكود
};
```

### تخصيص التنسيق
يمكن تخصيص تنسيق PDF:

```tsx
// تخصيص الخطوط والألوان
pdf.setFontSize(20);
pdf.setTextColor(0, 0, 0);
pdf.text('العنوان', x, y);
```

### إضافة مرشحات جديدة
يمكن إضافة مرشحات جديدة للبيانات:

```tsx
const advancedFilters = {
  'التاريخ من': dateFrom,
  'التاريخ إلى': dateTo,
  'المنطقة': region,
  'نوع العميل': customerType
};
```

## المتطلبات التقنية

### المكتبات المطلوبة
- `jspdf`: لتصدير PDF
- `html2canvas`: لتحويل HTML إلى صورة
- `xlsx`: لتصدير Excel
- `date-fns`: لتنسيق التواريخ

### التثبيت
```bash
npm install jspdf html2canvas xlsx date-fns
```

## الأمان والأداء

### تحسين الأداء
- تحميل المكتبات عند الحاجة فقط
- ضغط البيانات الكبيرة
- إظهار مؤشر التحميل أثناء التصدير

### الأمان
- تنظيف البيانات قبل التصدير
- التحقق من صحة البيانات
- حماية من XSS في البيانات المصدرة

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

1. **خطأ في تصدير PDF**
   ```tsx
   // التأكد من وجود العنصر
   const element = document.getElementById('elementId');
   if (!element) {
     console.error('Element not found');
     return;
   }
   ```

2. **مشاكل الترميز العربي**
   ```tsx
   // إضافة BOM للـ CSV
   const csvContent = '\ufeff' + csvData.join('\n');
   ```

3. **بيانات كبيرة**
   ```tsx
   // تقسيم البيانات إلى أجزاء
   const chunkSize = 1000;
   const chunks = data.reduce((acc, item, index) => {
     const chunkIndex = Math.floor(index / chunkSize);
     if (!acc[chunkIndex]) acc[chunkIndex] = [];
     acc[chunkIndex].push(item);
     return acc;
   }, []);
   ```

## الخلاصة

تم إنشاء نظام تصدير شامل ومرن يدعم:
- ✅ تصدير PDF احترافي
- ✅ تصدير Excel متعدد الأوراق  
- ✅ تصدير CSV مع دعم العربية
- ✅ تصدير عناصر HTML كاملة
- ✅ دعم المرشحات والبحث
- ✅ تنسيق احترافي ومنظم
- ✅ سهولة الاستخدام والتخصيص

يمكن الآن استخدام هذه المكونات في أي مكان في النظام لتصدير البيانات بشكل احترافي ومنظم.