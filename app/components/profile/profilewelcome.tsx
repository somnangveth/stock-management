"use client";
import { getLoggedInUser } from "@/app/auth/actions";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { createSupabaseClient } from "@/app/auth/actions/client";
import { createSupabaseBrowserClient } from "@/lib/storage/browser";

export default function ProfileWelcome() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setLoading] = useState(true);

  // Function to fetch profile (extracted so we can reuse it)
  const fetchProfile = async () => {
    setLoading(true);
    const res = await getLoggedInUser();
    setProfile(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();

    // Set up real-time listener for profile updates
    const supabase = createSupabaseBrowserClient();
    
    // Listen for auth state changes (like session refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await fetchProfile();
        }
      }
    );

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin',
          filter: `id=eq.${profile?.id}`,
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      subscription.unsubscribe();
      channel.unsubscribe();
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <span className="animate-spin">⏳</span> Loading...
      </p>
    );
  }

  // Not logged in
  if (!profile) {
    return <p>Please log in to see your profile...</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <Image
        className="rounded-full"
        src={profile.profile_image || "/assets/default.jpg"}
        alt={profile.name || "User"}
        height={50}
        width={50}
      />
      <h1 className="text-lg font-semibold">Welcome Back, {profile.name}</h1>
    </div>
  );
}