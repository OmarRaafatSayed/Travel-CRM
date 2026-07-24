import React from 'react';
import { usePermissions, UserPermissions } from '../hooks/usePermissions';
import { useOrganization } from '@/hooks/useOrganization';

interface PermissionGateProps {
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  organizationId?: string;
}

/**
 * PermissionGate component for conditionally rendering content based on user permissions
 * 
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @param children - Content to render if user has required permissions
 * @param fallback - Content to render if user doesn't have required permissions
 * @param organizationId - Optional organization ID, will use current organization if not provided
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  children,
  fallback = null,
  organizationId,
}) => {
  const { membership } = useOrganization();
  const orgId = organizationId || membership?.organization_id;
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions(orgId);

  if (loading) return null;

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for protecting components with permissions
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: keyof UserPermissions,
  requiredPermissions?: (keyof UserPermissions)[],
  requireAll = false
) => {
  return (props: P & { organizationId?: string }) => {
    return (
      <PermissionGate
        permission={requiredPermission}
        permissions={requiredPermissions}
        requireAll={requireAll}
        organizationId={props.organizationId}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
};

// Hook for conditional rendering based on permissions
export const useConditionalRender = (organizationId?: string) => {
  const { membership } = useOrganization();
  const orgId = organizationId || membership?.organization_id;
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions(orgId);

  const renderIfPermission = (
    permission: keyof UserPermissions,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    if (loading) return null;
    return hasPermission(permission) ? component : (fallback || null);
  };

  const renderIfAnyPermission = (
    permissions: (keyof UserPermissions)[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    if (loading) return null;
    return hasAnyPermission(permissions) ? component : (fallback || null);
  };

  const renderIfAllPermissions = (
    permissions: (keyof UserPermissions)[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    if (loading) return null;
    return hasAllPermissions(permissions) ? component : (fallback || null);
  };

  return {
    renderIfPermission,
    renderIfAnyPermission,
    renderIfAllPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
  };
};