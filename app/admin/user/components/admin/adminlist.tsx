"use client";
import { Admin } from "@/type/membertype";
import MemberTable from "@/app/components/tables/membertable";
import EditMember from "./editmember";
import Link from "next/link";
import { view } from "@/app/components/ui";
import DeleteMember from "./deletemember";

interface AdminListProps {
  data: Admin[];
  onDelete?: (authId: string) => void;
}

export default function AdminList({ data}: AdminListProps) {
  return (
    <div className="overflow-x-auto">
      <MemberTable
        itemsPerPage={5}
        members={data}
        columns={[
          "admin_id",
          "profile_image",
          "first_name",
          "last_name",
          "email",
          "gender",
          "action",
        ]}
        form={(admin) => {
          const a = admin as Admin;
          return (
            <div className="flex items-center gap-2">
              <EditMember admin={a} />
              <Link href={`/admin/user/components/admin/admindetail/${a.admin_id}`}>
                {view}
              </Link>
            </div>
          );
        }}
      />
    </div>
  );
}
