import { Permission, StaffWithPermissions } from "@/type/membertype";
import { getCurrentUser } from "../auth/roles";
import { createSupabaseServerClient } from "../supbase/action";

export class PermissionManager{
    private async getSupabase(){
        return await createSupabaseServerClient();
    }

    async isAdmin(): Promise<boolean> {
        const currentUser = await getCurrentUser();
        if(currentUser?.role === 'admin'){
            return true;
        }else{
            return false;
        }
    }

    async hasPermission(code: string): Promise<boolean>{
        const supabase = await this.getSupabase();

        const {data: {user}} = await supabase.auth.getUser();
        if(!user) return false;

        const {data} = await supabase.rpc('has_permission', {
            user_id: user.id,
            perm_code: code,
        });
        return !!data;
    }

    async getUserPermissions(): Promise<Permission[]> {
        const supabase = await this.getSupabase();

        const {data: {user}} = await supabase.auth.getUser();
        if(!user) return [];

        const {data: member} = await supabase
        .from("member")
        .select("staff_id")
        .eq("auth_id", user.id)
        .single();

        if(!member?.staff_id) return[];

        const {data} = await supabase
        .from('staff_permission')
        .select(`
            permission_table(
            permission_id,
            permission_name,
            code,
            module,
            description
            )
        `)
        .eq('staff_id', member.staff_id);

        return data?.map(d => d.permission_table).flat() || [];
    }

    //Get All Available Permissions(admin only)
    async getAllPermissions(): Promise<Permission[]>{
        const supabase = await this.getSupabase();

        const {data} = await supabase
        .from("permission_table")
        .select("*")
        .order('module', {ascending: true});

        return data || [];
    }

    //Get Staff with their permissions
    async getStaffWithPermissions(staffId: string): Promise<StaffWithPermissions | null> {
        const supabase = await this.getSupabase();
        const {data: staff} = await supabase
        .from('staff')
        .select('*')
        .eq('staff_id', staffId)
        .single();

        if(!staff) return null;

        const {data: permissions} = await supabase
        .from('staff_permission')
        .select(`
        permission_table (
          permission_id,
          permission_name,
          code,
          module,
          description
        )
      `)
      .eq('staff_id', staffId);

      return {
        ...staff,
        permissions: permissions?.map(p => p.permission_table).flat() || []
      }
    }

    //Update staff permissions(admins only)
    async updateStaffPermissions(
        staffId: string,
        permissionIds: string[]
    ): Promise<boolean>{
        const supabase = await this.getSupabase();

        //deleting existing permissions
        await supabase
        .from('staff_permission')
        .delete()
        .eq('staff_id', staffId);

        //Handle Empty array case
        if(permissionIds.length === 0){
            return true;
        }

        //Insert new permissions
        const {error} = await supabase
        .from('staff_permission')
        .insert(
        permissionIds.map(permissionId => ({
            staff_id: staffId,
            permission_id: permissionId
        }))
        );

        return !error;
    }

    //Update Permissions for all staff
    async bulkUpdateAllStaffPermissions(permissionIds: string[]): Promise<boolean>{
        const supabase = await this.getSupabase();


        //Get All Staff 
        const {data: allStaff} = await supabase
        .from('staff')
        .select('staff_id');

        if(!allStaff || allStaff.length === 0) return false;

        //Deleting all existing permissions
        await supabase
        .from('staff_permission')
        .delete()
        .in('staff_id', allStaff.map(s => s.staff_id));


        //Handle empty array case
        if(permissionIds.length === 0){
            return true;
        }

        //Insert new permissions for all staff
        const permissionsToInsert = allStaff.flatMap(staff => 
            permissionIds.map(permissionId => ({
                staff_id: staff.staff_id,
                permission_id: permissionId,
            }))
        );


        const { error } = await supabase
        .from('staff_permission')
        .insert(permissionsToInsert);

        return !error;
    }

    //Get All staff with their permissions (admin only)
    async getAllStaffWithPermissions(): Promise<StaffWithPermissions[]>{
        const supabase = await this.getSupabase();

        const{data: allStaff} = await supabase
        .from('staff')
        .select('*');

        if(!allStaff) return [];

        const staffWithPermissions = await Promise.all(
            allStaff.map(async (staff) => {
                const { data: permissions } = await supabase
          .from('staff_permission')
          .select(`
            permission_table (
              permission_id,
              permission_name,
              code,
              module,
              description
            )
          `)
          .eq('staff_id', staff.staff_id);

          return {
            ...staff,
            permissions: permissions?.map(p => p.permission_table).flat() || []
          }
            })
        )

        return staffWithPermissions;
    }
}