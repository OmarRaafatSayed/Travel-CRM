import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Loader2 } from "lucide-react";

interface QuickOrgCreatorProps {
  onSuccess: () => void;
}

export function QuickOrgCreator({ onSuccess }: QuickOrgCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState("ww");

  const createQuickOrg = async () => {
    if (!user || !orgName.trim()) return;

    setLoading(true);
    try {
      // Use secure RPC to bypass RLS and create org + admin membership atomically
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_organization_with_admin' as any, {
        org_name: orgName.trim(),
        org_slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        org_description: null
      });

      if (rpcError || !rpcResult) throw rpcError || new Error('فشل في إنشاء المنظمة');

      const created = rpcResult as any;

      // Profile is updated by RPC, but update again in case
      await supabase
        .from('profiles')
        .update({ organization_id: created.id })
        .eq('user_id', user.id);

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء منظمة "${created.name}"`,
      });

      onSuccess();

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء المنظمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="اسم المنظمة"
        className="flex-1"
      />
      <Button 
        onClick={createQuickOrg}
        disabled={loading || !orgName.trim()}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Building2 className="w-4 h-4 mr-2" />
            إنشاء
          </>
        )}
      </Button>
    </div>
  );
}