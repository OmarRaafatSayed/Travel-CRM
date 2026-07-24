import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, Database, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface DataTableExporterProps {
  data: any[];
  columns: { key: string; label: string; }[];
  filename?: string;
  title?: string;
  organizationName?: string;
  className?: string;
  includeFilters?: boolean;
  filters?: Record<string, any>;
}

export function DataTableExporter({
  data,
  columns,
  filename = 'بيانات-النظام',
  title = 'تقرير البيانات',
  organizationName = 'نظام إدارة العلاقات',
  className = '',
  includeFilters = false,
  filters = {}
}: DataTableExporterProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'object') {
      if (value instanceof Date) return format(value, 'yyyy-MM-dd');
      return JSON.stringify(value);
    }
    return value.toString();
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for tables
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(20);
      pdf.text(organizationName, 20, 20);
      pdf.setFontSize(16);
      pdf.text(title, 20, 35);
      pdf.setFontSize(10);
      pdf.text(`تاريخ الإنشاء: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 45);
      pdf.text(`عدد السجلات: ${data.length}`, 20, 55);

      // Filters information
      if (includeFilters && Object.keys(filters).length > 0) {
        let yPos = 65;
        pdf.text('المرشحات المطبقة:', 20, yPos);
        yPos += 10;
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            pdf.text(`${key}: ${value}`, 25, yPos);
            yPos += 8;
          }
        });
      }

      // Table headers
      let yPosition = includeFilters ? 100 : 70;
      const columnWidth = (pageWidth - 40) / columns.length;
      
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      
      columns.forEach((column, index) => {
        const xPos = 20 + (index * columnWidth);
        pdf.text(column.label, xPos, yPosition);
      });
      
      yPosition += 10;
      pdf.setFont(undefined, 'normal');

      // Table data
      data.forEach((row, rowIndex) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          
          // Repeat headers on new page
          pdf.setFont(undefined, 'bold');
          columns.forEach((column, index) => {
            const xPos = 20 + (index * columnWidth);
            pdf.text(column.label, xPos, yPosition);
          });
          yPosition += 10;
          pdf.setFont(undefined, 'normal');
        }

        columns.forEach((column, index) => {
          const xPos = 20 + (index * columnWidth);
          const cellValue = formatCellValue(row[column.key]);
          const truncatedValue = cellValue.length > 20 ? cellValue.substring(0, 17) + '...' : cellValue;
          pdf.text(truncatedValue, xPos, yPosition);
        });
        
        yPosition += 8;
      });

      pdf.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
      
      // Prepare data for Excel
      const excelData = [];
      
      // Add headers
      excelData.push(columns.map(col => col.label));
      
      // Add data rows
      data.forEach(row => {
        const excelRow = columns.map(col => formatCellValue(row[col.key]));
        excelData.push(excelRow);
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      const colWidths = columns.map(col => ({ wch: Math.max(col.label.length, 15) }));
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
      
      // Add summary sheet
      const summaryData = [
        [title],
        [''],
        ['اسم المؤسسة', organizationName],
        ['تاريخ الإنشاء', format(new Date(), 'yyyy-MM-dd HH:mm')],
        ['عدد السجلات', data.length.toString()],
        ['عدد الأعمدة', columns.length.toString()]
      ];
      
      if (includeFilters && Object.keys(filters).length > 0) {
        summaryData.push([''], ['المرشحات المطبقة:']);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            summaryData.push([key, value.toString()]);
          }
        });
      }
      
      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'ملخص التقرير');
      
      XLSX.writeFile(workbook, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // Prepare CSV data
      const csvData = [];
      
      // Add headers
      csvData.push(columns.map(col => col.label).join(','));
      
      // Add data rows
      data.forEach(row => {
        const csvRow = columns.map(col => {
          const value = formatCellValue(row[col.key]);
          // Escape commas and quotes in CSV
          return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvData.push(csvRow.join(','));
      });
      
      const csvContent = csvData.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return (
      <Button variant="outline" disabled className={className}>
        <Download className="h-4 w-4 mr-2" />
        لا توجد بيانات للتصدير
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`flex items-center gap-2 ${className}`} disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير البيانات'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          تصدير PDF ({data.length} سجل)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          تصدير Excel ({data.length} سجل)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          تصدير CSV ({data.length} سجل)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}