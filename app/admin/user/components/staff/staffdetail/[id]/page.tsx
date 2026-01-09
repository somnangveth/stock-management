"use client";

import MemberDetailCatalog from "@/app/components/catalog/memberdetailcatalog.tsx";
import { cn } from "@/lib/utils";
import { Contact, Staff } from "@/type/membertype";
import { useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import EditStaff from "../../editstaff";
import UpdateContactForm from "../../../admin/updatecontactform";
import { fetchContact, fetchStaffs } from "@/app/functions/admin/api/controller";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

const line = <div className="flex-1 border-b border-gray-300"></div>;

function BasicInfoPanel({ staffData, contact }: { staffData: Staff, contact: Contact }) {
  const dob = staffData.date_of_birth
    ? new Date(staffData.date_of_birth).toISOString().split("T")[0]
    : "-";

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <EditStaff staff={staffData} />
      </div>
      {line}

      <div className="space-y-2 mt-2">
        <div className="flex justify-between text-gray-600">
          <span>Firstname:</span>
          <span>{staffData.first_name || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Lastname:</span>
          <span>{staffData.last_name || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Gender:</span>
          <span>{staffData.gender || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Date of birth:</span>
          <span>{dob}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Email Address:</span>
          <span>{staffData.email || "-"}</span>
        </div>

        {/* Contact info */}
        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <h2 className="font-bold text-lg">Contact Information</h2>
            <div>
              <UpdateContactForm contact={contact}/>
            </div>
          </div>
          {line}
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Primary email address:</span>
              <span>{staffData.primary_email_address || "-"}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Personal email address:</span>
              <span>{staffData.personal_email_address || "-"}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Primary phone number:</span>
              <span>{staffData.primary_phone_number || "-"}</span>
            </div>
            </div>
          </div>
      </div>
    </>
  );
}

export default function StaffDetailPage() {
  const param = useParams();
  const id = param.id as string;

  const results = useQueries({
    queries: [
      {
        queryKey: ["staff-query"],
        queryFn: fetchStaffs
      },
      {
        queryKey: ["contact-query"],
        queryFn: fetchContact,
      },
    ],
  });

  const staffData = results[0].data || [];
  const contactData = results[1].data || [];
  const isLoading = results.some((r) => r.isLoading);
  const hasError = results.some((r) => r.isError);


  const currentStaff = useMemo(() => {
    return staffData.find((s: Staff) => s.staff_id === id) || null;
  }, [staffData, id]);

  const currentContact = useMemo(() => {
    return contactData.find(
      (c: any) => currentStaff && c.contact_id === currentStaff.contact_id
    ) || null;
  }, [contactData, currentStaff]);

  console.log('current contact', currentContact);
  if (!currentStaff)
  return (
    <p className="text-gray-500 flex items-center justify-center">
      No staff found
    </p>
  );

  // Merge contact info into staff
  const mergedStaff = {
    ...currentStaff,
    email: currentStaff.email || "-",
    profile_image: currentStaff.profile_image || "",
    primary_email_address: currentContact?.primary_email_address || "-",
    personal_email_address: currentContact?.personal_email_address || "-",
    primary_phone_number: currentContact?.primary_phone_number || "-",
  };

  const extraPanels = [
    {
      key: "basic",
      label: "Basic Info",
      component: <BasicInfoPanel contact={currentContact} staffData={mergedStaff} />,
    },
  ];

    if (isLoading)
    return (
      <p className="text-gray-500 flex items-center justify-center gap-2">
        Loading data
        <AiOutlineLoading3Quarters className={cn("animate-spin")} />
      </p>
    );

  if (hasError)
    return (
      <p className="text-red-600 flex items-center justify-center">
        Failed to fetch data
      </p>
    );
  return (
    <div>
      <Link
        href="/admin/user"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon size={16} />
        Back
      </Link>
  <MemberDetailCatalog staff={mergedStaff} extraPanels={extraPanels} />;
    </div>
  )
}
