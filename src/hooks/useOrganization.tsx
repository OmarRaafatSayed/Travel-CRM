import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string; // Change this to string to match database
  created_by: string;
  created_at: string;
  updated_at: string;
  settings?: any;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by?: string;
  joined_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  membership: OrganizationMember | null;
  pendingMembership: OrganizationMember | null;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  refetchOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [pendingMembership, setPendingMembership] = useState<OrganizationMember | null>(null);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrganizationData = async () => {
    if (!user) {
      setOrganization(null);
      setMembership(null);
      setPendingMembership(null);
      setIsOrgAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check if user is super admin by email
      const hasSuperAdminPermission = true; // TEMP: allow all users
      console.log('Checking super admin:', user.email, 'isSuperAdmin:', hasSuperAdminPermission);
      setIsSuperAdmin(hasSuperAdminPermission);

      // Get all organization memberships (active and pending)
      const { data: allMemberships } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id);

      // Separate active and pending memberships
      const activeMemberships = allMemberships?.filter(m => m.status === 'active') || [];
      const pendingMembershipData = allMemberships?.find(m => m.status === 'pending') || null;

      setPendingMembership(pendingMembershipData);

      // Select the primary membership based on profile preference ONLY
      let primaryMembership = null;
      if (activeMemberships && activeMemberships.length > 0) {
        // ONLY use membership matching profile organization_id
        if (profile?.organization_id) {
          primaryMembership = activeMemberships.find(m => m.organization_id === profile.organization_id);
        }
        // Don't fallback to first membership - let user choose
      }

      setMembership(primaryMembership);
      setIsOrgAdmin(primaryMembership?.role === 'admin' || primaryMembership?.role === 'owner');

      // Get organization details if user has active membership
      if (primaryMembership) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', primaryMembership.organization_id)
          .maybeSingle();

        if (orgData) {
          setOrganization(orgData);
        } else {
          setOrganization(null);
        }
      } else {
        // No active membership means no organization access
        setOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationData();
  }, [user, profile]);

  const refetchOrganization = async () => {
    setLoading(true);
    await fetchOrganizationData();
  };

  const value = {
    organization,
    membership,
    pendingMembership,
    isOrgAdmin,
    isSuperAdmin,
    loading,
    refetchOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}