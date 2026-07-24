import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Edit, DollarSign, Trash2, Settings, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PermissionGate } from "./PermissionGate";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { InvoiceEditor } from "./InvoiceEditor";
import { InvoiceConfiguration } from "./InvoiceConfiguration";

interface Invoice {
  id: string;
  invoice_number: string;
  account_id: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  description?: string;
  notes?: string;
  currency: string;
  created_by: string;
  created_at: string;
  accounts?: { name: string };
}

const statusColors = {
  draft: "bg-primary/10 text-primary",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700"
};

export function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { membership } = useOrganization();

  if (!user || !membership) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Please join an organization to access invoices.</p>
        </div>
      </div>
    );
  }



  useEffect(() => {
    if (membership?.organization_id) {
      fetchInvoices();
    }
  }, [membership]);

  const fetchInvoices = async () => {
    if (!membership?.organization_id) return;
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          accounts(name)
        `)
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };







  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };



  const openEditor = (invoiceId?: string) => {
    setEditingInvoiceId(invoiceId || null);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setEditingInvoiceId(null);
    setShowEditor(false);
    fetchInvoices();
  };

  const formatCurrency = (amount: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat('en-EG', { 
      style: 'currency', 
      currency: currency, 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="can_view_invoices" fallback={
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to view invoices.</p>
        </div>
      </div>
    }>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-muted-foreground">Create, edit, and manage your invoices with PDF generation</p>
          </div>
        </div>

        {showEditor ? (
          <InvoiceEditor
            invoiceId={editingInvoiceId || undefined}
            onSave={closeEditor}
            onClose={closeEditor}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  onClick={() => openEditor()}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invoices.map(invoice => (
                  <Card key={invoice.id} className="hover:shadow-card transition-all duration-300 border border-primary/10 hover:border-primary/20 bg-gradient-to-br from-white to-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-lg text-foreground">{invoice.invoice_number}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {invoice.accounts?.name || 'No account'}
                          </p>
                          <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-primary">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-bold text-lg">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {invoice.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {invoice.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issue Date</span>
                          <span className="text-foreground">
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </span>
                        </div>
                        {invoice.due_date && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due Date</span>
                            <span className="text-foreground">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-primary/20 hover:bg-primary/10"
                          onClick={() => openEditor(invoice.id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-destructive/20 hover:bg-destructive/10 text-destructive hover:text-destructive"
                          onClick={() => deleteInvoice(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {invoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No invoices yet</h3>
                  <p className="text-muted-foreground mb-4">Get started by creating your first invoice</p>
                  <Button 
                    onClick={() => openEditor()}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="configuration">
              <InvoiceConfiguration />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PermissionGate>
  );
}