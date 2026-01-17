"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, Vendors } from "@/type/producttype";
import { Admin, Dealer, Staff } from "@/type/membertype";

/* ================= TYPES ================= */

type TabKey = string; 

type MemberType = "vendor" | "admin" | "staff" | "dealer";

type NormalizedMember = {
  id: string;
  type: MemberType;
  name: string;
  image?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  dob?: string;
  extraLabel?: string;
  extraValue?: string;
};

export type MemberCatalogProps = {
  vendor?: Vendors;
  admin?: Admin;
  staff?: Staff;
  dealer?: Dealer;
  products?: Product[];
  ledger?: any[]; // example ledger type
  extraPanels?: { key: string; label: string; component: React.ReactNode }[];
};

/* ================= MAIN ================= */

export default function MemberDetailCatalog({
  vendor,
  admin,
  staff,
  dealer,
  products = [],
  extraPanels = [],
}: MemberCatalogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(() => extraPanels[0]?.key ?? "");

  /* ---------- Normalize member ---------- */
  const member: NormalizedMember | null = vendor
    ? {
        id: vendor.vendor_id,
        type: "vendor",
        name: vendor.vendor_name,
        image: vendor.vendor_image,
        email: vendor.vendor_email,
        phone1: vendor.phone_number1,
        phone2: vendor.phone_number2,
        address: vendor.address,
        extraLabel: "Vendor Type",
        extraValue: vendor.vendortype,
      }
    : admin
    ? {
        id: admin.admin_id,
        type: "admin",
        name: `${admin.first_name} ${admin.last_name}`,
        image: admin.profile_image,
        email: admin.email,
        dob: admin.date_of_birth?.toString(),
      }
    : staff
    ? {
        id: staff.staff_id,
        type: "staff",
        name: `${staff.first_name} ${staff.last_name}`,
        image: staff.profile_image,
        email: staff.email,
        dob: staff.date_of_birth?.toString(),
      }
    : dealer
    ? {
        id: dealer.dealer_id,
        type: "dealer",
        name: dealer.business_name,
        email: dealer.email_address,
        phone1: dealer.contact_number,
        address: dealer.shop_address,
      }
    : null;

  if (!member) {
    return (
      <div className="p-10 text-center text-red-600">
        No member data provided
      </div>
    );
  }

  /* ================= DYNAMIC PANELS ================= */

  const PANELS: { key: TabKey; label: string; component: React.ReactNode }[] = [
    ...extraPanels,
  ];

  useEffect(() => {
  if (!activeTab && extraPanels.length > 0) {
    setActiveTab(extraPanels[0].key);
  }
}, [extraPanels, activeTab]);
  /* ================= UI ================= */

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      {/* ================= Sidebar ================= */}
      <aside className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 text-4xl font-bold text-gray-400">
                  {member.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold">{member.name}</h2>
              <p className="text-xs text-gray-500">ID: {member.id}</p>
            </div>
          </div>
          <div className="flex justify-end">
          </div>
          <Divider />

          {/* Member Info */}
          <div className="space-y-3 text-sm">
            <Info label="Role" value={member.type.toUpperCase()} />
            {member.extraLabel && (
              <Info label={member.extraLabel} value={member.extraValue} />
            )}
          </div>


          <Divider />

          {/* Contact */}
          <div className="space-y-3 text-sm">
            {member.email && (
              <InfoLink
                label="Email"
                href={`mailto:${member.email}`}
                value={member.email}
              />
            )}
          </div>
        </div>
      </aside>

      {/* ================= Main ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4">
          <h1 className="text-2xl font-semibold">
           {member.type.toUpperCase()} Detail
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b px-8">
          <div className="flex gap-8">
            {PANELS.map((panel) => (
              <button
                key={panel.key}
                onClick={() => setActiveTab(panel.key)}
                className={`py-4 text-sm font-medium relative ${
                  activeTab === panel.key
                    ? "text-amber-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {panel.label}
                {activeTab === panel.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {PANELS.find((panel) => panel.key === activeTab)?.component}
        </div>
      </main>
    </div>
  );
}

/* ================= SHARED ================= */

const Divider = () => <div className="border-t border-gray-200" />;

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
    <p className="text-gray-900">{value || "N/A"}</p>
  </div>
);

const InfoLink = ({
  label,
  value,
  href,
}: {
  label: string;
  value?: string;
  href: string;
}) => (
  <div>
    <p className="text-xs uppercase text-gray-500 font-semibold">{label}</p>
    {value ? (
      <Link href={href} className="text-amber-600 text-sm hover:underline">
        {value}
      </Link>
    ) : (
      <p className="text-gray-600">N/A</p>
    )}
  </div>
);


