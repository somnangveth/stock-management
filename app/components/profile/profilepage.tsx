"use client";

import { useState, useEffect } from "react";
import { getLoggedInUser } from "@/app/auth/actions";
import SignOut from "@/app/auth/components/signout";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getLoggedInUser();
      setProfile(user);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>Please login to see your profile.</p>;
  document.getElementById("profile-setting")?.click();

  return (
    <div className=" border border-gray-500 rounded-xl">
      <div className="p-3">
        {profile.profile_image ? (
      <img
      src={profile.profile_image}
      alt={profile.name}
      className="rounded-full"
      height={100}
      width={100}/>
        ):(
      <img
      src="/assets/default.jpg"
      alt={profile.name}
      className="rounded-full"
      height={100}
      width={100}/>
      )}
      <p className="text-gray-500">
        Name: {profile.name || "N/A"}
      </p>
      <p>
        Email: {profile.email || "N/A"}
      </p>
      </div>

      <div className="mt-6 border-t border-b max-w-full p-5">
        <h1>Change Password</h1>
      </div>
      <div className="flex justify-endh">
        <SignOut/>
      </div>
    </div>
  );
}
