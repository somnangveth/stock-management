"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

//Add Permission into Staff Permission Table
export async function addStaffPermission(){
    const supabase = await createSupabaseAdmin();

    try{
        //Get User's role
        
        const{ data: staffPermissionData, error: staffPermissionError} = await supabase
        .from("staff_permission")
        .insert({})
    }catch(error){

    }
}