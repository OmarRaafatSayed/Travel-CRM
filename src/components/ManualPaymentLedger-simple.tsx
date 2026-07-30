import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Receipt, CreditCard } from 'lucide-react';

type PaymentStatusKey =
  | 'status_pending'
  | 'status_partial'
  | 'status_full'
  | 'status_refunded'
  | 'status_cancelled';

type PaymentMethodKey =
  | 'method_cash'
  | 'method_bank'
  | 'method_pos'
  | 'method_cheque';

const STATUS_COLORS: Record<PaymentStatusKey, string> = {
  status_pending:   'bg-yellow-500',
  status_partial:   'bg-blue-500',
  status_full:      'bg-green-500',
  status_refunded:  'bg-purple-500',
  status_cancelled: 'bg-red-500',
};

const STATUS_KEYS  = Object.keys(STATUS_COLORS) as PaymentStatusKey[];
const METHOD_KEYS: PaymentMethodKey[] = ['method_cash', 'method_bank', 'method_pos', 'method_cheque'];

export function ManualPaymentLedger() {
  const { t } = useTranslation();
  const [payments] = useState<any[]>([]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('payments.title')}
          </CardTitle>
          <CardDescription>{t('payments.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('payments.record')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {t('payments.invoice')}
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('payments.report')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader><CardTitle>{t('payments.overview')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {STATUS_KEYS.map(key => (
              <div key={key} className="text-center">
                <div className={`w-12 h-12 ${STATUS_COLORS[key]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">{t(`payments.${key}`)}</Badge>
                <p className="text-sm text-muted-foreground mt-1">0 {t('payments.count')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader><CardTitle>{t('payments.search')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerSearch">{t('payments.customerName')}</Label>
              <Input id="customerSearch" placeholder="…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingRef">{t('payments.bookingRef')}</Label>
              <Input id="bookingRef" placeholder="BK-12345" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t('payments.method')}</Label>
              <select
                id="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('payments.allMethods')}</option>
                {METHOD_KEYS.map(key => (
                  <option key={key} value={key}>{t(`payments.${key}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRange">{t('payments.dateRange')}</Label>
              <Input id="dateRange" type="date" />
            </div>
          </div>
          <div className="mt-4">
            <Button>{t('payments.searchBtn')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payments.list')} ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('payments.noPayments')}</p>
              <p className="text-sm mt-2">{t('payments.noPaymentsDesc')}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
