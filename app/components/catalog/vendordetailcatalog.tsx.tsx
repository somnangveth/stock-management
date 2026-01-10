"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Product, VendorProduct, Vendors } from "@/type/producttype";
import { EnhancedLedger } from "@/type/membertype";
import Updatevendor from "@/app/admin/vendors/components/editvendorform";
import DeleteVendor from "@/app/admin/vendors/components/deletevendorform";
import { edit } from "@/app/components/ui";

type TabKey = "Product" | "Ledger";

interface VendorDetailCatalogProps {
  vendor: Vendors;
  product: VendorProduct[];
  ledger: EnhancedLedger[];
}

export default function VendorDetailCatalog({
  vendor,
  product,
  ledger,
}: VendorDetailCatalogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("Product");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto shadow-sm">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/admin/vendors">
            <ArrowLeftIcon className="cursor-pointer w-5 h-5 text-gray-600 hover:text-gray-900" />
          </Link>

          {/* Vendor Avatar and Name */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
              {vendor.vendor_image ? (
                <img
                  src={vendor.vendor_image}
                  alt={vendor.vendor_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {vendor.vendor_name?.charAt(0) || "V"}
                </span>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">{vendor.vendor_name}</h2>
              <p className="text-xs text-gray-500 mt-1">ID: {vendor.vendor_id}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center pt-2">
            <Updatevendor vendor={vendor} />
            <DeleteVendor vendor={vendor} />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Vendor Info */}
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase">Contact Person</p>
              <p className="text-gray-900 font-medium mt-1">{vendor.contact_person || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase">Vendor Type</p>
              <p className="text-gray-900 font-medium mt-1">{vendor.vendortype || "N/A"}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>



          {/* Contact Details */}
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Email</p>
              <a
                href={`mailto:${vendor.vendor_email}`}
                className="text-blue-600 hover:underline text-xs break-all"
              >
                {vendor.vendor_email || "N/A"}
              </a>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Phone 1</p>
              <a
                href={`tel:${vendor.phone_number1}`}
                className="text-blue-600 hover:underline text-xs"
              >
                {vendor.phone_number1 || "N/A"}
              </a>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Phone 2</p>
              <p className="text-gray-600 text-xs">{vendor.phone_number2 || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Address</p>
              <p className="text-gray-600 text-xs">{vendor.address || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            {vendor.vendor_name} · Vendor Detail
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-8">
          <div className="flex gap-8">
            {["Product", "Ledger"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabKey)}
                className={`py-4 text-sm font-medium transition relative ${
                  activeTab === tab ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === "Product" && <ProductPanel products={product} />}
          {activeTab === "Ledger" && <LedgerPanel ledger={ledger} />}
        </div>
      </div>
    </div>
  );
}

/* ===== Product Panel ===== */
const ProductPanel = ({ products }: { products: VendorProduct[] }) => {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-gray-500 text-sm text-center border border-gray-200">
        No Product Found
      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-sm text-gray-600 font-semibold">
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">SKU Code</th>
              <th className="px-6 py-4">Base Price</th>
              <th className="px-6 py-4">Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const stockStatus = getStockStatus(item.quantity_remaining || 0);
              return (
                <tr key={item.product_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.product_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.sku_code}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${(item.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        stockStatus.color
                      }`}
                    >
                      {stockStatus.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ===== Ledger Panel ===== */
const LedgerPanel = ({ ledger }: { ledger: EnhancedLedger[] }) => {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-gray-500 text-sm text-center border border-gray-200">
        No Ledger Found
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-sm text-gray-600 font-semibold">
              <th className="px-6 py-4">Source Type</th>
              <th className="px-6 py-4">Total </th>
              <th className="px-6 py-4">Paid </th>
              <th className="px-6 py-4">Balance </th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((item, index) => (
              <tr key={item.ledger_id || index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {item.source_type || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-red-600">
                  ${(item.debit || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                  ${(item.credit || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-bold">
                  <span className={item.balance > 0 ? "text-red-600" : "text-green-600"}>
                    ${(item.balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(
                      item.payment_status
                    )}`}
                  >
                    {item.payment_status || "-"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-US")
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {item.payment_duedate
                    ? new Date(item.payment_duedate).toLocaleDateString("en-US")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ===== Helper Functions ===== */
const getStockStatus = (quantity: number) => {
  if (quantity > 50) {
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  } else if (quantity > 10) {
    return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
  } else {
    return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "unpaid":
      return "bg-red-100 text-red-700";
    case "partial":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};