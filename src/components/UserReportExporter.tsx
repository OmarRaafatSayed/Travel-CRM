import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface UserMetrics {
  projectsCompleted: number;
  accountsManaged: number;
  leadsConverted: number;
  dealsWon: number;
  tasksCompleted: number;
  revenueGenerated: number;
  productivityScore: number;
  averageTaskTime: number;
}

interface ChartData {
  name: string;
  value: number;
  date?: string;
}

interface TimelineData {
  date: string;
  projects: number;
  accounts: number;
  leads: number;
  deals: number;
}

interface UserReportExporterProps {
  metrics: UserMetrics;
  performanceData: ChartData[];
  activityData: ChartData[];
  timelineData: TimelineData[];
  timeframe: string;
  userName?: string;
}

export function UserReportExporter({
  metrics,
  performanceData,
  activityData,
  timelineData,
  timeframe,
  userName = 'المستخدم'
}: UserReportExporterProps) {
  const { t, i18n } = useTranslation();

  const exportToPDF = async () => {
    const element = document.getElementById('user-reports-content');
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
      pdf.text(`تقرير أداء المستخدم - ${userName}`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`الفترة الزمنية: ${timeframe}`, 20, 35);
      pdf.text(`تاريخ الإنشاء: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 45);
      
      // إضافة ملخص الأداء
      pdf.setFontSize(14);
      pdf.text('ملخص الأداء', 20, 60);
      pdf.setFontSize(10);
      
      const summaryData = [
        `نقاط الإنتاجية: ${metrics.productivityScore}%`,
        `الإيرادات المحققة: ${metrics.revenueGenerated.toLocaleString()} جنيه`,
        `المهام المكتملة: ${metrics.tasksCompleted}`,
        `المشاريع المكتملة: ${metrics.projectsCompleted}`,
        `العملاء المحتملون المحولون: ${metrics.leadsConverted}`,
        `الصفقات المربوحة: ${metrics.dealsWon}`
      ];

      summaryData.forEach((line, index) => {
        pdf.text(line, 20, 70 + (index * 8));
      });
      
      position = 130;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`تقرير-المستخدم-${userName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // ورقة ملخص الأداء
      const summaryData = [
        [`تقرير أداء المستخدم - ${userName}`],
        [''],
        ['الفترة الزمنية', timeframe],
        ['تاريخ الإنشاء', format(new Date(), 'yyyy-MM-dd HH:mm')],
        [''],
        ['مؤشرات الأداء الرئيسية'],
        ['نقاط الإنتاجية (%)', metrics.productivityScore],
        ['الإيرادات المحققة', metrics.revenueGenerated],
        ['المهام المكتملة', metrics.tasksCompleted],
        ['المشاريع المكتملة', metrics.projectsCompleted],
        ['العملاء المحولون', metrics.leadsConverted],
        ['الصفقات المربوحة', metrics.dealsWon],
        ['العملاء المُدارون', metrics.accountsManaged],
        ['متوسط وقت المهمة (ساعات)', metrics.averageTaskTime]
      ];

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, 'ملخص الأداء');

      // ورقة بيانات الأداء
      if (performanceData.length > 0) {
        const performanceHeaders = ['النشاط', 'العدد'];
        const performanceRows = performanceData.map(item => [item.name, item.value]);
        
        const performanceWS = XLSX.utils.aoa_to_sheet([performanceHeaders, ...performanceRows]);
        XLSX.utils.book_append_sheet(workbook, performanceWS, 'تفصيل الأداء');
      }

      // ورقة النشاط الأسبوعي
      if (activityData.length > 0) {
        const activityHeaders = ['اليوم', 'عدد الأنشطة'];
        const activityRows = activityData.map(item => [item.name, item.value]);
        
        const activityWS = XLSX.utils.aoa_to_sheet([activityHeaders, ...activityRows]);
        XLSX.utils.book_append_sheet(workbook, activityWS, 'النشاط الأسبوعي');
      }

      // ورقة الجدول الزمني
      if (timelineData.length > 0) {
        const timelineHeaders = ['التاريخ', 'المشاريع', 'العملاء', 'العملاء المحتملون', 'الصفقات'];
        const timelineRows = timelineData.map(item => [
          item.date,
          item.projects,
          item.accounts,
          item.leads,
          item.deals
        ]);
        
        const timelineWS = XLSX.utils.aoa_to_sheet([timelineHeaders, ...timelineRows]);
        XLSX.utils.book_append_sheet(workbook, timelineWS, 'الجدول الزمني');
      }

      XLSX.writeFile(workbook, `تقرير-المستخدم-${userName}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        تصدير PDF
      </Button>
      <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        تصدير Excel
      </Button>
    </div>
  );
}