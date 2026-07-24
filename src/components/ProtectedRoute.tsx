import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { usePermissions, UserPermissions } from '../hooks/usePermissions';
import { AuthPage } from "@/components/AuthPage";
import { Onboarding } from "@/components/Onboarding";
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  requiredPermissions?: (keyof UserPermissions)[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const AccessDeniedCard: React.FC<{ permission?: string; permissions?: string[] }> = ({ 
  permission, 
  permissions 
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <Lock className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground text-center mb-4">
          You don't have permission to access this page or feature.
        </p>
        {permission && (
          <Alert className="w-full">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Required permission: <code className="font-mono text-sm">{permission}</code>
            </AlertDescription>
          </Alert>
        )}
        {permissions && permissions.length > 0 && (
          <Alert className="w-full">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Required permissions: {permissions.map(p => (
                <code key={p} className="font-mono text-sm">{p}</code>
              )).join(', ')}
            </AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mt-4">
          Contact your administrator to request access.
        </p>
      </CardContent>
    </Card>
  </div>
);

export function ProtectedRoute({ 
  children, 
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/dashboard',
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { membership, pendingMembership, loading: orgLoading } = useOrganization();
  const { permissions, loading: permissionsLoading, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(membership?.organization_id);

  if (authLoading || orgLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => window.location.reload()} />;
  }

  // If user has no membership at all, redirect to onboarding
  if (!membership && !pendingMembership) {
    return (
      <Onboarding 
        onComplete={() => {
          // Refresh the page to re-evaluate membership status
          window.location.reload();
        }} 
      />
    );
  }

  // If user has pending membership, allow access but don't check permissions yet
  if (pendingMembership && !membership) {
    return <>{children}</>;
  }

  // Check permissions only for active members
  if (membership && membership.status === 'active') {
    // Check single permission
    if (requiredPermission) {
      const hasAccess = hasPermission(requiredPermission);
      if (!hasAccess) {
        if (showAccessDenied) {
          return <AccessDeniedCard permission={requiredPermission} />;
        }
        return <Navigate to={fallbackPath} replace />;
      }
    }

    // Check multiple permissions
    if (requiredPermissions.length > 0) {
      const hasAccess = requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
      
      if (!hasAccess) {
        if (showAccessDenied) {
          return <AccessDeniedCard permissions={requiredPermissions} />;
        }
        return <Navigate to={fallbackPath} replace />;
      }
    }
  }

  // Allow users with pending membership to access the app with banner notification
  // Allow users with active membership to access the app normally
  return <>{children}</>;
}