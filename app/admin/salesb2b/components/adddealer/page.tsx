"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addDealer } from "@/app/functions/admin/sale/dealer";
import { styledToast } from "@/app/components/toast";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { uploadImage } from "@/app/components/image/actions/upload";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CancelBtn, SubmitBtn } from "@/app/components/ui";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const FormSchema = z.object({
    business_name: z.string().min(1, "Business name is required"),
    dealer_name: z.string().min(1, "Dealer name is required"),
    nationalId: z.string().min(1, "National ID is required"),
    passportNumber: z.string().min(1, "Passport number is required"),
    contact_number: z.string().min(1, "Contact number is required"),
    email_address: z.string().min(1, "Email address is required").email("Invalid email format"),
    shop_address: z.string().min(1, "Shop address is required"),
    delivery_address: z.string().min(1, "Delivery address is required"),
    businesstype: z.enum(["retail", "wholesale", "mixed", "online"]),
});

export default function AddDealer() {
    const [isPending, startTransition] = useTransition();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const router = useRouter();

    const businesstype = ["retail", "wholesale", "mixed", "online"];

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            business_name: "",
            dealer_name: "",
            nationalId: "",
            passportNumber: "",
            contact_number: "",
            email_address: "",
            shop_address: "",
            delivery_address: "",
            businesstype: "retail",
        }
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        startTransition(async () => {
            try {
                const result = await addDealer(data);

                if (!result) {
                    console.error("Failed to create Dealer");
                    styledToast.error("Failed to create dealer");
                    return;
                }

                document.getElementById("create-dealer")?.click();
                styledToast.success("Create dealer successfully!");
                window.location.reload();
            } catch (error) {
                console.error("Error creating dealer:", error);
                styledToast.error("An error occurred while creating dealer");
            }
        })
    }

    return (
        <div className="w-full">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Form Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Add New Dealer</h2>
                        <p className="text-sm text-gray-500 mt-1">Fill in the dealer information below</p>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">

                        {/* Business Name */}
                        <FormField
                            control={form.control}
                            name="business_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Business Name <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter business name"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Dealer Name */}
                        <FormField
                            control={form.control}
                            name="dealer_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Dealer Name <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter dealer name"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* National ID */}
                        <FormField
                            control={form.control}
                            name="nationalId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        National ID <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter national ID"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Passport Number */}
                        <FormField
                            control={form.control}
                            name="passportNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Passport Number <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter passport number"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Contact Number */}
                        <FormField
                            control={form.control}
                            name="contact_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Contact Number <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="tel"
                                            placeholder="Enter contact number"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Email Address */}
                        <FormField
                            control={form.control}
                            name="email_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Email Address <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Shop Address */}
                        <FormField
                            control={form.control}
                            name="shop_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Business Address <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter business address"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Delivery Address */}
                        <FormField
                            control={form.control}
                            name="delivery_address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Delivery Address <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter delivery address"
                                            className="w-full"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Business Type */}
                        <FormField
                            control={form.control}
                            name="businesstype"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Business Type <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isPending}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select business type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {businesstype.map((type, index) => (
                                                    <SelectItem key={index} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage className="text-xs" />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-3 pt-6 border-t">
                        <Button
                            type="button"
                            onClick={() => router.push("/admin/salesb2b")}
                            className={CancelBtn}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className={SubmitBtn}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                                    Adding Dealer...
                                </>
                            ) : (
                                "Add Dealer"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}