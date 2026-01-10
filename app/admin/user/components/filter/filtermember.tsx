"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateForm from "../admin/createform";
import AdminList from "../admin/adminlist";
import StaffList from "../staff/stafflist";
import { Admin, Staff } from "@/type/membertype";
import { useRouter } from "next/navigation";
import { userGear } from "@/app/components/ui";
import TotalUsersCatalog from "@/app/components/catalog/totaluserscatalog";
import SearchBar from "@/app/components/searchbar";
import { useQueries } from "@tanstack/react-query";
import { fetchAdmins, fetchStaffs } from "@/app/functions/admin/api/controller";

type Member = Admin | Staff;

export default function FilterMember() {
  const router = useRouter();
  const [selected, setSelected] = useState<"admin" | "staff">("admin");
  const [searchResults, setSearchResults] = useState<Member[] | null>(null);

  const results = useQueries({
    queries: [
      { queryKey: ["admins"], queryFn: fetchAdmins },
      { queryKey: ["staffs"], queryFn: fetchStaffs },
    ],
  });

  const admins = results[0].data ?? [];
  const staffs = results[1].data ?? [];

  const activeData = useMemo<Member[]>(() => {
    if (searchResults) return searchResults;
    return selected === "admin" ? admins : staffs;
  }, [selected, admins, staffs, searchResults]);

  const handleSearch = (results: Member[]) => {
    setSearchResults(results);
  };

  const handleSelectChange = (value: "admin" | "staff") => {
    setSelected(value);
    setSearchResults(null); // reset search when switching
  };

  return (
    <>
      <SearchBar
        data={selected === "admin" ? admins : staffs}
        onSearch={handleSearch}
        searchKeys={["first_name", "last_name", "email"]}
        placeholder={`Search ${selected === "admin" ? "admins" : "staff"}...`}
      />

      <TotalUsersCatalog />

      <div className="mt-10 space-y-6">
        <div className="flex justify-between items-center">
          <Select value={selected} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select member type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="staff">Staffs</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4">
            {/* <button
              onClick={() => router.push("/admin/user/components/permission")}
              className="bg-gray-200 rounded-full text-xl p-2 hover:bg-gray-300"
            >
              {userGear}
            </button> */}
            <CreateForm />
          </div>
        </div>

        {selected === "admin" ? (
          <AdminList data={activeData as Admin[]} />
        ) : (
          <StaffList data={activeData as Staff[]} />
        )}
      </div>
    </>
  );
}
