// app/components/catalog/vendorDetailCatalog.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, Package, Search, X } from "lucide-react";
import { Product, Vendors } from "@/type/producttype";
import { EnhancedLedger } from "@/type/membertype";
import Updatevendor from "@/app/admin/vendors/components/editvendorform";
import DeleteVendor from "@/app/admin/vendors/components/deletevendorform";

type TabKey = "Product" | "Receipt";

interface VendorDetailCatalogProps {
  vendor: Vendors;
  product: Product[];
  ledger: EnhancedLedger[];
}

const DEFAULT_PRODUCT_IMAGE = "/assets/product_default.jpg";

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
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 flex items-center justify-center bg-white">
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
          <h1 className="text-2xl font-semibold text-amber-900">
            {vendor.vendor_name} · Vendor Detail
          </h1>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-8">
          <div className="flex gap-8">
            {[
              { key: "Product" as TabKey, label: "Product" },
              { key: "Receipt" as TabKey, label: "Receipt" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-4 text-sm font-medium transition relative ${
                  activeTab === key ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === "Product" && <ProductPanel products={product} />}
          {activeTab === "Receipt" && <LedgerPanel ledger={ledger} />}
        </div>
      </div>
    </div>
  );
}

/* ===== Product Panel ===== */
const ProductPanel = ({ products }: { products: Product[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-gray-500 text-sm text-center border border-gray-200">
        No Product Found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

Jade peakz, [17/1/26 12:44 ]


      {/* Product Count */}
      {filteredProducts.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? "No products found" : "No products available"}
          </p>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.product_id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer group"
              >
                {/* Image Container */}
                <div className="relative h-48 bg-white overflow-hidden">
                  <img
                    src={product.product_image || DEFAULT_PRODUCT_IMAGE}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Price Badge */}
                  {product.unit_price !== undefined && product.unit_price > 0 && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      ${product.unit_price.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Content Container */}
                <div className="p-4 space-y-3">
                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors">
                    {product.product_name}
                  </h3>

                  {/* SKU */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">SKU:</span>
                    <span className="text-xs text-gray-700 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200">
                      {product.sku_code}
                    </span>
                  </div>

                  {/* Package Info */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    <span>{product.units_per_package || 1} / {product.package_type || "box"}</span>
                  </div>

                  {/* Description Preview */}
                  {product.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 italic leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* View Details Button */}
                  <button className="w-full mt-2 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 text-xs font-semibold rounded-md transition-all duration-200 border border-blue-200">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}


      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-neutral-50 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Image */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm h-64 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                  <img
                    src={selectedProduct.product_image || DEFAULT_PRODUCT_IMAGE}
                    alt={selectedProduct.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedProduct.product_name}
                  </h3>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">SKU Code</p>
                    <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 text-gray-900">
                      {selectedProduct.sku_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vendor Price</p>
                    <p className="text-sm font-bold text-blue-600">
                      ${(selectedProduct.unit_price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Package Info</p>
                    <p className="text-sm text-gray-900">
                      {selectedProduct.units_per_package || 1} units / {selectedProduct.package_type || "box"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Category</p>
                    <p className="text-sm text-gray-900">ID: {selectedProduct.category_id}</p>
                  </div>

                  {selectedProduct.slug && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Slug</p>
                      <p className="text-sm text-gray-900 break-all font-mono">{selectedProduct.slug}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===== Ledger Panel ===== */
const LedgerPanel = ({ ledger }: { ledger: EnhancedLedger[] }) => {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 text-gray-500 text-sm text-center border border-gray-200">
        No Receipt Found
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