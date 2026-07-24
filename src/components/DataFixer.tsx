import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Wrench, Loader2 } from "lucide-react";

export function DataFixer() {
  const { user } = useAuth();
  const { refetchOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fixUserOrganization = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fixing user organization data...');

      // 1. Find organizations created by this user
      const { data: userOrgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('created_by', user.id);

      if (orgError) throw orgError;
      console.log('User organizations:', userOrgs);

      if (!userOrgs || userOrgs.length === 0) {
        toast({
          title: "لا توجد منظمات",
          description: "لم يتم العثور على منظمات مرتبطة بحسابك",
          variant: "destructive",
        });
        return;
      }

      // 2. For each organization, ensure user is added as admin member
      for (const org of userOrgs) {
        console.log(`Processing organization: ${org.name}`);

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', org.id)
          .eq('user_id', user.id)
          .single();

        if (!existingMember) {
          console.log(`Adding user as admin to ${org.name}`);
          
          // Add user as admin member
          const { error: memberError } = await supabase
            .from('organization_members')
            .insert([{
              organization_id: org.id,
              user_id: user.id,
              role: 'admin',
              status: 'active'
            }]);

          if (memberError) {
            console.error('Error adding member:', memberError);
            continue;
          }
        } else {
          console.log(`User already member of ${org.name}, updating status to active`);
          
          // Update existing membership to active admin
          const { error: updateError } = await supabase
            .from('organization_members')
            .update({
              role: 'admin',
              status: 'active'
            })
            .eq('organization_id', org.id)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating member:', updateError);
            continue;
          }
        }

        // 3. Update user profile to use the first organization
        if (userOrgs.indexOf(org) === 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ organization_id: org.id })
            .eq('user_id', user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          } else {
            console.log(`Profile updated to use ${org.name}`);
          }
        }
      }

      toast({
        title: "تم الإصلاح",
        description: `تم إصلاح البيانات لـ ${userOrgs.length} منظمة`,
      });

      // 4. Refresh organization data
      await refetchOrganization();

    } catch (error: any) {
      console.error('Error fixing data:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في إصلاح البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-card border border-border">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-foreground">إصلاح البيانات</CardTitle>
        <p className="text-muted-foreground text-sm">
          إصلاح مشكلة عدم القدرة على الدخول للمنظمات
        </p>
      </CardHeader>

      <CardContent>
        <Button 
          onClick={fixUserOrganization} 
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الإصلاح...
            </>
          ) : (
            <>
              <Wrench className="w-4 h-4 mr-2" />
              إصلاح البيانات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}