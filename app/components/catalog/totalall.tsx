// ============================================
// 文件 2: components/admin/panels/TotalAllPanel.tsx
// ============================================

"use client";

import { useQueries } from "@tanstack/react-query";
import { Admin, Staff } from "@/type/membertype";
import { fetchAdmins, fetchStaffs } from "@/app/functions/admin/api/controller";
import { Users } from "lucide-react";
import PanelCard from "../catalog/panelcard";

export default function TotalAllPanel() {
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

  const isLoading = adminQuery.isLoading || staffQuery.isLoading;
  const error = adminQuery.error || staffQuery.error;

  const admins: Admin[] = adminQuery.data ?? [];
  const staffs: Staff[] = staffQuery.data ?? [];
  const totalUsers = admins.length + staffs.length;

  if (isLoading) {
    return (
      <PanelCard
        icon={Users}
        title="Total Users"
        mainValue={0}
        isLoading={true}
        bgGradient="from-amber-50 to-amber-100"
        borderColor="border-amber-200"
        iconBgGradient="from-amber-400 to-amber-500"
        titleColor="text-amber-600"
        valueColor="text-amber-600"
      />
    );
  }

  if (error) {
    return (
      <PanelCard
        icon={Users}
        title="Total Users"
        mainValue={0}
        error={true}
        onError={() => window.location.reload()}
        bgGradient="from-amber-50 to-amber-100"
        borderColor="border-amber-200"
        iconBgGradient="from-amber-400 to-amber-500"
        titleColor="text-amber-600"
        valueColor="text-amber-600"
        errorMessage="Error Loading"
      />
    );
  }

  return (
    <PanelCard
      icon={Users}
      title="Total Users"
      mainValue={totalUsers}
      bgGradient="from-amber-50 to-amber-100"
      borderColor="border-amber-200"
      iconBgGradient="from-amber-400 to-amber-500"
      titleColor="text-amber-600"
      valueColor="text-amber-600"
    >
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Admins</span>
          <span className="font-semibold text-slate-800">{admins.length}</span>
        </div>
        
        <div className="h-px bg-amber-300"></div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Staff</span>
          <span className="font-semibold text-slate-800">{staffs.length}</span>
        </div>
      </div>
    </PanelCard>
  );
}
