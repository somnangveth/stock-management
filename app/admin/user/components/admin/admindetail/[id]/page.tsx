"use client";

import MemberDetailCatalog from "@/app/components/catalog/memberdetailcatalog.tsx";
import { Admin, Contact } from "@/type/membertype";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { fetchAdmins, fetchContact } from "@/app/functions/admin/api/controller";
import EditMember from "../../editmember";
import DeleteMember from "../../deletemember";
import UpdateContactForm from "../../updatecontactform";

const line = <div className="flex-1 border-b border-gray-300"></div>;

function BasicInfoPanel({ adminData, contact }: { adminData: Admin, contact: Contact }) {
  // Safely format date
  const dob = adminData.date_of_birth
    ? new Date(adminData.date_of_birth).toISOString().split("T")[0]
    : "-";

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="flex items-center gap-2">
          <EditMember admin={adminData} />
          <DeleteMember userId={adminData.admin_id}/>
        </div>
      </div>
      {line}

      <div className="space-y-2 mt-2">
        <div className="flex justify-between text-gray-600">
          <span>Firstname:</span>
          <span>{adminData.first_name || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Lastname:</span>
          <span>{adminData.last_name || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Gender:</span>
          <span>{adminData.gender || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Date of birth:</span>
          <span>{dob}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Marital Status:</span>
          <span>{adminData.martial_status || "-"}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Email Address:</span>
          <span>{adminData.email || "-"}</span>
        </div>
        
        <div className="mt-5">
          <div className="flex justify-between mb-2">
            <h2 className="font-bold text-lg">Contact Information</h2>
            <div>
              <UpdateContactForm contact={contact}/>
            </div>
          </div>
          {line}
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
          <span>Primary email address:</span>
          <span>{adminData.primary_email_address || "-"}</span>
          </div>

          <div className="flex justify-between text-gray-600">
          <span>Personal email address:</span>
          <span>{adminData.personal_email_address || "-"}</span>
          </div>

          <div className="flex justify-between text-gray-600">
          <span>Primary phone number:</span>
          <span>{adminData.primary_phone_number || "-"}</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminDetailPage() {
  const param = useParams();
  const id = param.id as string;

  const results = useQueries({
    queries: [
      { queryKey: ["admin-query"], queryFn: fetchAdmins },
      { queryKey: ["contact-query"], queryFn: fetchContact },
    ],
  });

  const adminData = results[0].data || [];
  const contactData = results[1].data || [];
  const isLoading = results.some((r) => r.isLoading);
  const hasError = results.some((r) => r.isError);

  console.log('contact data', contactData)
  const currentAdmin = useMemo(() => {
    return adminData.find((a: Admin) => a.admin_id === id) || null;
  }, [adminData, id]);

  const currentContact = useMemo(() => {
  if (!currentAdmin) return null;
  return contactData.find((contact: any) => contact.contact_id === currentAdmin.contact_id) || null;
}, [contactData, currentAdmin]);


  console.log('current contact', currentContact);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">Loading...</div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        Failed to load admin detail
      </div>
    );
  }

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">Admin not found</div>
    );
  }

  /* ================= MERGE CONTACT INTO ADMIN ================= */
  const mergedAdmin = {
    ...currentAdmin,
    email: currentContact?.email || currentAdmin.email,
    profile_image: currentContact?.profile_image || currentAdmin.profile_image,
    phone_number1: currentContact?.phone_number1 || "",
    phone_number2: currentContact?.phone_number2 || "",
    address: currentContact?.address || "",
    primary_email_address: currentContact?.primary_email_address || "-",
    personal_email_address: currentContact?.personal_email_address || "-",
    primary_phone_number: currentContact?.primary_phone_number || "-",
  };

  /* ================= EXTRA PANELS ================= */
  const extraPanels = [
    { key: "basic", label: "Basic Info", component: <BasicInfoPanel contact={currentContact} adminData={mergedAdmin} /> },
    // Add other panels if needed
  ];

  /* ================= UI ================= */
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link
        href="/admin/user"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon size={16} />
        Back
      </Link>

      {/* Catalog */}
      <MemberDetailCatalog admin={mergedAdmin} extraPanels={extraPanels} />
    </div>
  );
}
