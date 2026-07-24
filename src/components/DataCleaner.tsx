import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Loader2, RefreshCw } from "lucide-react";

export function DataCleaner() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const clearAllData = async () => {
    setLoading(true);
    try {
      // 1. مسح جلسة المصادقة
      await supabase.auth.signOut();
      
      // 2. مسح localStorage
      localStorage.clear();
      
      // 3. مسح sessionStorage
      sessionStorage.clear();
      
      // 4. مسح IndexedDB (إذا كان يستخدم)
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

      toast({
        title: "تم مسح البيانات",
        description: "تم مسح جميع البيانات المحفوظة محلياً. سيتم إعادة تحميل الصفحة...",
      });

      // 5. إعادة تحميل الصفحة لإظهار آخر التحديثات
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error: any) {
      console.error('Error clearing data:', error);
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
    <Card className="max-w-md mx-auto bg-card border border-border">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-xl text-foreground">مسح البيانات المحفوظة</CardTitle>
        <p className="text-muted-foreground text-sm">
          امسح جميع البيانات المحفوظة محلياً لرؤية آخر التحديثات من الخادم
        </p>
      </CardHeader>

      <CardContent>
        <Button 
          onClick={clearAllData} 
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري المسح...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              مسح البيانات وإعادة التشغيل
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}