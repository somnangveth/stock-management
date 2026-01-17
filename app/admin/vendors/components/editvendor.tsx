"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateVendor } from "../actions/vendor";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Step-based validation schemas
const step1Schema = z.object({
  vendor_id: z.string().min(1, "Vendor ID is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  contact_person: z.string().min(1, "Contact person is required"),
  vendor_email: z.string().email("Invalid email address"),
  vendor_type: z.enum(["local", "non-local"]),
});

const step2Schema = z.object({
  phone_number1: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
});

const FormSchema = z.object({
  vendor_id: z.string().min(1, "Vendor ID is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  contact_person: z.string().min(1, "Contact person is required"),
  vendor_email: z.string().email("Invalid email address"),
  vendor_type: z.enum(["local", "non-local"]),
  phone_number1: z.string().min(1, "Phone number is required"),
  phone_number2: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  source_link: z.string().url("Invalid URL").optional().or(z.literal("")),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
  vendor_image: z.string().optional(),
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
    }
  }, [vendors, form]);

  const steps = [
    { step: 1, title: "Basic Info" },
    { step: 2, title: "Contact" },
    { step: 3, title: "Additional" },
  ];

  // Next step with validation
  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      const data = form.getValues();
      const result = step1Schema.safeParse({
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        contact_person: data.contact_person,
        vendor_email: data.vendor_email,
        vendor_type: data.vendor_type,
      });

      if (!result.success) {
        result.error.issues.forEach((err) => {
          form.setError(err.path[0] as any, {
            type: "manual",
            message: err.message,
          });
        });
        toast.error("Please complete all required fields correctly");
        return;
      }
      isValid = true;
    } else if (currentStep === 2) {
      const data = form.getValues();
      const result = step2Schema.safeParse({
        phone_number1: data.phone_number1,
        address: data.address,
        city: data.city,
        country: data.country,
      });

      if (!result.success) {
        result.error.issues.forEach((err) => {
          form.setError(err.path[0] as any, {
            type: "manual",
            message: err.message,
          });
        });
        toast.error("Please complete all required fields correctly");
        return;
      }
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((s) => s + 1);
    }
  };

  // Previous step
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  // ✅ 提交表单 - 只有点击 Submit 按钮才会执行
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log("📤 Form submitted:", data);

    startTransition(async () => {
      try {
        const submitData = {
          ...data,
          vendor_id_original: originalVendorId,
        };

        console.log("🚀 Sending to server:", submitData);

        const result = await updateVendor(submitData);
        console.log("📦 Result:", result);

        // 处理响应
        if (!result) {
          console.error("❌ No response from server");
          toast.error("No response from server");
          return;
        }

        if (result.success === false) {
          console.error("❌ Server error:", result.error);
          toast.error(result.error || "Failed to update vendor");
          return;
        }

        if (result.success === true) {
          console.log("✅ Success:", result.data);
          toast.success("✨ Vendor updated successfully!",);          
          
          // 延迟后调用 onSuccess 回调
          setTimeout(() => {
            if (onSuccess) {
              console.log("🔄 Calling onSuccess callback");
              onSuccess();
            }
          }, 800);
          return;
        }

        console.error("❌ Unexpected response format:", result);
        toast.error("Unexpected response from server");
        
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Update Vendor</h2>
        {onCancel && (
          <button 
            onClick={onCancel} 
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step) => (
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


        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Vendor ID *</label>
              <input
                {...form.register("vendor_id")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="Enter vendor ID"
              />
              {form.formState.errors.vendor_id && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.vendor_id.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Original: {originalVendorId}</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Vendor Name *</label>
              <input
                {...form.register("vendor_name")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="Enter vendor name"
              />
              {form.formState.errors.vendor_name && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.vendor_name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Contact Person *</label>
              <input
                {...form.register("contact_person")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="Enter contact person name"
              />
              {form.formState.errors.contact_person && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.contact_person.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Email *</label>
              <input
                {...form.register("vendor_email")}
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="vendor@example.com"
              />
              {form.formState.errors.vendor_email && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.vendor_email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Vendor Type *</label>
              <select
                {...form.register("vendor_type")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">Select vendor type</option>
                <option value="local">Local</option>
                <option value="non-local">Non-Local</option>
              </select>
              {form.formState.errors.vendor_type && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.vendor_type.message}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Contact Details */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">Primary Phone *</label>
              <input
                {...form.register("phone_number1")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="+1234567890"
              />
              {form.formState.errors.phone_number1 && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone_number1.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Secondary Phone</label>
              <input
                {...form.register("phone_number2")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                placeholder="+1234567890 (Optional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Address *</label>
              <textarea
                {...form.register("address")}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                rows={3}
                placeholder="Enter full address"
              />
              {form.formState.errors.address && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">City *</label>
                <input
                  {...form.register("city")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter city"
                />
                {form.formState.errors.city && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Country *</label>
                <input
                  {...form.register("country")}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                  placeholder="Enter country"
                />
                {form.formState.errors.country && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Additional Information */}
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
              {form.formState.errors.source_link && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.source_link.message}</p>
              )}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isPending}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>


          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isPending}
              className="px-4 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          ) : (
            // ✅ 关键修复：只有点击这个 submit 按钮才会提交表单
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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