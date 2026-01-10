"use client";

import { useQueries } from "@tanstack/react-query";
import { Admin, Staff } from "@/type/membertype";
import { fetchAdmins, fetchStaffs } from "@/app/functions/admin/api/controller";
import { Users, Loader, AlertCircle } from "lucide-react";

export default function TotalAll() {
  const result = useQueries({
    queries: [
      {
        queryKey: ["fetchAdmins"],
        queryFn: fetchAdmins,
      },
      {
        queryKey: ["fetchStaffs"],
        queryFn: fetchStaffs,
      },
    ],
  });

  const adminQuery = result[0];
  const staffQuery = result[1];

  if (adminQuery.isLoading || staffQuery.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader size={30} className="animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (adminQuery.error || staffQuery.error) {
    console.error("Failed to fetch user data");
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={30} />
          <p className="text-sm">Failed to load</p>
        </div>
      </div>
    );
  }

  const admins: Admin[] = adminQuery.data ?? [];
  const staffs: Staff[] = staffQuery.data ?? [];
  const totalUsers = admins.length + staffs.length;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-md p-6 h-full">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Users</p>
            <p className="text-5xl font-bold text-gray-800">{totalUsers}</p>
          </div>
          <div className="w-20 h-20 rounded-xl bg-amber-200 border-2 border-amber-400 flex items-center justify-center flex-shrink-0">
            <Users size={40} className="text-amber-700" />
          </div>
        </div>
        
        <div className="flex-1 flex items-end">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between pb-3">
              <span className=" text-gray-700 font-medium text-2xl">Admins</span>
              <span className="text-3xl font-bold text-amber-600">{admins.length}</span>
            </div>
            <div className="w-full h-px bg-amber-300"></div>
            <div className="flex items-center justify-between pt-3">
              <span className=" text-gray-700 font-medium text-2xl">Staff</span>
              <span className="text-3xl font-bold text-amber-600">{staffs.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}