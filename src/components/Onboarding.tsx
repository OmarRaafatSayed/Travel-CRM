import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useTranslation } from 'react-i18next';
import { Building2, Search, Check, Users, Crown, Clock, Shield } from "lucide-react";
import { OrganizationCleaner } from "@/components/OrganizationCleaner";
import { QuickOrgCreator } from "@/components/QuickOrgCreator";

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  memberCount: number;
  userRole?: string;
  userStatus?: string;
  isCreator?: boolean;
}

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { refetchOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isExistingMember, setIsExistingMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'active' | 'pending' | null>(null);
  const [wouldBecomeAdmin, setWouldBecomeAdmin] = useState(false);
  const [step, setStep] = useState<"select" | "create">("select");
  
  const [newOrgData, setNewOrgData] = useState({
    name: "",
    slug: "",
    description: ""
  });

  // Fetch user's organizations with their role and status
  const fetchUserOrganizations = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get organizations where user is a member or creator
      const { data: userOrgs, error: orgError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          slug,
          status,
          created_by,
          organization_members!inner(
            role,
            status
          )
        `)
        .eq('organization_members.user_id', user.id)
        .eq('status', 'approved');

      if (orgError) {
        console.error('Error fetching user organizations:', orgError);
        // Fallback: get organizations created by user
        const { data: createdOrgs, error: createdError } = await supabase
          .from('organizations')
          .select('id, name, slug, status, created_by')
          .eq('created_by', user.id)
          .eq('status', 'approved');
        
        if (createdError) throw createdError;
        
        const orgsWithUserInfo = (createdOrgs || []).map(org => ({
          ...org,
          memberCount: 1,
          userRole: 'admin',
          userStatus: 'active',
          isCreator: true
        }));
        
        setOrganizations(orgsWithUserInfo);
        return;
      }

      // Get member counts for each organization
      const orgIds = userOrgs?.map(org => org.id) || [];
      const { data: memberCounts } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('status', 'active')
        .in('organization_id', orgIds);

      // Count members per organization
      const memberCountMap = memberCounts?.reduce((acc, member) => {
        acc[member.organization_id] = (acc[member.organization_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Map to the expected format with user info
      const orgsWithUserInfo = (userOrgs || []).map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        memberCount: memberCountMap[org.id] || 0,
        userRole: org.organization_members[0]?.role || 'member',
        userStatus: org.organization_members[0]?.status || 'pending',
        isCreator: org.created_by === user.id
      }));

      setOrganizations(orgsWithUserInfo);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المنظمات",
        variant: "destructive",
      });
    }
  }, [user, toast]);



  // Set membership info based on selected organization
  const updateMembershipInfo = useCallback((org: Organization) => {
    setIsExistingMember(!!org.userRole);
    setMembershipStatus(org.userStatus as 'active' | 'pending' | null);
    setWouldBecomeAdmin(org.userRole === 'admin' || org.isCreator || false);
  }, []);



  // Handle organization selection from cards
  const selectOrganization = useCallback((org: Organization) => {
    setSelectedOrg(org);
    updateMembershipInfo(org);
  }, [updateMembershipInfo]);



  // Load user organizations on mount
  useEffect(() => {
    fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  // Handle entering organization
  const handleEnterOrganization = async () => {
    if (!user || !selectedOrg) return;

    setLoading(true);
    try {
      // Update user profile with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: selectedOrg.id })
        .eq('user_id', user.id);

      if (profileError) {
        console.warn('Error updating profile:', profileError);
      }

      // Save organization selection to localStorage
      localStorage.setItem('selected_organization', JSON.stringify({
        id: selectedOrg.id,
        name: selectedOrg.name,
        slug: selectedOrg.slug,
        userRole: selectedOrg.userRole,
        userStatus: selectedOrg.userStatus,
        timestamp: Date.now()
      }));

      const welcomeMessage = selectedOrg.userStatus === 'pending' 
        ? `دخول ${selectedOrg.name} بوصول محدود...`
        : `مرحباً بك في ${selectedOrg.name}`;

      toast({
        title: selectedOrg.userStatus === 'pending' ? "تم منح الوصول المحدود" : "مرحباً بعودتك",
        description: welcomeMessage,
      });

      // Refresh organization data before completing onboarding
      await refetchOrganization();
      
      // Complete onboarding which will redirect to appropriate dashboard
      onComplete();
    } catch (error) {
      console.error('Error entering organization:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle organization name change
  const handleNameChange = (name: string) => {
    setNewOrgData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  // Create new organization
  const createOrganization = async () => {
    if (!user || !newOrgData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المنظمة.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Keep session intact; do not clear storage here to avoid losing auth session

      // Check if organization name already exists
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('name')
        .eq('name', newOrgData.name.trim())
        .maybeSingle();

      if (existingOrg) {
        toast({
          title: "اسم المنظمة موجود بالفعل",
          description: "يرجى اختيار اسم آخر للمنظمة.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Generate unique slug to avoid conflicts
      const { data: uniqueSlugData, error: slugError } = await supabase.rpc('generate_unique_slug', {
        base_slug: newOrgData.slug
      });

      if (slugError) {
        console.error('Error generating unique slug:', slugError);
        throw slugError;
      }

      // Create organization via secure RPC to bypass RLS safely
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_organization_with_admin', {
        org_name: newOrgData.name.trim(),
        org_slug: uniqueSlugData,
        org_description: newOrgData.description.trim() || null,
      });

      if (rpcError || !rpcData) {
        console.error('Organization creation error:', rpcError);
        throw rpcError || new Error('Failed to create organization');
      }

      const orgData = rpcData as any;

      console.log('Organization created successfully:', orgData);

      // The organization creation trigger will automatically:
      // 1. Add user as admin member
      // 2. Create admin permissions
      // So we don't need to do it manually here

      console.log('Organization setup complete');

      // Verify the membership was created by the trigger
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgData.id)
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membershipData) {
        console.error('Membership not found, creating manually:', membershipError);
        // Fallback: create membership manually if trigger failed
        const { error: manualMembershipError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: orgData.id,
            user_id: user.id,
            role: 'admin',
            status: 'active'
          });
        
        if (manualMembershipError) {
          console.error('Failed to create membership manually:', manualMembershipError);
          throw manualMembershipError;
        }
      } else {
        console.log('Membership verified:', membershipData);
      }

      // Update user profile to use the new organization (switch to it)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgData.id })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw here, just warn as it's not critical for org creation
      } else {
        console.log('Profile updated successfully');
      }

      // Save organization selection to localStorage
      localStorage.setItem('selected_organization', JSON.stringify({
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        userRole: 'admin',
        userStatus: 'active',
        timestamp: Date.now()
      }));

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء منظمة "${orgData.name}" بنجاح`,
      });

      // Refresh organization data and complete onboarding
      await refetchOrganization();
      
      // Small delay to ensure all operations complete and data is refreshed
      setTimeout(async () => {
        // Double-check organization data is loaded before completing
        await refetchOrganization();
        onComplete();
      }, 1000);

    } catch (error: any) {
      console.error('Error creating organization:', error);
      
      let errorMessage = "فشل في إنشاء المنظمة";
      
      if (error?.code === '23505') {
        errorMessage = "اسم المنظمة موجود بالفعل";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get role display text in Arabic
  const getRoleText = (role: string, isCreator: boolean) => {
    if (isCreator) return "المنشئ";
    switch (role) {
      case 'admin': return "مدير";
      case 'member': return "عضو";
      default: return "عضو";
    }
  };
  
  // Get status display text in Arabic
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return "نشط";
      case 'pending': return "في الانتظار";
      default: return "غير محدد";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">مرحباً بك</CardTitle>
          <p className="text-muted-foreground">
            اختر المنظمة التي تريد الدخول إليها
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "select" ? (
            <>
              <div className="space-y-4">
                {organizations.length > 0 ? (
                  <>
                    <Label className="text-base font-semibold">منظماتك</Label>
                    <div className="grid gap-3 max-h-96 overflow-y-auto">
                      {organizations.map((org) => (
                        <Card 
                          key={org.id} 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedOrg?.id === org.id 
                              ? 'ring-2 ring-primary border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => selectOrganization(org)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg">{org.name}</h3>
                                  {org.isCreator && (
                                    <Crown className="h-4 w-4 text-amber-500" />
                                  )}
                                  {selectedOrg?.id === org.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>{org.memberCount} عضو</span>
                                  </div>
                                  
                                  {org.userRole && (
                                    <div className="flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      <span>{getRoleText(org.userRole, org.isCreator || false)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                {org.userStatus && (
                                  <Badge 
                                    variant={org.userStatus === 'active' ? 'default' : 'secondary'}
                                    className={`text-xs ${
                                      org.userStatus === 'active' 
                                        ? 'bg-green-100 text-green-800 border-green-200' 
                                        : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {org.userStatus === 'pending' && (
                                      <Clock className="h-3 w-3 mr-1" />
                                    )}
                                    {getStatusText(org.userStatus)}
                                  </Badge>
                                )}
                                
                                {org.isCreator && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    منشئ المنظمة
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {selectedOrg && (
                      <Button 
                        onClick={handleEnterOrganization}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            جاري الدخول...
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 mr-2" />
                            دخول إلى {selectedOrg.name}
                          </>
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">لا توجد منظمات</h3>
                    <p className="text-muted-foreground mb-4">إنشاء منظمة جديدة بسرعة:</p>
                    <QuickOrgCreator onSuccess={onComplete} />
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep("create")}
                  className="flex-1"
                  size="lg"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  إنشاء منظمة جديدة
                </Button>
                <OrganizationCleaner />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">اسم المنظمة *</Label>
                  <Input
                    id="orgName"
                    value={newOrgData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="أدخل اسم المنظمة"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="orgSlug">معرف المنظمة</Label>
                  <Input
                    id="orgSlug"
                    value={newOrgData.slug}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="my-organization"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    معرف فريد للمنظمة يستخدم في الروابط
                  </p>
                </div>

                <div>
                  <Label htmlFor="orgDescription">الوصف</Label>
                  <Input
                    id="orgDescription"
                    value={newOrgData.description}
                    onChange={(e) => setNewOrgData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر للمنظمة"
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep("select")}
                    className="flex-1"
                    disabled={loading}
                  >
                    رجوع
                  </Button>
                  <Button 
                    onClick={createOrganization} 
                    disabled={!newOrgData.name.trim() || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-2" />
                        إنشاء المنظمة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}