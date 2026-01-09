"use server";
import { createSupabaseServerClient } from "../supbase/action";

export async function checkPermission(permissionCode: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  
  //CHECK AUTH USER DATA
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('1. User check:', { userId: user?.id, authError });
  
  if (authError || !user) {
    console.log('❌ No user authenticated');
    return false;
  }

  // Get staff_id from member table using auth_id
  const { data: member, error: memberError } = await supabase
    .from('member')
    .select('staff_id')
    .eq('auth_id', user.id)
    .single();

  console.log('2. Member check:', { member, memberError });

  if (!member || !member.staff_id || memberError) {
    console.log('❌ No staff member found for auth_id:', user.id);
    return false;
  }

  // Get permission from permission_table using code
  const { data: permission, error: permError } = await supabase
    .from('permission_table')
    .select('permission_id')
    .eq('code', permissionCode)
    .single();

  console.log('3. Permission lookup:', { 
    permissionCode, 
    permission, 
    permError 
  });

  if (!permission || permError) {
    console.log('❌ Permission code not found:', permissionCode);
    return false;
  }

  // Get permission_default_id
  const { data: permissionDefault, error: pdError } = await supabase
    .from('permission_default')
    .select('permission_default_id')
    .eq('permission_id', permission.permission_id)
    .single();

  console.log('4. Permission default lookup:', { 
    permissionDefault, 
    pdError 
  });

  if (!permissionDefault || pdError) {
    console.log('❌ Permission default not found');
    return false;
  }

  // Check if this staff has this permission
  const { data: staffPermission, error: spError } = await supabase
    .from('staff_permission')
    .select('staff_permission_id')
    .eq('staff_id', member.staff_id)
    .eq('permission_default_id', permissionDefault.permission_default_id)
    .maybeSingle();

  console.log('5. Staff permission check:', { 
    staffId: member.staff_id, 
    permissionDefaultId: permissionDefault.permission_default_id,
    staffPermission, 
    spError 
  });

  const hasPermission = !!staffPermission;
  console.log('6. ✅ Final result:', hasPermission);
  
  return hasPermission;
}

export async function requirePermission(permissionCode: string) {
  const hasPermission = await checkPermission(permissionCode);
  
  if (!hasPermission) {
    throw new Error(`Unauthorized: Missing permission '${permissionCode}'`);
  }
}

export async function getUserPermissions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get staff_id from member table
  const { data: member } = await supabase
    .from('member')
    .select('staff_id')
    .eq('auth_id', user.id)
    .single();

  if (!member || !member.staff_id) {
    return [];
  }

  // Get all permission codes for this staff
  const { data: staffPermissions } = await supabase
    .from('staff_permission')
    .select(`
      permission_default_id,
      permission_default!inner (
        permission_id,
        permission_table!inner (
          code
        )
      )
    `)
    .eq('staff_id', member.staff_id);

  return staffPermissions?.map((sp: any) => sp.permission_default.permission_table.code) || [];
}