import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Building, Upload, Save, Users, Settings, AlertTriangle, Crown } from 'lucide-react';

interface OrganizationForm {
  name: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
}

export function OrganizationSettings() {
  const { t } = useTranslation();
  const { organization, isOrgAdmin, refetchOrganization } = useOrganization();
  const { subscription, memberCount, canAddMember, getRemainingSeats, maxSeats } = useSubscriptionLimits();
  const [form, setForm] = useState<OrganizationForm>({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || '',
        description: organization.description || '',
        website: organization.website || '',
        email: organization.email || '',
        phone: organization.phone || '',
        address: organization.address || '',
        logo_url: organization.logo_url || ''
      });
      fetchMembers();
    }
  }, [organization]);

  const fetchMembers = async () => {
    if (!organization) return;
    
    try {
      // Fetch organization members
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id);
      
      if (membersError) throw membersError;
      
      // Fetch profiles separately and combine
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, avatar_url')
            .eq('user_id', member.user_id)
            .single();
          
          return {
            ...member,
            profiles: profile || {
              first_name: null,
              last_name: null,
              email: null,
              avatar_url: null
            }
          };
        })
      );
      
      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const updateOrganization = async () => {
    if (!organization || !isOrgAdmin) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: form.name,
          description: form.description,
          website: form.website,
          email: form.email,
          phone: form.phone,
          address: form.address,
          logo_url: form.logo_url
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('organization.settings_updated_successfully'),
      });

      await refetchOrganization();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_update_organization'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveMember = async (memberId: string) => {
    if (!canAddMember()) {
      toast({
        title: t('common.error'),
        description: t('organization.member_limit_reached', 'Member limit reached. Upgrade your subscription to add more members.'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('approve_organization_member', {
        member_id: memberId
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('organization.member_approved_successfully'),
      });

      fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_approve_member'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const rejectMember = async (memberId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('reject_organization_member', {
        member_id: memberId
      });

      if (error) throw error;

      toast({
        title: t('common.success'), 
        description: t('organization.member_request_rejected'),
      });

      fetchMembers();
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_reject_member'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('organization.member_role_updated_successfully'),
      });

      fetchMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: t('common.error'),
        description: t('errors.failed_to_update_member_role'),
        variant: 'destructive',
      });
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t('organization.no_organization_found')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "default",
      rejected: "destructive",
      suspended: "secondary"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">{t('organization.organization_settings')}</h1>
        {getStatusBadge(organization.status)}
      </div>

      {/* Organization Logo and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('organization.organization_details')}
          </CardTitle>
          <CardDescription>
            {t('organization.manage_basic_info')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center border">
              {form.logo_url ? (
                <img 
                  src={form.logo_url} 
                  alt={t('organization.organization_logo')} 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="logo_url">{t('organization.logo_url')}</Label>
              <div className="flex gap-2">
                <Input
                  id="logo_url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder={t('organization.logo_url_placeholder')}
                  disabled={!isOrgAdmin}
                />
                <Button variant="outline" size="sm" disabled={!isOrgAdmin}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('organization.organization_name')}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!isOrgAdmin}
              />
            </div>
            <div>
              <Label htmlFor="website">{t('organization.website')}</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder={t('organization.website_placeholder')}
                disabled={!isOrgAdmin}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('organization.email')}</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('organization.email_placeholder')}
                disabled={!isOrgAdmin}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t('organization.phone')}</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={t('organization.phone_placeholder')}
                disabled={!isOrgAdmin}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t('organization.description')}</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('organization.description_placeholder')}
              disabled={!isOrgAdmin}
              className="min-h-20"
            />
          </div>

          <div>
            <Label htmlFor="address">{t('organization.address')}</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t('organization.address_placeholder')}
              disabled={!isOrgAdmin}
              className="min-h-16"
            />
          </div>

          {isOrgAdmin && (
            <div className="flex justify-end">
              <Button onClick={updateOrganization} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? t('common.saving') : t('common.save_changes')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Limits */}
      {subscription && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              {t('organization.subscription_limits', 'Subscription Limits')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{memberCount}</div>
                <div className="text-sm text-gray-600">{t('organization.current_members', 'Current Members')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{maxSeats}</div>
                <div className="text-sm text-gray-600">{t('organization.max_seats', 'Max Seats')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{getRemainingSeats()}</div>
                <div className="text-sm text-gray-600">{t('organization.remaining_seats', 'Remaining Seats')}</div>
              </div>
            </div>
            {!canAddMember() && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-orange-800">
                  {t('organization.upgrade_needed', 'You have reached your member limit. Upgrade your subscription to add more members.')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('organization.team_members', { count: members.length })}
          </CardTitle>
          <CardDescription>
            {t('organization.manage_members_roles')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Active Members */}
            {members.filter(m => m.status === 'active').map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {member.profiles?.avatar_url ? (
                      <img 
                        src={member.profiles.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="text-primary font-medium">
                        {member.profiles?.first_name?.[0] || 'U'}
                        {member.profiles?.last_name?.[0] || ''}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.profiles?.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                  {isOrgAdmin && member.user_id !== organization?.created_by && (
                    <Select
                      value={member.role}
                      onValueChange={(newRole) => updateMemberRole(member.id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{t('organization.roles.admin')}</SelectItem>
                        <SelectItem value="manager">{t('organization.roles.manager')}</SelectItem>
                        <SelectItem value="sales">{t('organization.roles.sales')}</SelectItem>
                        <SelectItem value="marketing">{t('organization.roles.marketing')}</SelectItem>
                        <SelectItem value="support">{t('organization.roles.support')}</SelectItem>
                        <SelectItem value="developer">{t('organization.roles.developer')}</SelectItem>
                        <SelectItem value="designer">{t('organization.roles.designer')}</SelectItem>
                        <SelectItem value="analyst">{t('organization.roles.analyst')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
            
            {/* Pending Members */}
            {isOrgAdmin && members.filter(m => m.status === 'pending').length > 0 && (
              <>
                <div className="border-t pt-4 mt-6">
                  <h4 className="font-medium mb-3 text-muted-foreground">{t('organization.pending_requests')}</h4>
                </div>
                {members.filter(m => m.status === 'pending').map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {member.profiles?.avatar_url ? (
                          <img 
                            src={member.profiles.avatar_url} 
                            alt={t('common.avatar')} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="text-primary font-medium">
                            {member.profiles?.first_name?.[0] || 'U'}
                            {member.profiles?.last_name?.[0] || ''}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{t('status.pending')}</Badge>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => approveMember(member.id)}
                      >
                        {t('organization.approve')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectMember(member.id)}
                      >
                        {t('organization.reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}