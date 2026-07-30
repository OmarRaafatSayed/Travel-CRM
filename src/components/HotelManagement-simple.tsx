import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, FileSpreadsheet, Hotel } from 'lucide-react';

export function HotelManagement() {
  const { t } = useTranslation();
  const [hotels] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            {t('hotels.title')}
          </CardTitle>
          <CardDescription>{t('hotels.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('hotels.addManual')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('hotels.uploadExcel')}
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t('hotels.downloadTemplate')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
