"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { revalidatePath } from "next/cache";
import { success } from "zod";


//Create new member
export async function createMember(data: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  profile_image: string;
  gender: 'Male' | 'Female';
  nationality: string;
  date_of_birth: Date;
  martial_status: string;
  primary_email_address: string;
  personal_email_address: string;
  primary_phone_number: string;
}) {
  const supabase = await createSupabaseAdmin();

  try {
    const display_name = data.first_name + " " + data.last_name;

    //Fetch all datas from permission default table
    const {data: permissionData, error: permissionError} = await supabase
    .from('permission_default')
    .select('*');

    if(permissionError){
      console.error("Failed to fetch permission data", permissionError);
      throw new Error("Failed to fetch permission data");
    }

    //1. Create Auth user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        profile_image: data.profile_image,
      },
    });

    if (userError) throw userError;
    if (!userData.user?.id) throw new Error("User ID is undefined after creation");

    const authId = userData.user.id;

    //2.Insert into contact_info table
    const {data: contactData, error: contactError} = await supabase
      .from("contact_info")
      .insert({
        primary_email_address: data.primary_email_address,
        personal_email_address: data.personal_email_address,
        primary_phone_number: data.primary_phone_number,
      })
      .select('contact_id')
      .single();

    if(contactError){
      console.error('Contact insert error', contactError);
      throw contactError;
    }

    const contactId = contactData?.contact_id;

    if(!contactId){
      throw new Error("Contact ID is undefined after creation");
    }

    //3.Insert base on role
    if (data.role === "admin") {
      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .insert({
          admin_id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
          role: data.role,
          profile_image: data.profile_image,
          nationality: data.nationality,
          date_of_birth: data.date_of_birth,
          martial_status: data.martial_status,
          gender: data.gender,
          contact_id: contactId,
          auth_id: authId,
        })
        .select("admin_id")
        .single();

      if(adminError){
        console.error('Admin insert error: ', adminError);
        throw adminError;
      }
      const adminId = adminData.admin_id;

      // Insert into member table
      const { data: memberData, error: memberError } = await supabase
        .from("member")
        .insert({
          auth_id: authId,
          admin_id: adminId,
        });

      if (memberError){ 
        console.error('Member insert error: ', memberError);
        throw memberError;
      }
      return memberData;

    } 
    else if (data.role === "staff") {

      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .insert({
          staff_id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
          role: data.role,
          profile_image: data.profile_image,
          nationality: data.nationality,
          date_of_birth: data.date_of_birth,
          martial_status: data.martial_status,
          gender: data.gender,
          contact_id: contactId,
          auth_id: authId,
        })
        .select("staff_id")
        .single();

      if (staffError){
        console.error("Failed to insert Staff", staffError);
        throw staffError;
      }
      const staffId = staffData.staff_id;

      // Map permission defaults to staff_permission format
      const staffPermissions = permissionData?.map((permission) => ({
        auth_id: authId,
        staff_id: staffId,
        permission_default_id: permission.permission_default_id,
      }));

      // Insert all staff permissions at once
      const {data: staffPermission, error: staffPermissionError} = await supabase
        .from("staff_permission")
        .insert(staffPermissions);

      if (staffPermissionError) {
        console.error('Failed to insert staff permissions', staffPermissionError);
        throw staffPermissionError;
      }

      // Insert into member table
      const { data: memberData, error: memberError } = await supabase
        .from("member")
        .insert({
          auth_id: authId,
          staff_id: staffId,
        });

      if (memberError){ 
        console.error('Failed to insert member', memberError);
        throw memberError;
      }

      return memberData;
    }

    throw new Error("Invalid role provided");

  } catch (error: any) {
    console.error("Create member failed:", error);
    throw new Error(error.message || "Failed to create member!");
  }
}
// Fetch all Admins 
export async function fetchAdmins() {
  const supabase = await createSupabaseAdmin();

  const { data: adminData, error: adminError } = await supabase
    .from("admin")
    .select("*");

  if (adminError) {
    throw new Error(adminError.message);
  }

  return adminData;
}

export async function fetchAuthUsers(id: string,){
  const supabase = await createSupabaseAdmin();

  const {data, error: userError} = await supabase.auth.admin.getUserById(id);

  if(userError){
    throw new Error("Failed to fetch AuthUsers data");
  }

  if(!data.user){
    throw new Error("Auth user not found");
  }

  return data.user;
}



