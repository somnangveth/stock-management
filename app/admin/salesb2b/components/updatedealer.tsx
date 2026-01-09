"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { updateDealer } from "@/app/functions/admin/sale/dealer";
import { fetchDealers } from "@/app/functions/admin/api/controller";
import { styledToast } from "@/app/components/toast";

import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { deleteImage, uploadImage } from "@/app/components/image/actions/upload";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { CancelBtn, SubmitBtn } from "@/app/components/ui";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Dealer } from "@/type/membertype";
import ProfileButton from "@/app/components/image/components/profilebutton";


const FormSchema = z.object({
  business_name: z.string().optional(),
  dealer_name: z.string().optional(),
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  contact_number: z.string().optional(),
  email_address: z.string().optional(),
  shop_address: z.string().optional(),
  delivery_address: z.string().optional(),
  businesstype: z.enum(["retail", "wholesale", "mixed", "online"]).optional(),
});

export default function UpdateDealer({ dealer }: { dealer: Dealer }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const businessTypes = ["retail", "wholesale", "mixed", "online"];


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      business_name: dealer.business_name,
      dealer_name: dealer.dealer_name,
      nationalId: dealer.nationalid,
      passportNumber: dealer.passportnumber,
      contact_number: dealer.contact_number,
      email_address: dealer.email_address,
      shop_address: dealer.shop_address,
      delivery_address: dealer.delivery_address,
      businesstype: dealer.businesstype,
    },
  });

  useEffect(() => {
    if (!dealer) return;

    form.reset({
      business_name: dealer.business_name ?? "",
      dealer_name: dealer.dealer_name ?? "",
      nationalId: dealer.nationalid ?? "",
      passportNumber: dealer.passportnumber ?? "",
      contact_number: dealer.contact_number ?? "",
      email_address: dealer.email_address ?? "",
      shop_address: dealer.shop_address ?? "",
      delivery_address: dealer.delivery_address ?? "",
      businesstype: dealer.businesstype ?? undefined,
    });
  }, [dealer, form]);



  async function uploadAllImage(oldImageUrl?: string) {
    if (imageUrls.length === 0) return oldImageUrl;

    if (oldImageUrl) {
      await deleteImage({
        imageUrl: oldImageUrl,
        bucket: "images/profiles",
      });
    }

    const file = await convertBlobUrlToFile(imageUrls[0]);
    const { imageUrl, error } = await uploadImage({
      file,
      bucket: "images/profiles",
    });

    if (error) throw new Error("Image upload failed");
    return imageUrl;
  }


  function onSubmit(values: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      try {
        const profile_image = await uploadAllImage(dealer.profile_image);

        const payload = {
          ...values,
          profile_image,
        };

        await updateDealer(dealer.dealer_id, payload);
        document.getElementById('update-dealer')?.click();
        styledToast.success("Dealer updated successfully");
        router.refresh();
      } catch (error) {
        console.error(error);
        styledToast.error("Failed to update dealer");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <h2 className="text-2xl font-semibold">Update Dealer Information</h2>

        <ProfileButton imageUrls={imageUrls} setImageUrls={setImageUrls}/>

        <div className="grid grid-cols-2 gap-6">

          {[
            ["business_name", "Business Name"],
            ["dealer_name", "Dealer Name"],
            ["nationalId", "National ID"],
            ["passportNumber", "Passport Number"],
            ["contact_number", "Contact Number"],
            ["email_address", "Email Address"],
            ["shop_address", "Business Address"],
            ["delivery_address", "Delivery Address"],
          ].map(([name, label]) => (
            <FormField
              key={name}
              control={form.control}
              name={name as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="businesstype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            onClick={() => router.push("/admin/salesb2b")}
            className={CancelBtn}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button type="submit" className={SubmitBtn} disabled={isPending}>
            {isPending ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Update Dealer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
