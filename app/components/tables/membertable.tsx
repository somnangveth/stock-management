"use client";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";

type ColumnKey =
//Users
  | "admin_id"
  | "staff_id"
  | "profile_image"
  | "first_name"
  | "last_name"
  | "email"
  | "role"
  | "gender"
  | "action"
//Vendors
  | "vendor_id"
  | "vendor_name"
  | "contact_person"
  | "phone_number1"
  | "phone_number2"
  | "vendor_email"
  | "vendor_image"
  | "souce_link"
  | "vendor_type"
  | "address"
  | "city"
  | "country"
  | "payment_terms"
  | "notes"

  //Dealer
  | "dealer_id"
  | "business_name"
  | "dealer_name"
  | "email_address"
  | "businesstype";

type Member = {
  //Users
  admin_id?: string;
  staff_id?: string;
  profile_image?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  gender?: string;

  //Vendors
  vendor_id?: string;
  vendor_name?: string;
  contact_person?: string;
  phone_number1?: string;
  phone_number2?: string;
  vendor_email?: string;
  vendor_image?: string;
  source_link?: string;
  vendortype?: string;
  address?: string;
  city?: string;
  country?: string;
  payment_terms?: string;
  note?: string;

  //Dealer
  dealer_id?: string;
  business_name?: string;
  dealer_name?: string;
  email_address?: string;
  businesstype?: string;
};

type MemberTableProps = {
  members: Member[];
  columns: ColumnKey[];
  form?: ReactNode | ((member: Member) => ReactNode);
  itemsPerPage: number;
};

export default function MemberTable({ members, columns, form, itemsPerPage}: MemberTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if(!members || !Array.isArray(members)){
    return <p>No members to display</p>
  }

  if(members.length === 0){
    return <p>No members</p>
  }

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = members.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev+1, totalPages));
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev-1, 1));
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }


  return (
    <div className="">
        <Table className="w-full border border-gray-300">
        <TableHeader className="bg-gray-200">
          <TableRow>
            {/* Users */}
            {columns.includes("admin_id") && <TableHead>ID</TableHead>}
            {columns.includes("staff_id") && <TableHead>ID</TableHead>}
            {columns.includes("profile_image") && <TableHead>Image</TableHead>}
            {columns.includes("first_name") && <TableHead>Firstname</TableHead>}
            {columns.includes("last_name") && <TableHead>Lastname</TableHead>}
            {columns.includes("email") && <TableHead>Email</TableHead>}
            {columns.includes("role") && <TableHead>Role</TableHead>}
            {columns.includes("gender") && <TableHead>Gender</TableHead>}

            {/* Vendors */}
            {columns.includes("vendor_id") && <TableHead>Vendor ID: </TableHead>}
            {columns.includes("vendor_image") && <TableHead>Logo: </TableHead>}
            {columns.includes("vendor_name") && <TableHead>Vendor Name: </TableHead>}
            {columns.includes("contact_person") && <TableHead>Contact Person</TableHead>}
            {columns.includes("vendor_type") && <TableHead>Vendor Type:</TableHead>}
            {columns.includes("phone_number1") && <TableHead>Phone Number 1: </TableHead>}
            {columns.includes("phone_number2") && <TableHead>Phone Number 2: </TableHead>}

            {columns.includes("dealer_id") && <TableHead>ID </TableHead>}
            {columns.includes("business_name") && <TableHead>Business Name</TableHead>}
            {columns.includes("dealer_name") && <TableHead>Dealer Name</TableHead>}
            {columns.includes("email_address") && <TableHead>Email Address </TableHead>}
            {columns.includes("businesstype") && <TableHead>Business Type </TableHead>}
            {columns.includes("action") && <TableHead className="text-right">Action:</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentMembers.map((member, index) => {
            const key = member.admin_id ?? member.staff_id ?? index;

            // Check if actionContent is a function
            const actionContent =
              typeof form === "function" ? form(member) : form;

            return (
              <TableRow key={key}>
                {columns.includes("admin_id") && <TableCell>{member.admin_id}</TableCell>}
                {columns.includes("staff_id") && <TableCell>{member.staff_id}</TableCell>}
                {columns.includes("profile_image") && (
                  <TableCell>
                    {member.profile_image ? (
                      <img
                        src={member.profile_image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <img src="/assets/default.jpg" alt="" className="w-10 h-10 rounded-lg" />
                    )}
                  </TableCell>
                )}
                {columns.includes("first_name") && <TableCell>{member.first_name}</TableCell>}
                {columns.includes("last_name") && <TableCell>{member.last_name}</TableCell>}
                {columns.includes("email") && <TableCell>{member.email}</TableCell>}
                {columns.includes("role") && <TableCell>{member.role}</TableCell>}
                {columns.includes("gender") && <TableCell>{member.gender}</TableCell>}

                {/* Vendors */}
                {columns.includes("vendor_id") && <TableCell>{member.vendor_id}</TableCell>}
                {columns.includes("vendor_image") && <TableCell>
                  {member.vendor_image ?
                  (<img 
                  src={member.vendor_image}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                  />):(
                    <img 
                  src="/assets/default.jpg"
                  alt=""
                  className="w-10 h-10 rounded-lg"/>
                  )}
                  </TableCell>}
                {columns.includes("vendor_name") && <TableCell>{member.vendor_name}</TableCell>}
                {columns.includes("contact_person") && <TableCell>{member.contact_person || "_"}</TableCell>}
                {columns.includes("vendor_type") && <TableCell>{member.vendortype}</TableCell>}
                {columns.includes("phone_number1") && <TableCell>{member.phone_number1}</TableCell>}
                {columns.includes("phone_number2") && <TableCell>{member.phone_number2}</TableCell>}

                {/* Dealer */}
                {columns.includes("dealer_id") && <TableCell>{member.dealer_id}</TableCell>}
                {columns.includes("business_name") && <TableCell>{member.business_name || "_"}</TableCell>}
                {columns.includes("dealer_name") && <TableCell>{member.dealer_name}</TableCell>}
                {columns.includes("email_address") && <TableCell>{member.email_address}</TableCell>}
                {columns.includes("businesstype") && 
                <TableCell className={`inline-flex text-sm font-medium px-3 py-1 rounded-full 
                ${member.businesstype === "retail"
                  ? "text-green-700 bg-green-50"
                  : member.businesstype === "wholesale"
                  ? "text-purple-700 bg-purple-50"
                  : member.businesstype === "mixed"
                  ? "bg-yellow-100 text-amber-700"
                  : member.businesstype === "online"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100"
                }`}>
                  {member.businesstype}
                </TableCell>}
                {columns.includes("action") && <TableCell className="text-right">{actionContent}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex,members.length)} of {members.length} members
          </div>

          <div className="flex items-center gap-2">
            <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
          

          <div className="flex gap-1">
            {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
              <button
              key={page}
              onClick={() => goToPage(page)}
              className={`px-3 py-1 rounded-lg text-sm ${
              currentPage === page
                ? "bg-amber-500 text-white"
                : "border border-gray-300 hover:bg-gray-100"
              }`}>
                {page}
              </button>
            ))}
          </div>

          <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4"/>
            </button>

            </div>
        </div>
      )}
    </div>
  );
}