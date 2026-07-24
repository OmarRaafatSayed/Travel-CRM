import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, Settings, RefreshCw } from "lucide-react";
import { DataCleaner } from "@/components/DataCleaner";
import { StorageManager } from "@/components/StorageManager";

interface Organization {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

export function OrganizationSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    }
  }, [user]);

  const fetchUserOrganizations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          organizations (
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const orgs = data?.map(item => ({
        id: item.organizations.id,
        name: item.organizations.name,
        description: item.organizations.description,
      })) || [];

      setOrganizations(orgs);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المنظمات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = async (orgId: string) => {
    try {
      // Update user profile with selected organization
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "تم الاختيار",
        description: "تم اختيار المنظمة بنجاح",
      });

      // Navigate to dashboard instead of reload
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Error selecting organization:', error);
      toast({
        title: "خطأ",
        description: "فشل في اختيار المنظمة",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل المنظمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            اختر المنظمة التي تريد الدخول إليها
          </h1>
          <p className="text-muted-foreground">
            اختر المنظمة للوصول إلى لوحة التحكم والبيانات الخاصة بها
          </p>
        </div>

        {organizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {organizations.map((org) => (
              <Card key={org.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      {org.description && (
                        <p className="text-sm text-muted-foreground">{org.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>منظمة نشطة</span>
                    </div>
                    <Button 
                      onClick={() => selectOrganization(org.id)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      دخول
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد منظمات</h3>
            <p className="text-muted-foreground mb-6">
              لم يتم العثور على منظمات مرتبطة بحسابك
            </p>
            <Button onClick={fetchUserOrganizations} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة تحميل
            </Button>
          </div>
        )}

        {/* Data Management Section */}
        <div className="border-t border-border pt-8 space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">إدارة البيانات</h2>
            <p className="text-muted-foreground">
              إذا كنت تواجه مشاكل في الوصول أو تريد رؤية آخر التحديثات
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataCleaner />
            <StorageManager />
          </div>
        </div>
      </div>
    </div>
  );
}