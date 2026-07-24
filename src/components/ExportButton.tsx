import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  title?: string;
  elementId?: string;
  headers?: string[];
  organizationName?: string;
  className?: string;
}

export function ExportButton({
  data,
  filename = 'تقرير',
  title = 'تقرير النظام',
  elementId,
  headers = [],
  organizationName = 'نظام إدارة العلاقات',
  className = ''
}: ExportButtonProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      if (elementId) {
        // تصدير عنصر HTML محدد
        const element = document.getElementById(elementId);
        if (!element) {
          console.error(`Element with id ${elementId} not found`);
          return;
        }

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
        pdf.text(title, 20, 35);
        pdf.setFontSize(12);
        pdf.text(`تاريخ الإنشاء: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 45);
        
        position = 60;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - position);

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      } else {
        // تصدير البيانات كجدول
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // إضافة الهيدر
        pdf.setFontSize(24);
        pdf.text(organizationName, 20, 20);
        pdf.setFontSize(18);
        pdf.text(title, 20, 35);
        pdf.setFontSize(12);
        pdf.text(`تاريخ الإنشاء: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 45);
        
        // إضافة البيانات
        let yPosition = 60;
        pdf.setFontSize(10);
        
        if (headers.length > 0) {
          pdf.text(headers.join(' | '), 20, yPosition);
          yPosition += 10;
        }
        
        data.forEach((row, index) => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const rowText = Array.isArray(row) ? row.join(' | ') : JSON.stringify(row);
          pdf.text(rowText, 20, yPosition);
          yPosition += 8;
        });

        pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // إنشاء ورقة البيانات
      let worksheetData = [];
      
      // إضافة الهيدر
      if (headers.length > 0) {
        worksheetData.push(headers);
      }
      
      // إضافة البيانات
      data.forEach(row => {
        if (Array.isArray(row)) {
          worksheetData.push(row);
        } else if (typeof row === 'object') {
          worksheetData.push(Object.values(row));
        } else {
          worksheetData.push([row]);
        }
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
      
      // إضافة ورقة معلومات التقرير
      const infoData = [
        [title],
        [''],
        ['اسم المؤسسة', organizationName],
        ['تاريخ الإنشاء', format(new Date(), 'yyyy-MM-dd HH:mm')],
        ['عدد السجلات', data.length.toString()]
      ];
      
      const infoWorksheet = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'معلومات التقرير');
      
      XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`flex items-center gap-2 ${className}`} disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير التقرير'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          تصدير Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}