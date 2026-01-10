// app/admin/vendors/components/editvendorform.tsx
'use client';
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import UpdateVendor from "./editvendor"; // Import the actual form component
import { edit } from "@/app/components/ui";
import { Vendors } from "@/type/producttype";

export default function UpdateForm({ vendor }: { vendor: Vendors }) {
  return (
    <DialogForm
      id="update-trigger"
      Trigger={
                <button
                    className="
                        w-10 h-5 text-sm bg-transparent text-blue-500 rounded-xl">
                    {edit}
                </button>
            }
      form={<UpdateVendor vendors={vendor} />}
    />
  );
}
