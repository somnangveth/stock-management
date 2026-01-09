"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";


//Fetching Permission Table Data
export async function fetchPermission() {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { data: permissionData, error: permissionError } = await supabase
      .from("permission_table")
      .select("*");
    
    if (permissionError) {
      console.error("Failed to fetch permission data:", permissionError.message);
      throw permissionError; // Throw the actual error object
    }
    
    return permissionData;
  } catch (error) {
    console.error("Error fetching permission table:", error);
    throw error;
  }
}

//Fetch permission default
export async function fetchPermissionDefault(){
    const supabase = await createSupabaseAdmin();
    try{
        const {data: permissionDefault, error: permissionError} = await supabase
        .from("permission_default")
        .select('*');

        if(permissionError){
            console.error("Failed to fetch permission default table", permissionError);
            throw new Error("Error to fetch");
        }
        return permissionDefault;
    }catch(error){
        console.error("Failed to fetch permission default data", error);
        throw error;
    }
}

//fetch Staff Permission table
export async function fetchStaffPermissions(staff_id: string){
    const supabase = await createSupabaseAdmin();
    try{
        const {data: staffPermissionData, error: staffPermissionError} = await supabase
        .from("staff_permission")
        .select("staff_id")
        .eq("staff_id", staff_id);

        if(staffPermissionError || !staffPermissionData){
            console.error("Failed to fetch staff permission data", staffPermissionError);
            throw new Error("Failed to fetch");
        }

        return staffPermissionData;
    }catch(error){

    }
}
// Updating staff permission for all staffs
export async function updateAllStaffPermission(selectedPermissionIds: string[]){
    const supabase = await createSupabaseAdmin();
    try{
        //1. Get all staff IDs 
        const {data: allStaff, error: staffError} = await supabase
            .from("staff")
            .select("staff_id");
        
        if(staffError){
            console.error("Failed to fetch staff: ", staffError);
            throw new Error("Error fetching staff");
        }

        if(!allStaff || allStaff.length === 0){
            console.warn("No staff found");
            return [];
        }
        
        //2. Delete ALL existing staff permissions (complete wipe)
        const {error: deleteError} = await supabase
            .from("staff_permission")
            .delete()
            .neq('staff_permission_id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows
        
        if(deleteError){
            console.error("Failed to delete existing staff permissions: ", deleteError);
            throw new Error("Error deleting existing permissions");
        }
        
        //3. Prepare new staff permission records
        //For each staff member, insert only the SELECTED permission_ids
        const newStaffPermissions = allStaff.flatMap((staff) => 
            selectedPermissionIds.map((permissionId) => ({
                staff_id: staff.staff_id,
                permission_id: permissionId,
            }))
        );
        
        //4. Insert new staff permissions (only if there are selections)
        if(newStaffPermissions.length === 0){
            console.log("No permissions selected - all staff permissions cleared");
            return [];
        }

        const {data: insertedPermissions, error: insertError} = await supabase
            .from("staff_permission")
            .insert(newStaffPermissions)
            .select();
        
        if(insertError){
            console.error("Failed to insert new staff permissions: ", insertError);
            throw new Error("Error inserting new permissions");
        }
        
        console.log(`Successfully updated permissions for ${allStaff.length} staff members with ${selectedPermissionIds.length} permissions each`);
        return insertedPermissions;
    } catch(error){
        console.error("Failed to update staff permissions: ", error);
        throw error;
    }
}

