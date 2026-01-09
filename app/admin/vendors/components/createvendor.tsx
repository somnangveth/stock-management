"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import ProfileButton from "@/app/components/image/components/profilebutton";
import { createVendor } from "../actions/vendor";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { uploadImage } from "@/app/components/image/actions/upload";
import { toast } from "sonner";

const FormSchema = z.object({
  vendor_id: z.string().min(1, "Vendor ID is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  contact_person: z.string().min(1, "Contact person is required"),
  phone_number1: z.string().min(1, "Primary phone is required"),
  phone_number2: z.string().optional(),
  vendor_email: z.string().email("Invalid email address"),
  vendor_image: z.string().optional(),
  source_link: z.string().url().optional().or(z.literal("")),
  vendor_type: z.enum(['local','non-local']),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

export default function CreateVendors({onSuccess}:{onSuccess?: () => void}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  
  const vendorTypes = ['local', 'non-local'];
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vendor_id: "",
      vendor_name: "",
      contact_person: "",
      phone_number1: "",
      phone_number2: "",
      vendor_email: "",
      vendor_image: "",
      source_link: "",
      vendor_type: "local",
      address: "",
      city: "",
      country: "",
      payment_terms: "",
      notes: "",
    }
  });

  const steps = [
    { number: 1, title: "Basic Info", fields: ["vendor_id", "vendor_name", "contact_person", "vendor_email", "vendor_type"] },
    { number: 2, title: "Contact & Location", fields: ["phone_number1", "phone_number2", "address", "city", "country"] },
    { number: 3, title: "Additional Details", fields: ["source_link", "payment_terms", "notes"] },
  ];

  const validateStep = async () => {
    const currentFields = steps[currentStep - 1].fields;
    const isValid = await form.trigger(currentFields as any);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // --- Upload Images ---
  async function uploadAllImages(){
    const uploadUrls: string[] = [];
    for (const url of imageUrls){
      const imageFile = await convertBlobUrlToFile(url);
      const {imageUrl, error} = await uploadImage({
        file: imageFile,
        bucket: "images/profiles",
      });
      if(error) throw new Error(error.message);
      uploadUrls.push(imageUrl);
    }
    return uploadUrls;
  }

  // --- Submit function ---
  function onSubmit(data: z.infer<typeof FormSchema>){
    startTransition(async() => {
      try{
        const uploadUrls = await uploadAllImages();
        if(uploadUrls.length > 0){
          data.vendor_image = uploadUrls[0];
        }
        const result = await createVendor(data);
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        const { error } = parsed;
        if(error?.message){
          toast.error("Failed to create member!");
        }else{
          document.getElementById("vendor-trigger")?.click();
          toast.success("Vendor created successfully!");
          window.location.reload();
          form.reset();
          onSuccess?.();
          setImageUrls([]);
        }
      }catch(error: any){
        toast.error("Image upload failed", {
          description: error.message,
        })
      }
    })
  }

  return (
      <div className="max-w-4xl mx-auto">

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-12 h-12 text-sm rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                    currentStep > step.number 
                      ? "bg-amber-700 text-white" 
                      : currentStep === step.number 
                        ? "bg-yellow-100 text-amber-700 shadow-lg ring-4 ring-amber-100" 
                        : "bg-gray-200 text-gray-400"
                  )}>
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <span className={cn(
                    "text-sm mt-2 font-medium transition-colors",
                    currentStep >= step.number ? "text-gray-700" : "text-gray-400"
                  )}>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "h-1 flex-1 mx-4 rounded transition-colors duration-300",
                    currentStep > step.number ? "bg-amber-700" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="">
          <Form {...form}>
            <div className="space-y-4" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }}>
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <ProfileButton imageUrls={imageUrls} setImageUrls={setImageUrls}/>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="vendor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Vendor ID *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 001" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vendor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Vendor Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter vendor name" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Contact Person *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Full name of contact person" 
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="vendor_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="vendor@example.com" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vendor_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Vendor Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendorTypes.map((type) => (
                                <SelectItem key={type} value={type} className="capitalize">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact & Location */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone_number1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Primary Phone *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 234 567 8900" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Secondary Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Optional" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Street Address *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123 Main Street" 
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">City *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter city" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Country *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter country" 
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <FormField
                    control={form.control}
                    name="source_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Source Link</FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://vendor-website.com" 
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Payment Terms</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Net 30, Due on receipt" 
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional information about the vendor..."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-32 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={isPending}
                    className="gap-2 bg-amber-600 hover:bg-amber-700 min-w-32"
                  >
                    {isPending ? (
                      <>
                        <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Vendor
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </Form>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Fields marked with * are required</p>
        </div>
      </div>
  );
}