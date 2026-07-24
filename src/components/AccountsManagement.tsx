import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Globe,
  MapPin,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Loader2,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { HelpSystem } from './HelpSystem';
import { PermissionGate } from "@/components/PermissionGate";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

interface Account {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  description: string;
  assigned_to: string;
  total_deals_value: number;
  active_deals: number;
  total_projects: number;
  last_contact: string;
  created_at: string;
}

interface AccountFormData {
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  description: string;
  assigned_to?: string;
}

const industryColors = {
  technology: "bg-blue-100 text-blue-800",
  fashion: "bg-purple-100 text-purple-800", 
  construction: "bg-orange-100 text-orange-800",
  hospitality: "bg-green-100 text-green-800",
  retail: "bg-yellow-100 text-yellow-800",
  healthcare: "bg-red-100 text-red-800",
  finance: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800"
};

export function AccountsManagement() {
  const { t } = useTranslation();
  const { organization, membership } = useOrganization();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; first_name?: string; last_name?: string; email: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AccountFormData>({
    name: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "Cairo",
    country: "Egypt",
    description: "",
    assigned_to: ""
  });
  const { toast } = useToast();

  const fetchAccounts = useCallback(async () => {
    if (!membership?.organization_id) return;
    
    try {
      setIsLoading(true);
      
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('created_at', { ascending: false });

      if (accountsError) throw accountsError;

      const accountsWithStats = (accountsData || []).map(account => ({
        ...account,
        assigned_to: account.assigned_to || 'Unassigned',
        last_contact: new Date().toISOString(),
        total_deals_value: 0,
        active_deals: 0,
        total_projects: 0
      }));

      setAccounts(accountsWithStats);
      setFilteredAccounts(accountsWithStats);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: t('common.error'),
        description: t('accounts.fetch_failed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [membership?.organization_id, t, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(account => account.industry === industryFilter);
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, industryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: t('common.error'),
        description: t('accounts.fill_required_fields'),
        variant: "destructive"
      });
      return;
    }

    if (!user || !membership?.organization_id) {
      toast({
        title: t('common.error'),
        description: t('accounts.missing_context'),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const accountData = {
        name: formData.name,
        industry: formData.industry,
        website: formData.website,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        description: formData.description,
        organization_id: membership.organization_id,
        created_by: user.id,
        assigned_to: formData.assigned_to || null
      };

      const { data: newAccount, error } = await supabase
        .from('accounts')
        .insert([accountData])
        .select()
        .single();

      if (error) throw error;

      console.log('Account created successfully:', newAccount);

      toast({
        title: "Success",
        description: "Account created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: `Failed to create account: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      city: "Cairo",
      country: "Egypt",
      description: "",
      assigned_to: ""
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const AccountCard = ({ account }: { account: Account }) => (
    <Card className="hover:shadow-medium transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">{account.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{account.description}</p>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={industryColors[account.industry as keyof typeof industryColors] || industryColors.other}>
                {account.industry || 'Other'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {account.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{account.email}</span>
            </div>
          )}
          {account.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{account.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{account.city}, {account.country}</span>
          </div>
          {account.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a 
                href={account.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {account.website.replace('https://', '')}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setViewingAccount(account)}>
            <Eye className="w-4 h-4 mr-1" />
            {t('accountsManagement.buttons.view')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="can_view_accounts" fallback={
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">{t('common.access_denied')}</h2>
        <p className="text-muted-foreground">{t('accounts.no_permission')}</p>
      </div>
    }>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('accounts.management')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t('accounts.description')}</p>
            </div>
            <HelpSystem feature="accounts" />
          </div>
          <PermissionGate permission="can_create_accounts">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('accountsManagement.addNewAccount')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] mx-4">
                <DialogHeader>
                  <DialogTitle>{t('accountsManagement.addNewAccount')}</DialogTitle>
                  <DialogDescription>
                    {t('accountsManagement.createDescription')}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('accountsManagement.form.companyName')} *</Label>
                      <Input 
                        id="name" 
                        placeholder={t('accountsManagement.form.companyNamePlaceholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('accountsManagement.form.email')} *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder={t('accountsManagement.form.emailPlaceholder')}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('accountsManagement.form.phone')}</Label>
                      <Input 
                        id="phone" 
                        placeholder={t('accountsManagement.form.phonePlaceholder')}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">{t('accountsManagement.form.industry')}</Label>
                      <Select value={formData.industry} onValueChange={(value) => setFormData({...formData, industry: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('accountsManagement.form.selectIndustry')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">{t('accountsManagement.industries.technology')}</SelectItem>
                          <SelectItem value="fashion">{t('accountsManagement.industries.fashion')}</SelectItem>
                          <SelectItem value="construction">{t('accountsManagement.industries.construction')}</SelectItem>
                          <SelectItem value="hospitality">{t('accountsManagement.industries.hospitality')}</SelectItem>
                          <SelectItem value="retail">{t('accountsManagement.industries.retail')}</SelectItem>
                          <SelectItem value="healthcare">{t('accountsManagement.industries.healthcare')}</SelectItem>
                          <SelectItem value="finance">{t('accountsManagement.industries.finance')}</SelectItem>
                          <SelectItem value="other">{t('accountsManagement.industries.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">{t('accountsManagement.form.website')}</Label>
                      <Input 
                        id="website" 
                        placeholder={t('accountsManagement.form.websitePlaceholder')}
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">{t('accountsManagement.form.description')}</Label>
                      <Textarea 
                        id="description" 
                        placeholder={t('accountsManagement.form.descriptionPlaceholder')}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      {t('accountsManagement.buttons.cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('accountsManagement.buttons.creating')}
                        </>
                      ) : (
                        t('accountsManagement.buttons.createAccount')
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder={t('accountsManagement.search.placeholder')}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('accountsManagement.filters.allIndustries')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('accountsManagement.filters.allIndustries')}</SelectItem>
                  <SelectItem value="technology">{t('accountsManagement.industries.technology')}</SelectItem>
                  <SelectItem value="fashion">{t('accountsManagement.industries.fashion')}</SelectItem>
                  <SelectItem value="construction">{t('accountsManagement.industries.construction')}</SelectItem>
                  <SelectItem value="hospitality">{t('accountsManagement.industries.hospitality')}</SelectItem>
                  <SelectItem value="retail">{t('accountsManagement.industries.retail')}</SelectItem>
                  <SelectItem value="healthcare">{t('accountsManagement.industries.healthcare')}</SelectItem>
                  <SelectItem value="finance">{t('accountsManagement.industries.finance')}</SelectItem>
                  <SelectItem value="other">{t('accountsManagement.industries.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Grid */}
        {filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('accountsManagement.noAccounts.title')}</h3>
              <p className="text-muted-foreground">{t('accountsManagement.noAccounts.description')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}

        {/* View Account Dialog */}
        <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
          <DialogContent className="sm:max-w-[600px] mx-4">
            <DialogHeader>
              <DialogTitle>{viewingAccount?.name}</DialogTitle>
              <DialogDescription>{t('accountsManagement.viewDialog.description')}</DialogDescription>
            </DialogHeader>
            {viewingAccount && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('accountsManagement.viewDialog.industry')}</Label>
                    <p className="text-sm text-muted-foreground">{viewingAccount.industry || t('accountsManagement.viewDialog.notSpecified')}</p>
                  </div>
                  <div>
                    <Label>{t('accountsManagement.viewDialog.website')}</Label>
                    <p className="text-sm text-muted-foreground">{viewingAccount.website || t('accountsManagement.viewDialog.notSpecified')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('accountsManagement.viewDialog.phone')}</Label>
                    <p className="text-sm text-muted-foreground">{viewingAccount.phone || t('accountsManagement.viewDialog.notSpecified')}</p>
                  </div>
                  <div>
                    <Label>{t('accountsManagement.viewDialog.email')}</Label>
                    <p className="text-sm text-muted-foreground">{viewingAccount.email || t('accountsManagement.viewDialog.notSpecified')}</p>
                  </div>
                </div>
                <div>
                  <Label>{t('accountsManagement.viewDialog.address')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingAccount.address ? `${viewingAccount.address}, ` : ''}{viewingAccount.city}, {viewingAccount.country}
                  </p>
                </div>
                <div>
                  <Label>{t('accountsManagement.form.description')}</Label>
                  <p className="text-sm text-muted-foreground">{viewingAccount.description || t('accountsManagement.viewDialog.noDescription')}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}