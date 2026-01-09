"use server";
import { createSupabaseServerClient } from "../supbase/action";

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile_image?: string;
  name?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createSupabaseServerClient();

    const {data: {user}, error} = await supabase.auth.getUser();

    if(error || !user){
        console.error("Error fetching user: ", error?.message);
        return null;
    }

    return{
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role as UserRole,
        profile_image: user.user_metadata?.profile_image,
        name: user.user_metadata?.display_name,
    };
}

export async function checkUserRole(allowedRoles: UserRole[]): Promise<{authorized: boolean, user: AuthUser | null; role?:UserRole}>{
    const user = await getCurrentUser();

    if(!user){
        return {authorized: false, user: null};
    }

    if(!user.role){
        console.error("User has no role assigned");
        return {authorized: false, user: null};
    }

    const authorized = allowedRoles.includes(user.role);

    return {authorized, user, role: user.role};
}