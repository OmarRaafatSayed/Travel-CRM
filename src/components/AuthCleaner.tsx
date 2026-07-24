import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Loader2 } from "lucide-react";

export function AuthCleaner() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const clearAuthData = async () => {
    setLoading(true);
    try {
      // Sign out current user
      await supabase.auth.signOut();
      
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve(void 0);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      }

      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      toast({
        title: "تم المسح",
        description: "تم مسح جميع بيانات تسجيل الدخول",
      });

      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في مسح البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={clearAuthData}
      disabled={loading}
      variant="destructive"
      className="w-full"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 mr-2" />
      )}
      مسح بيانات تسجيل الدخول
    </Button>
  );
}