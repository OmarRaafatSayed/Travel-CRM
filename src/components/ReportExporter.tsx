import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ReportData {
  totalLeads: number;
  totalDeals: number;
  totalAccounts: number;
  totalProjects: number;
  totalRevenue: number;
  conversionRate: number;
  avgDealValue: number;
  activeUsers: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
  leads?: number;
  deals?: number;
  accounts?: number;
  projects?: number;
  revenue?: number;
}

interface ReportExporterProps {
  reportData: ReportData;
  salesData: ChartData[];
  performanceData: ChartData[];
  revenueData: ChartData[];
  industryData: ChartData[];
  timelineData: ChartData[];
  timeframe: string;
  organizationName?: string;
}

export function ReportExporter({
  reportData,
  salesData,
  performanceData,
  revenueData,
  industryData,
  timelineData,
  timeframe,
  organizationName = 'CRM System'
}: ReportExporterProps) {
  const { t, i18n } = useTranslation();

  const exportToPDF = async () => {
    const element = document.getElementById('reports-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // إضافة الهيدر
      pdf.setFontSize(24);
      pdf.text(organizationName, 20, 20);
      pdf.setFontSize(18);
      pdf.text(t('reports.title'), 20, 35);
      pdf.setFontSize(12);
      pdf.text(`${t('reports.period')}: ${t(`reports.timeframes.${timeframe}days`)}`, 20, 45);
      pdf.text(`${t('reports.generatedOn')}: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 55);
      
      // إضافة ملخص تنفيذي
      pdf.setFontSize(14);
      pdf.text(t('reports.executiveSummary.title'), 20, 70);
      pdf.setFontSize(10);
      
      const summaryData = [
        `${t('reports.metrics.totalRevenue')}: ${new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
          style: 'currency',
          currency: 'EGP'
        }).format(reportData.totalRevenue)}`,
        `${t('reports.metrics.totalDeals')}: ${reportData.totalDeals}`,
        `${t('reports.metrics.totalAccounts')}: ${reportData.totalAccounts}`,
        `${t('reports.metrics.conversionRate')}: ${reportData.conversionRate.toFixed(1)}%`
      ];

      summaryData.forEach((line, index) => {
        pdf.text(line, 20, 80 + (index * 8));
      });
      
      position = 120;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${organizationName}-${t('reports.title')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // ورقة الملخص التنفيذي
      const summaryData = [
        ['التقرير الشامل - ' + organizationName],
        [''],
        ['الفترة الزمنية', t(`reports.timeframes.${timeframe}days`)],
        ['تاريخ الإنشاء', format(new Date(), 'yyyy-MM-dd HH:mm')],
        [''],
        ['المؤشرات الرئيسية'],
        ['إجمالي الإيرادات', reportData.totalRevenue],
        ['إجمالي الصفقات', reportData.totalDeals],
        ['إجمالي العملاء', reportData.totalAccounts],
        ['إجمالي المشاريع', reportData.totalProjects],
        ['معدل التحويل (%)', reportData.conversionRate.toFixed(1)],
        ['متوسط قيمة الصفقة', reportData.avgDealValue],
        ['المستخدمون النشطون', reportData.activeUsers]
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'الملخص التنفيذي');

      // ورقة بيانات المبيعات
      if (salesData.length > 0) {
        const salesHeaders = ['التاريخ', 'العملاء المحتملون', 'الصفقات', 'الإيرادات'];
        const salesRows = salesData.map(item => [
          item.name,
          item.leads || 0,
          item.deals || 0,
          item.revenue || 0
        ]);
        
        const salesWS = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows]);
        XLSX.utils.book_append_sheet(workbook, salesWS, 'بيانات المبيعات');
      }

      // ورقة بيانات الأداء
      if (performanceData.length > 0) {
        const performanceHeaders = ['المؤشر', 'القيمة'];
        const performanceRows = performanceData.map(item => [item.name, item.value]);
        
        const performanceWS = XLSX.utils.aoa_to_sheet([performanceHeaders, ...performanceRows]);
        XLSX.utils.book_append_sheet(workbook, performanceWS, 'مؤشرات الأداء');
      }

      // ورقة بيانات الإيرادات
      if (revenueData.length > 0) {
        const revenueHeaders = ['الشهر', 'الإيرادات الفعلية', 'الهدف'];
        const revenueRows = revenueData.map(item => [
          item.name,
          item.revenue || 0,
          (item as any).target || 0
        ]);
        
        const revenueWS = XLSX.utils.aoa_to_sheet([revenueHeaders, ...revenueRows]);
        XLSX.utils.book_append_sheet(workbook, revenueWS, 'بيانات الإيرادات');
      }

      // ورقة بيانات الصناعات
      if (industryData.length > 0) {
        const industryHeaders = ['الصناعة', 'النسبة المئوية'];
        const industryRows = industryData.map(item => [item.name, item.value]);
        
        const industryWS = XLSX.utils.aoa_to_sheet([industryHeaders, ...industryRows]);
        XLSX.utils.book_append_sheet(workbook, industryWS, 'توزيع الصناعات');
      }

      // ورقة الجدول الزمني
      if (timelineData.length > 0) {
        const timelineHeaders = ['التاريخ', 'العملاء المحتملون', 'الصفقات', 'العملاء', 'المشاريع'];
        const timelineRows = timelineData.map(item => [
          item.name,
          item.leads || 0,
          item.deals || 0,
          item.accounts || 0,
          item.projects || 0
        ]);
        
        const timelineWS = XLSX.utils.aoa_to_sheet([timelineHeaders, ...timelineRows]);
        XLSX.utils.book_append_sheet(workbook, timelineWS, 'الجدول الزمني');
      }

      // تنسيق الملف وحفظه
      XLSX.writeFile(workbook, `${organizationName}-${t('reports.title')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        {t('reports.exportPDF')}
      </Button>
      <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        تصدير Excel
      </Button>
    </div>
  );
}