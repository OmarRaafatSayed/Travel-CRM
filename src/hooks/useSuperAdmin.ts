import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useSuperAdmin() {
  const { user, profile } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user || !profile) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user has super_admin permission via user_roles
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, permissions')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking super admin status:', error);
        }

        setIsSuperAdmin(data?.role === 'super_admin' || data?.permissions?.includes('super_admin'));
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminStatus();
  }, [user, profile]);

  return { isSuperAdmin, loading };
}