"use client";
import { Staff } from "@/type/membertype";
import MemberTable from "@/app/components/tables/membertable";
import EditStaff from "./editstaff";
import Link from "next/link";
import { view } from "@/app/components/ui";

interface StaffListProps {
  data: Staff[]; // always receive data from parent
}

export default function StaffList({ data }: StaffListProps) {
  return (
    <div className="overflow-x-auto">
      <MemberTable
        itemsPerPage={5}
        members={data} // use data from parent
        columns={[
          "staff_id",
          "profile_image",
          "first_name",
          "last_name",
          "email",
          "gender",
          "action",
        ]}
        form={(staff) => {
          const s = staff as Staff;
          return (
            <div className="flex items-center gap-2">
              <EditStaff staff={s} />
              <Link href={`/admin/user/components/staff/staffdetail/${s.staff_id}`}>
                {view}
              </Link>
            </div>
          );
        }}
      />
    </div>
  );
}
