'use client';

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateVendor } from "../actions/vendor";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
  vendor_id: z.string().min(1, "Vendor ID is required"),
  vendor_name: z.string().optional().or(z.literal("")),
  contact_person: z.string().optional().or(z.literal("")),
  vendor_email: z.string().email("Invalid email").optional().or(z.literal("")),
  vendor_type: z.enum(["local", "non-local"]).optional(),
  phone_number1: z.string().optional().or(z.literal("")),
  phone_number2: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  source_link: z.string().url("Invalid URL").optional().or(z.literal("")),
  payment_terms: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  vendor_image: z.string().optional().or(z.literal("")),
});

interface UpdateVendorProps {
  vendors?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UpdateVendor({ 
  vendors, 
  onSuccess,
  onCancel 
}: UpdateVendorProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [originalVendorId, setOriginalVendorId] = useState<string | number>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vendor_id: "",
      vendor_name: "",
      contact_person: "",
      vendor_email: "",
      vendor_type: "local",
      phone_number1: "",
      phone_number2: "",
      address: "",
      city: "",
      country: "",
      source_link: "",
      payment_terms: "",
      notes: "",
      vendor_image: "",
    },
  });

  // 加载 vendor 数据
  useEffect(() => {
    if (vendors) {
      console.log("📊 Loading vendor:", vendors);
      
      // ⭐️ 保存原始 vendor_id
      setOriginalVendorId(vendors.vendor_id);

      form.reset({
        vendor_id: String(vendors.vendor_id),
        vendor_name: vendors.vendor_name || "",
        contact_person: vendors.contact_person || "",
        vendor_email: vendors.vendor_email || "",
        vendor_type: vendors.vendor_type || "local",
        phone_number1: vendors.phone_number1 || "",
        phone_number2: vendors.phone_number2 || "",
        address: vendors.address || "",
        city: vendors.city || "",
        country: vendors.country || "",
        source_link: vendors.source_link || "",
        payment_terms: vendors.payment_terms || "",
        notes: vendors.notes || "",
        vendor_image: vendors.vendor_image || "",
      });

      if (vendors.vendor_image) {
        setImageUrls([vendors.vendor_image]);
      }
    }
  }, [vendors, form]);

  const steps = [
    { step: 1, title: "Basic Info" },
    { step: 2, title: "Contact" },
    { step: 3, title: "Additional" },
  ];

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log("📤 Form submitted:", data);

    startTransition(async () => {
      try {
        // 构建提交数据 - 包含原始 vendor_id 用于定位
        const submitData = {
          ...data,
          vendor_id_original: originalVendorId, // ⭐️ 关键：原始 ID 用于查找
        };

        console.log("🚀 Sending to server:", submitData);

        const result = await updateVendor(vendors.vendor_id,submitData);
        console.log("📦 Raw result from server:", result);

        if (!result) {
          toast.error("No response from server");
          return;
        }

          toast.success("Vendor updated successfully");
          if (onSuccess) {
            onSuccess();
          }
          
      } catch (error) {
        console.error("Client error:", error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  if (!vendors) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        <p className="text-sm text-gray-500">Loading vendor data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Update Vendor</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            ✕
          </button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 进度步骤 */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, idx) => (
            <div key={step.step} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  currentStep >= step.step ? "bg-amber-700 text-white" : "bg-gray-200 text-gray-600"
                )}
              >
                {currentStep > step.step ? <Check className="w-4 h-4" /> : step.step}
              </div>
              <span className="text-xs mt-1 text-gray-600">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Vendor ID</label>
              <input
                {...form.register("vendor_id")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="e.g., V001"
              />
              {form.formState.errors.vendor_id && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.vendor_id.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Original: {originalVendorId}</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Vendor Name</label>
              <input 
                {...form.register("vendor_name")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" 
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Contact Person</label>
              <input 
                {...form.register("contact_person")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="Enter contact person" 
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email</label>
              <input 
                {...form.register("vendor_email")} 
                type="email" 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="vendor@example.com"
              />
            </div>

Jade peakz, [9/1/26 15:39 ]


            <div>
              <label className="text-sm font-medium block mb-1">Vendor Type</label>
              <select 
                {...form.register("vendor_type")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Select type</option>
                <option value="local">Local</option>
                <option value="non-local">Non-Local</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Phone 1</label>
              <input 
                {...form.register("phone_number1")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Phone 2</label>
              <input 
                {...form.register("phone_number2")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="+1234567890 (Optional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Address</label>
              <textarea 
                {...form.register("address")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" 
                rows={3}
                placeholder="Enter full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">City</label>
                <input 
                  {...form.register("city")} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Country</label>
                <input 
                  {...form.register("country")} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Additional Information */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Website / Source Link</label>
              <input 
                {...form.register("source_link")} 
                type="url" 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Payment Terms</label>
              <input 
                {...form.register("payment_terms")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="e.g., Net 30, COD"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Notes</label>
              <textarea 
                {...form.register("notes")} 
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm" 
                rows={4}
                placeholder="Additional information about the vendor"
              />
            </div>
          </div>
        )}

Jade peakz, [9/1/26 15:39 ]


        {/* 导航按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <button
            type="button"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1 || isPending}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => Math.min(3, s + 1))}
              disabled={isPending}
              className="px-4 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Updating..." : "Update Vendor"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}