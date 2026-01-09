'use client';

import { RxGear } from "react-icons/rx";
import DialogForm from "@/app/components/dialogform";
import ProfilePage from "@/app/components/profile/profilepage";
import { useEffect, useState } from "react";

export default function ProfileDialog() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent rendering until client-side mount
  if (!mounted) {
    return (
      <button className="bg-transparent hover:bg-transparent">
        <RxGear className="text-black hover:text-black"/>
      </button>
    );
  }

  return (
    <DialogForm
      id="profile-setting"
      title="Profile Setting"
      Trigger={
        <button className="bg-transparent hover:bg-transparent">
          <RxGear className="text-black hover:text-black"/>
        </button>
      }
      form={<ProfilePage />}
    />
  );
}