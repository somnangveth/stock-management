'use client';

import { createSupabaseBrowserClient } from '@/lib/storage/browser';
import { useEffect, useState, useCallback } from 'react';

// Correct type definition matching the actual Supabase response structure
type PermissionData = {
  permission_default: {
    permission_table: {
      code: string;
    };
  };
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPermissions([]);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if admin
      const { data: member } = await supabase
        .from('member')
        .select('admin_id, staff_id')
        .eq('auth_id', user.id)
        .single();

      if (member?.admin_id) {
        setIsAdmin(true);
        setPermissions([]);
        setLoading(false);
        return; // Admins have all permissions
      }

      setIsAdmin(false);

      // Get staff permissions with correct join path
      if (member?.staff_id) {
        const { data: permissionData, error } = await supabase
          .from('staff_permission')
          .select(`
            permission_default!inner (
              permission_table!inner (
                code
              )
            )
          `)
          .eq('staff_id', member.staff_id);

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions([]);
        } else if (permissionData) {
          // Extract codes from the nested structure
          const codes = permissionData
            .map((item: any) => item.permission_default?.permission_table?.code)
            .filter((code): code is string => typeof code === 'string');
          
          setPermissions(codes);
          console.log('Loaded permissions:', codes);
        } else {
          setPermissions([]);
        }
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    
    loadPermissions();

    // Listen for auth changes to refresh permissions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        loadPermissions();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPermissions]);

  const hasPermission = (code: string): boolean => {
    return isAdmin || permissions.includes(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    return isAdmin || codes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (codes: string[]): boolean => {
    return isAdmin || codes.every(code => permissions.includes(code));
  };

  const refetch = () => {
    setLoading(true);
    loadPermissions();
  };

  return {
    permissions,
    isAdmin,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch,
  };
}