//Update Admin info
export async function updateAdmin(
  admin_id: string,
  data: Partial<{
    profile_image: string;
    email: string;
    first_name: string;
    last_name: string;
    nationality: string;
    date_of_birth: Date;
    martial_status: string;
    gender: string;
  }>
) {
  try {
    // Get current authenticated user
    const authSupabase = await createSupabaseServerClient();
    
    // First check if we have a session at all
    const { data: { session }, error: sessionError } = await authSupabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("Session error:", sessionError);
      return { 
        success: false, 
        error: "No active session. Please log in again.",
        needsLogin: true 
      };
    }

    // Then get the user
    const { data: { user: currentUser }, error: userError } = await authSupabase.auth.getUser();
    
    if (userError || !currentUser) {
      console.error("User error:", userError);
      return { 
        success: false, 
        error: "Could not verify user. Please log in again.",
        needsLogin: true 
      };
    }

    console.log("Authenticated user:", currentUser.id);

    // Now proceed with admin operations
    const supabase = await createSupabaseAdmin();
    
    const authUpdate: any = {};
    
    if (data.email) {
      authUpdate.email = data.email;
    }

    const user_metadata: any = {};
    if (data.first_name !== undefined) user_metadata.first_name = data.first_name;
    if (data.last_name !== undefined) user_metadata.last_name = data.last_name;
    if (data.profile_image !== undefined) user_metadata.profile_image = data.profile_image;

    if (data.first_name !== undefined || data.last_name !== undefined) {
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      user_metadata.display_name = `${firstName}${lastName ? ' ' + lastName : ''}`.trim();
    }

    if (Object.keys(user_metadata).length > 0) {
      authUpdate.user_metadata = user_metadata;
    }

    if (Object.keys(authUpdate).length > 0) {
      const { data: updatedUser, error: authError } = await supabase.auth.admin.updateUserById(
        currentUser.id,
        authUpdate
      );

      if (authError) {
        console.error("Auth update error:", authError);
        throw authError;
      }
      console.log("Auth updated successfully");
    }

    // Update profile data in database
    const profileData: any = {};
    if (data.profile_image !== undefined) profileData.profile_image = data.profile_image;
    if (data.email !== undefined) profileData.email = data.email;
    if (data.first_name !== undefined) profileData.first_name = data.first_name;
    if (data.last_name !== undefined) profileData.last_name = data.last_name;
    if (data.nationality !== undefined) profileData.nationality = data.nationality;
    if (data.date_of_birth !== undefined) profileData.date_of_birth = data.date_of_birth;
    if (data.martial_status !== undefined) profileData.martial_status = data.martial_status;
    if (data.gender !== undefined) profileData.gender = data.gender;

    if (data.first_name !== undefined || data.last_name !== undefined) {
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
    }

    console.log("Updating martial_status:", data.martial_status);

    if (Object.keys(profileData).length > 0) {
      const { error: profileError } = await supabase
        .from('admin')
        .update(profileData)
        .eq('admin_id', admin_id);

      if (profileError) {
        console.error("Database update error:", profileError);
        throw profileError;
      }
      console.log("Database updated successfully");
    }

    return { success: true, needsRefresh: true };
  } catch (error: any) {
    console.error("Error updating admin:", error);
    return { 
      success: false, 
      error: error.message || "Failed to update admin" 
    };
  }
}

//Fetch all Staffs
export async function fetchStaffs(){
    const supabase = await createSupabaseAdmin();

    const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .select("*");

    if(staffError){
        throw new Error("Failed to fetch staff");
    }

    return staffData;
}

//Update Staff Info
export async function updateStaff(
    staff_id: string,
    payload: Partial<{
        profile_image: string;
        name: string;
        email: string;
        password: string;
    }>
){
    const supabase = await createSupabaseAdmin();

    const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .update(payload)
    .eq("staff_id", staff_id)
    .single();

    if(staffError){
        throw new Error("Failed to update Staff Info", staffError);
    }

    return JSON.stringify(staffData);

}

//Update Contact Info
export async function updateContact(
  contact_id: string,
  data: Partial<{
    primary_email_address: string;
    personal_email_address: string;
    primary_phone_number: string;
  }>
){
  const supabase = await createSupabaseAdmin();

  const {data: contactData, error: contactError} = await supabase
  .from("contact_info")
  .update({
    primary_email_address: data.primary_email_address,
    personal_email_address: data.personal_email_address,
    primary_phone_number: data.primary_phone_number,
  })
  .eq('contact_id', contact_id);

  if(contactError){
    console.error("Failed to update contact data");
    throw new Error(`Error updating... ${contactError.message}`);
  }

  return contactData;
}
//Fetch Contact Info
export async function fetchContacts(){
  const supabase = await createSupabaseAdmin();

  const { data: contactData, error: contactError } = await supabase
  .from("contact_info")
  .select("*");

  if(contactError || !contactData){
    console.error("Failed to fetch data", contactError.message);
    throw new Error("Failed to fetch");
  }

  return contactData;
}

export async function deleteMember(userId: string) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // Validate the userId parameter
    if (!userId) {
      console.error("userId is required");
      return { success: false, error: "userId is required" };
    }

    // Get the user to verify they exist
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    
    if (getUserError || !user) {
      console.error("User not found", getUserError?.message);
      return { success: false, error: "User not found" };
    }

    // Delete records from tables with FK references in the correct order
    // Delete from member table
    const { error: memberError } = await supabase
      .from('member')
      .delete()
      .eq('auth_id', userId);
    
    if (memberError) {
      console.error("Failed to delete from member table", memberError.message);
      return { success: false, error: memberError.message };
    }

    // Delete from staff table
    const { error: staffError } = await supabase
      .from('staff')
      .delete()
      .eq('auth_id', userId);
    
    if (staffError) {
      console.error("Failed to delete from staff table", staffError.message);
      return { success: false, error: staffError.message };
    }

    // Delete from admin table
    const { error: adminError } = await supabase
      .from('admin')
      .delete()
      .eq('auth_id', userId);
    
    if (adminError) {
      console.error("Failed to delete from admin table", adminError.message);
      return { success: false, error: adminError.message };
    }

    // Finally, delete the auth user
    const { data: deleteData, error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Failed to delete user from auth", deleteError.message);
      return { success: false, error: deleteError.message };
    }

    return { success: true, data: deleteData };
    
  } catch (error) {
    console.error("Error deleting member:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}