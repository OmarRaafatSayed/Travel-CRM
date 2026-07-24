import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, HardDrive, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StorageManager() {
  const { toast } = useToast();
  const [storageInfo, setStorageInfo] = useState<{
    localStorage: number;
    sessionStorage: number;
    indexedDB: number;
  } | null>(null);

  const calculateStorageSize = async () => {
    try {
      // Calculate localStorage size
      let localStorageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length;
        }
      }

      // Calculate sessionStorage size
      let sessionStorageSize = 0;
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          sessionStorageSize += sessionStorage[key].length + key.length;
        }
      }

      // Estimate IndexedDB size (simplified)
      let indexedDBSize = 0;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        indexedDBSize = estimate.usage || 0;
      }

      setStorageInfo({
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        indexedDB: indexedDBSize
      });

    } catch (error) {
      console.error('Error calculating storage:', error);
      toast({
        title: "خطأ",
        description: "فشل في حساب حجم البيانات المخزنة",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearSpecificStorage = async (type: 'localStorage' | 'sessionStorage' | 'indexedDB') => {
    try {
      switch (type) {
        case 'localStorage':
          localStorage.clear();
          break;
        case 'sessionStorage':
          sessionStorage.clear();
          break;
        case 'indexedDB':
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
          break;
      }

      toast({
        title: "تم المسح",
        description: `تم مسح ${type} بنجاح`,
      });

      // Recalculate storage
      await calculateStorageSize();

    } catch (error) {
      console.error(`Error clearing ${type}:`, error);
      toast({
        title: "خطأ",
        description: `فشل في مسح ${type}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-xl">إدارة البيانات المخزنة</CardTitle>
            <p className="text-muted-foreground text-sm">
              عرض وإدارة البيانات المحفوظة في المتصفح
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <Button onClick={calculateStorageSize} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            حساب حجم البيانات
          </Button>
        </div>

        {storageInfo && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* localStorage */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Local Storage</span>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(storageInfo.localStorage)}
                  </Badge>
                </div>
                <Button 
                  onClick={() => clearSpecificStorage('localStorage')}
                  size="sm" 
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  مسح
                </Button>
              </Card>

              {/* sessionStorage */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Session Storage</span>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(storageInfo.sessionStorage)}
                  </Badge>
                </div>
                <Button 
                  onClick={() => clearSpecificStorage('sessionStorage')}
                  size="sm" 
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  مسح
                </Button>
              </Card>

              {/* IndexedDB */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">IndexedDB</span>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(storageInfo.indexedDB)}
                  </Badge>
                </div>
                <Button 
                  onClick={() => clearSpecificStorage('indexedDB')}
                  size="sm" 
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  مسح
                </Button>
              </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              إجمالي البيانات المخزنة: {formatBytes(
                storageInfo.localStorage + 
                storageInfo.sessionStorage + 
                storageInfo.indexedDB
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}