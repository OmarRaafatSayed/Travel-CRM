import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Save, Image as ImageIcon } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";

interface InvoiceConfig {
  id?: string;
  organization_id: string;
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

export function InvoiceConfiguration() {
  const [config, setConfig] = useState<InvoiceConfig>({
    organization_id: '',
    org_name: '',
    org_address: '',
    org_phone: '',
    org_email: '',
    footer_text: '',
    tax_number: '',
    bank_details: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { membership } = useOrganization();

  useEffect(() => {
    if (membership?.organization_id) {
      fetchConfig();
    }
  }, [membership]);

  const fetchConfig = async () => {
    if (!membership?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('invoice_configurations')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
      } else {
        setConfig(prev => ({ ...prev, organization_id: membership.organization_id }));
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'signature') => {
    if (!membership?.organization_id) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${membership.organization_id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoice-assets')
        .getPublicUrl(fileName);

      setConfig(prev => ({
        ...prev,
        [type === 'logo' ? 'org_logo_url' : 'signature_url']: publicUrl
      }));

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Signature'} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    if (!membership?.organization_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoice_configurations')
        .upsert({
          ...config,
          organization_id: membership.organization_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-48"></div>
      <div className="h-64 bg-muted rounded"></div>
    </div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="org_name">Organization Name</Label>
              <Input
                id="org_name"
                value={config.org_name}
                onChange={(e) => setConfig(prev => ({ ...prev, org_name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <Label htmlFor="org_email">Email</Label>
              <Input
                id="org_email"
                type="email"
                value={config.org_email || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, org_email: e.target.value }))}
                placeholder="company@example.com"
              />
            </div>

            <div>
              <Label htmlFor="org_phone">Phone</Label>
              <Input
                id="org_phone"
                value={config.org_phone || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, org_phone: e.target.value }))}
                placeholder="+20 123 456 7890"
              />
            </div>

            <div>
              <Label htmlFor="tax_number">Tax Number</Label>
              <Input
                id="tax_number"
                value={config.tax_number || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, tax_number: e.target.value }))}
                placeholder="Tax ID / VAT Number"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="org_address">Address</Label>
              <Textarea
                id="org_address"
                value={config.org_address || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, org_address: e.target.value }))}
                placeholder="Company Address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bank_details">Bank Details</Label>
              <Textarea
                id="bank_details"
                value={config.bank_details || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, bank_details: e.target.value }))}
                placeholder="Bank name, Account number, IBAN, etc."
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Organization Logo</Label>
            <div className="mt-2 space-y-2">
              {config.org_logo_url && (
                <img src={config.org_logo_url} alt="Logo" className="h-20 object-contain" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Signature</Label>
            <div className="mt-2 space-y-2">
              {config.signature_url && (
                <img src={config.signature_url} alt="Signature" className="h-20 object-contain" />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'signature');
                  }}
                  className="hidden"
                  id="signature-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('signature-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Signature
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="footer_text">Footer Text</Label>
          <Textarea
            id="footer_text"
            value={config.footer_text || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, footer_text: e.target.value }))}
            placeholder="Thank you for your business! Payment terms: Net 30 days."
            rows={3}
          />
        </div>

        <Button
          onClick={saveConfig}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
}