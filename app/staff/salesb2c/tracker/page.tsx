"use client";

import { useState } from "react";
import DraftReceiptPanel from "./ components/completedpanel";
import CompletedReceiptPanel from "./ components/draftpanel";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FaSignal } from "react-icons/fa6";

export default function TrackerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"draft" | "completed">("draft");

  return (
    <div>
      <button 
      onClick={() => router.push('/staff/salesb2c')}
      className="flex gap-2 items-center mb-3">
        <ArrowLeft/>
        Back to main page
      </button>
      {/* Tabs */}
      <div className="w-full flex">
        <button
          onClick={() => setTab("draft")}
          className={`flex w-1/2 text-center py-2 justify-center
            ${tab === "draft"
              ? "bg-gray-300 text-black border-b-2 border-gray-500"
              : "bg-transparent border-b border-gray-500 text-black"
            }`}
        >
          Drafted
        </button>

        <button
          onClick={() => setTab("completed")}
          className={`flex w-1/2 text-center py-2 justify-center
            ${tab === "completed"
              ? "bg-gray-300 text-black border-b-2 border-gray-500"
              : "bg-transparent border-b border-gray-500 text-black"
            }`}
        >
          Completed
        </button>
      </div>

      {/* Panel */}
      <div className="">
        {tab === "draft" && (<div className="mt-10"><DraftReceiptPanel/></div>)}
        {tab === "completed" && (<div className="mt-10"><CompletedReceiptPanel/></div>)}
      </div>
    </div>
  );
}
