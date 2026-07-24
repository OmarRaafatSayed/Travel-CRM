import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Navigate } from "react-router-dom";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user } = useAuth();
  const { isSuperAdmin, loading } = useOrganization();

  console.log('SuperAdminRoute - user:', user?.email, 'isSuperAdmin:', isSuperAdmin, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    console.log('Access denied - redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Super admin access granted');
  return <>{children}</>;
}