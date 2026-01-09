"use client";

import { useQueries } from "@tanstack/react-query";
import { Admin, Staff } from "@/type/membertype";
import { fetchAdmins, fetchStaffs } from "@/app/functions/admin/api/controller";


export default function TotalUsersCatalog(){

    const result = useQueries({
        queries:[
            {
                queryKey: ["fetchAdmins"],
                queryFn: fetchAdmins,
            },
            {
                queryKey: ["fetchStaffs"],
                queryFn: fetchStaffs,
            }
        ]
    });

    const adminQuery = result[0];
    const staffQuery = result[1];

    if(!adminQuery|| adminQuery.error){
        console.error("Failed to fetch Admin datas");
        return <p>Failed to fetch Admin data.</p>;
    }

    if(!staffQuery|| staffQuery.error){
        console.error("Failed to fetch Admin datas");
        return <p>Failed to fetch Staff data.</p>;
    }

    if(adminQuery.isLoading || staffQuery.isLoading){
        return <p>Loading...</p>;
    }

    const admins: Admin[] = adminQuery.data ?? [];
    const staffs: Staff[] = staffQuery.data ?? [];

    const totalAdmin = admins.length;
    const totalStaff = staffs.length;

    const chartData = [
        {admin: totalAdmin, staff: totalStaff}
    ]
    return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
    {/* Admin */}
    <div className="bg-white border rounded-xl shadow-sm p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Total Admins</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {totalAdmin}
        </p>
      </div>
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700
                      flex items-center justify-center text-xl font-bold">
        A
      </div>
    </div>

    {/* Staff */}
    <div className="bg-white border rounded-xl shadow-sm p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Total Staff</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {totalStaff}
        </p>
      </div>
      <div className="w-12 h-12 rounded-full bg-green-100 text-green-700
                      flex items-center justify-center text-xl font-bold">
        S
      </div>
    </div>
  </div>
);

}