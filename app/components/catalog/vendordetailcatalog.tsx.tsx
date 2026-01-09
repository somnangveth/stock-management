"use client";

import { useState } from "react";
import { Product, Vendors } from "@/type/producttype";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export default function VendorDetailCatalog({
    vendor,
    product
}:{
    vendor: Vendors;
    product: Product;
}){
    const [activeTab, setActiveTab] = useState<'basic' | 'ledger' | 'duedate'>('basic');

    //Basic Info Panel
    const BasicInfoPanel = () => (
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500 font-medium">Vendor Name: </p>
                    <p className="text-base mt-1">{vendor.vendor_name || "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Contact Person:</p>
                    <p className="text-base mt-1">{vendor.contact_person || "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Email: </p>
                    <p className="text-base mt-1">{vendor.vendor_email || "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">ID: </p>
                    <p className="text-base mt-1">{vendor.vendor_id || "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number 1: </p>
                    <p className="text-base mt-1">{vendor.phone_number1 || "N/A"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number 2:</p>
                    <p className="text-base mt-1">{vendor.phone_number2 || "N/A"}</p>
                </div>
            </div>
        </div>
    );

    const LedgerPanel = () => (
        <div className="text-gray-500 text-sm flex items-center justify-center">
            <p>
                No Ledger Found.
            </p>
        </div>
    );

    const DueDatePanel = () => (
        <div className="text-gray-500 text-sm flex items-center justify-center">
            <p>
                No Due Date Found.
            </p>
        </div>
    );


    return(
    <div>
        <div className="border-b border-gray-600 p-2 flex justify-between">
            <Link href="/admin/user"><ArrowLeftIcon/></Link>
            <p>{vendor.vendor_name} 's Info</p>
        </div>
        <div className="flex p-5 border border-gray-500 m-3 rounded-lg">
            {vendor.vendor_image ? (
                <img src={vendor.vendor_image} alt={vendor.vendor_name} className="w-[200px] h-[200px] " />
            ):(
                <img src="/assets/default.jpg" alt="default" className="w-[200px] h-[200px] " />
            )}

            <div className="flex flex-col p-4">
            <h1 className="text-2xl font-bold ">{vendor.vendor_name}</h1>
            <p className="text-gray-500 text-sm ">ID: {vendor.vendor_id}</p>
            <p className="text-gray-500 text-sm ">Contact Person{vendor.contact_person}</p>
            <p className="text-gray-500 text-sm ">Email: {vendor.vendor_email}</p>
            </div>

        </div>

        <div className="flex flex-col gap-5 border-gray-500 mt-10">
            <div className="border-b border-gray-200">
                <button 
                onClick={() => setActiveTab("basic")}
                className={`flex-1 px-6 py-3 text-sm font-medium transitio-colors 
                    ${
                        activeTab === "basic"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                    Basic Info
                </button>
                <button 
                onClick={() => setActiveTab("ledger")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "ledger"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
                >
                    Ledger
                </button>

                <button
                onClick={() => setActiveTab("duedate")}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "duedate"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}>
                    Due Date
                </button>
            </div>

            {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === "basic" && <BasicInfoPanel />}
            {activeTab === "ledger" && <LedgerPanel/>}
            {activeTab === "duedate" && <DueDatePanel/>}
          </div>
        </div>
    </div>
    )
}