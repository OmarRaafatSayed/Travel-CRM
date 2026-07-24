import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Loader2 } from "lucide-react";

export function OrganizationCleaner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const clearAllOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Delete all organizations created by user
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('created_by', user.id);

      if (error) throw error;

      // Clear all stored data
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: "تم المسح",
        description: "تم مسح جميع المنظمات والبيانات",
      });

      // Reload page
      window.location.reload();

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في مسح المنظمات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={clearAllOrganizations}
      disabled={loading}
      variant="destructive"
      size="sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 mr-2" />
      )}
      مسح جميع المنظمات
    </Button>
  );
}