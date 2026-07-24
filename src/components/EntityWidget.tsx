import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Target, Briefcase, Building } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface EntityWidgetProps {
  entity: string;
  data: any;
  className?: string;
}

export function EntityWidget({ entity, data, className }: EntityWidgetProps) {
  const { t } = useTranslation();
  
  const getEntityIcon = () => {
    switch (entity) {
      case 'leads': return <User className="w-4 h-4" />;
      case 'deals': return <Target className="w-4 h-4" />;
      case 'projects': return <Briefcase className="w-4 h-4" />;
      case 'accounts': return <Building className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getEntityTitle = () => {
    const entityName = entity.charAt(0).toUpperCase() + entity.slice(1, -1);
    return `${entityName} ${t('common.create')}d`;
  };

  const formatValue = (key: string, value: any) => {
    if (key.includes('date') && value) {
      return new Date(value).toLocaleDateString();
    }
    if (key === 'value' && typeof value === 'number') {
      return `${value.toLocaleString()} EGP`;
    }
    return value?.toString() || 'N/A';
  };

  const getDisplayFields = () => {
    const excludeFields = ['id', 'created_at', 'updated_at', 'organization_id', 'user_id'];
    return Object.entries(data)
      .filter(([key]) => !excludeFields.includes(key) && data[key] !== null && data[key] !== '')
      .slice(0, 6); // Show max 6 fields
  };

  return (
    <Card className={`mt-2 border-l-4 border-l-green-500 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          {getEntityTitle()}
          <Badge variant="default" className="text-xs">
            {entity.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {getDisplayFields().map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="text-xs font-medium text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              </span>
              <span className="text-xs font-semibold">
                {formatValue(key, value)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
          {getEntityIcon()}
          {t('ai_assistant.entity_creation.added_to_crm')}
        </div>
      </CardContent>
    </Card>
  );
}