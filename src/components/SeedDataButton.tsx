import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { seedOrganizationData } from '@/lib/seedData';
import { Database, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function SeedDataButton() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    if (!organization || !user) {
      toast({
        title: t('common.error'),
        description: 'Organization or user not found',
        variant: 'destructive',
      });
      return;
    }

    setIsSeeding(true);
    try {
      const result = await seedOrganizationData({
        organizationId: organization.id,
        organizationName: organization.name,
        userId: user.id,
      });

      toast({
        title: t('common.success'),
        description: `${t('common.sample_data_created')} 
        • ${result.accounts} Accounts
        • ${result.leads} Leads  
        • ${result.deals} Deals
        • ${result.projects} Projects
        • ${result.invoices} Invoices
        • ${result.contentPlans} Content Plans`,
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to create sample data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isSeeding}
          className="gap-2"
        >
          {isSeeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {isSeeding ? t('common.creating') : t('common.seed_data')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.seed_data')}</AlertDialogTitle>
          <AlertDialogDescription>
            This will create sample data for your organization including:
            <br />
            <br />
            • <strong>10 Accounts</strong> - Various companies across different industries
            <br />
            • <strong>15 Leads</strong> - Potential customers with different statuses
            <br />
            • <strong>12 Deals</strong> - Sales opportunities in various stages
            <br />
            • <strong>8 Projects</strong> - Active and completed projects
            <br />
            • <strong>6 Invoices</strong> - Sample billing records
            <br />
            • <strong>10 Content Plans</strong> - Marketing content across platforms
            <br />
            <br />
            All data will be properly linked with relationships and assigned to your organization.
            <br />
            <br />
            <strong>Note:</strong> This action cannot be undone. The sample data will be mixed with your existing data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleSeedData} disabled={isSeeding}>
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('common.creating')} Sample Data...
              </>
            ) : (
              t('common.seed_data')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}