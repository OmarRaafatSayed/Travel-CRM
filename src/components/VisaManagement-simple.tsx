import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';

type VisaStatusKey = 'status_docs' | 'status_review' | 'status_embassy' | 'status_consulate' | 'status_approved' | 'status_rejected' | 'status_cancelled';

const VISA_STATUS_COLORS: Record<VisaStatusKey, string> = {
  status_docs:       'bg-blue-500',
  status_review:     'bg-yellow-500',
  status_embassy:    'bg-purple-500',
  status_consulate:  'bg-orange-500',
  status_approved:   'bg-green-500',
  status_rejected:   'bg-red-500',
  status_cancelled:  'bg-gray-500',
};

const VISA_STATUS_KEYS = Object.keys(VISA_STATUS_COLORS) as VisaStatusKey[];

export function VisaManagement() {
  const { t } = useTranslation();
  const [applications] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('visa.title')}
          </CardTitle>
          <CardDescription>{t('visa.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('visa.newApp')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('visa.scheduleAppt')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader><CardTitle>{t('visa.overview')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {VISA_STATUS_KEYS.map((key, i) => (
              <div key={key} className="text-center">
                <div className={`w-8 h-8 ${VISA_STATUS_COLORS[key]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{t(`visa.${key}`)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader><CardTitle>{t('visa.searchApps')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">{t('visa.customerName')}</Label>
              <Input id="customerName" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportNumber">{t('visa.passport')}</Label>
              <Input id="passportNumber" placeholder="A1234567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">{t('visa.destination')}</Label>
              <Input id="destination" placeholder="United States" />
            </div>
          </div>
          <div className="mt-4">
            <Button>{t('visa.searchBtn')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('visa.appList')} ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('visa.noApps')}</p>
              <p className="text-sm mt-2">{t('visa.noAppsDesc')}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
