import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Download, Eye, Save, Printer, Globe } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { useTranslation } from "react-i18next";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceData {
  id?: string;
  invoice_number: string;
  account_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms?: string;
}

interface InvoiceConfig {
  org_name: string;
  org_logo_url?: string;
  org_address?: string;
  org_phone?: string;
  org_email?: string;
  signature_url?: string;
  footer_text?: string;
  tax_number?: string;
  bank_details?: string;
}

interface InvoiceEditorProps {
  invoiceId?: string;
  onSave?: (invoice: InvoiceData) => void;
  onClose?: () => void;
}

export function InvoiceEditor({ invoiceId, onSave, onClose }: InvoiceEditorProps) {
  const { t, i18n } = useTranslation();
  const [invoiceLanguage, setInvoiceLanguage] = useState(() => {
    return localStorage.getItem('invoiceLanguage') || i18n.language;
  });
  const isRTL = invoiceLanguage === 'ar';
  
  const handleLanguageChange = (lang: string) => {
    setInvoiceLanguage(lang);
    localStorage.setItem('invoiceLanguage', lang);
  };
  
  const printInvoice = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: black; }
            .rtl { direction: rtl; }
            .ltr { direction: ltr; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #333; padding: 8px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .text-3xl { font-size: 1.875rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-lg { font-size: 1.125rem; }
            .text-sm { font-size: 0.875rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-2 { margin-top: 0.5rem; }
            .p-2 { padding: 0.5rem; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .border-t { border-top: 1px solid #333; }
            .whitespace-pre-line { white-space: pre-line; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-start { justify-content: flex-start; }
            .justify-end { justify-content: flex-end; }
            .flex-row { flex-direction: row; }
            .flex-row-reverse { flex-direction: row-reverse; }
            .items-start { align-items: flex-start; }
            .w-64 { width: 16rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            img { width: 100px; height: 100px; object-fit: contain; }
            @media print { body { margin: 0; } img { width: 100px; height: 100px; } }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoice_number: `INV-${Date.now()}`,
    account_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    currency: 'EGP',
    items: [{ id: '1', description: '', quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    tax_rate: 14,
    tax_amount: 0,
    total_amount: 0
  });
  
  const [config, setConfig] = useState<InvoiceConfig>({
    org_name: '',
    org_address: '',
    org_phone: '',
    org_email: '',
    footer_text: '',
    tax_number: '',
    bank_details: ''
  });
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { membership } = useOrganization();

  useEffect(() => {
    if (membership?.organization_id) {
      fetchConfig();
      fetchAccounts();
      if (invoiceId) {
        fetchInvoice();
      }
    }
  }, [membership, invoiceId]);

  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.tax_rate]);

  const fetchConfig = async () => {
    if (!membership?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .single();

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchAccounts = async () => {
    if (!membership?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, email, phone, address')
        .eq('organization_id', membership.organization_id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      if (data) {
        setInvoice({
          id: data.id,
          invoice_number: data.invoice_number,
          account_id: data.account_id || '',
          issue_date: data.issue_date,
          due_date: data.due_date || '',
          status: data.status,
          currency: data.currency,
          items: [{ id: '1', description: data.description || '', quantity: 1, unit_price: data.amount, total: data.amount }],
          subtotal: data.amount,
          tax_rate: 0,
          tax_amount: 0,
          total_amount: data.amount,
          notes: data.description || '',
          terms: data.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const tax_amount = (subtotal * invoice.tax_rate) / 100;
    const total_amount = subtotal + tax_amount;

    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeItem = (id: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const saveInvoice = async () => {
    if (!membership?.organization_id) return;
    
    if (!invoice.account_id) {
      toast({
        title: "Error",
        description: "Please select an account",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const invoiceData = {
        invoice_number: invoice.invoice_number,
        account_id: invoice.account_id,
        amount: invoice.total_amount,
        currency: invoice.currency,
        status: invoice.status,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date || null,
        description: invoice.notes || null,
        notes: invoice.terms || null,
        organization_id: membership.organization_id,
        user_id: user.id,
        created_by: user.id
      };

      let savedInvoice;
      if (invoiceId) {
        const { data, error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoiceId)
          .select()
          .single();

        if (error) throw error;
        savedInvoice = data;
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

        if (error) throw error;
        savedInvoice = data;
      }

      toast({
        title: "Success",
        description: "Invoice saved successfully",
      });

      if (onSave) {
        onSave(invoice);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoice.invoice_number}.pdf`);

      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === invoice.account_id);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-48"></div>
      <div className="h-96 bg-muted rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Editor Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={invoice.invoice_number}
                onChange={(e) => setInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
              />
            </div>
            <div>
              <Label>Account</Label>
              <Select value={invoice.account_id} onValueChange={(value) => setInvoice(prev => ({ ...prev, account_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={invoice.issue_date}
                onChange={(e) => setInvoice(prev => ({ ...prev, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoice.due_date}
                onChange={(e) => setInvoice(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Status</Label>
              <Select value={invoice.status} onValueChange={(value) => setInvoice(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={invoice.currency} onValueChange={(value) => setInvoice(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">EGP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={invoice.tax_rate}
                onChange={(e) => setInvoice(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Invoice Items</Label>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {invoice.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                  <div className="col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.total.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={invoice.items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={invoice.notes || ''}
                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea
                value={invoice.terms || ''}
                onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Payment terms and conditions..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={saveInvoice} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Invoice'}
            </Button>
            <Button onClick={generatePDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={printInvoice} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Select value={invoiceLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={invoiceRef} className={`bg-white p-8 text-black ${isRTL ? 'rtl' : 'ltr'}`} style={{ minHeight: '297mm', direction: isRTL ? 'rtl' : 'ltr' }}>
            <style>
              {`
                @media print {
                  img { width: 100px !important; height: 100px !important; object-fit: contain !important; }
                }
              `}
            </style>
            {/* Header */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start mb-8`}>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                {config.org_logo_url && (
                  <img src={config.org_logo_url} alt="Logo" className="mb-4" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                )}
                <h1 className="text-3xl font-bold text-gray-800">{config.org_name}</h1>
                {config.org_address && (
                  <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                    {config.org_address}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  {config.org_phone && <div>{isRTL ? 'الهاتف' : 'Phone'}: {config.org_phone}</div>}
                  {config.org_email && <div>{isRTL ? 'البريد الإلكتروني' : 'Email'}: {config.org_email}</div>}
                  {config.tax_number && <div>{isRTL ? 'الرقم الضريبي' : 'Tax ID'}: {config.tax_number}</div>}
                </div>
              </div>
              <div className={isRTL ? 'text-left' : 'text-right'}>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{isRTL ? 'فاتورة' : 'INVOICE'}</h2>
                <div className="text-sm text-gray-600">
                  <div><strong>{isRTL ? 'رقم الفاتورة' : 'Invoice #'}:</strong> {invoice.invoice_number}</div>
                  <div><strong>{isRTL ? 'التاريخ' : 'Date'}:</strong> {new Date(invoice.issue_date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</div>
                  {invoice.due_date && (
                    <div><strong>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}:</strong> {new Date(invoice.due_date).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To */}
            {selectedAccount && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{isRTL ? 'فاتورة إلى' : 'Bill To'}:</h3>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{selectedAccount.name}</div>
                  {selectedAccount.address && (
                    <div className="whitespace-pre-line">{selectedAccount.address}</div>
                  )}
                  {selectedAccount.phone && <div>{isRTL ? 'الهاتف' : 'Phone'}: {selectedAccount.phone}</div>}
                  {selectedAccount.email && <div>{isRTL ? 'البريد الإلكتروني' : 'Email'}: {selectedAccount.email}</div>}
                </div>
              </div>
            )}

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={`border border-gray-300 p-2 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الوصف' : 'Description'}</th>
                    <th className="border border-gray-300 p-2 text-center">{isRTL ? 'الكمية' : 'Qty'}</th>
                    <th className={`border border-gray-300 p-2 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className={`border border-gray-300 p-2 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{item.description}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                      <td className={`border border-gray-300 p-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', { 
                          style: 'currency', 
                          currency: invoice.currency 
                        }).format(item.unit_price)}
                      </td>
                      <td className={`border border-gray-300 p-2 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', { 
                          style: 'currency', 
                          currency: invoice.currency 
                        }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-8`}>
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}:</span>
                  <span>{new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', { 
                    style: 'currency', 
                    currency: invoice.currency 
                  }).format(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isRTL ? 'الضريبة' : 'Tax'} ({invoice.tax_rate}%):</span>
                  <span>{new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', { 
                    style: 'currency', 
                    currency: invoice.currency 
                  }).format(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                  <span>{isRTL ? 'الإجمالي' : 'Total'}:</span>
                  <span>{new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-EG', { 
                    style: 'currency', 
                    currency: invoice.currency 
                  }).format(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mb-8 space-y-4">
                {invoice.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{isRTL ? 'الملاحظات' : 'Notes'}:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bank Details */}
            {config.bank_details && (
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 mb-2">{isRTL ? 'تفاصيل الدفع' : 'Payment Details'}:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{config.bank_details}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto">
              {config.signature_url && (
                <div className="mb-4">
                  <img src={config.signature_url} alt="Signature" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
                </div>
              )}
              {config.footer_text && (
                <div className="text-sm text-gray-600 text-center border-t border-gray-300 pt-4">
                  {config.footer_text}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}