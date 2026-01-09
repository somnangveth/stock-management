"use server";

import { UserRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { redirect } from "next/navigation";

// Get Logged In User Info
export async function getLoggedInUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }

  if (!user) {
    console.log("No user found in session");
    return null;
  }

  return {
    id: user.id,
    profile_image: user.user_metadata?.profile_image,
    name: user.user_metadata?.display_name,
    role: user.user_metadata?.role,
    email: user.email,
  };
}

// Login with Email and Password
export async function loginWithEmailAndPassword(data: { email: string; password: string }) {
  const supabase = await createSupabaseServerClient();

  // LOGIN
  const { data: loginData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {error: error.message};
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Failed to fetch logged-in user.");
  }

  const role = user.user_metadata?.role as UserRole;

  if(!role){
    throw new Error("User has no role assigned");
  }

  if (role === "admin"){ redirect("/admin")}
  else if(role === "staff") {redirect("/staff")}
  else{throw new Error('Invalid role')};
}

// Log Out
export async function logOut() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed:", error.message);
    throw new Error(error.message);
  }

  redirect("/auth");
}
