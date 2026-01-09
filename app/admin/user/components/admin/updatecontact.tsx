"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateContact } from "../../actions";
import { useRouter } from "next/navigation";
import { SubmitBtnFull } from "@/app/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contact } from "@/type/membertype";

// =====================
// Zod schema must match form fields
// =====================
const UpdateSchema = z.object({
  primary_email_address: z.string().email(),
  personal_email_address: z.string().email().optional(),
  primary_phone_number: z.string(),
});

export default function UpdateContact({ contact }: { contact: Contact }) {
  if (!contact) return null;

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      primary_email_address: contact.primary_email_address || "",
      personal_email_address: contact.personal_email_address || "",
      primary_phone_number: contact.primary_phone_number || "",
    },
  });

  async function onSubmit(data: z.infer<typeof UpdateSchema>) {
    startTransition(async () => {
      try {
        const result = await updateContact(contact.contact_id, data);

        if (!result) {
          console.log("Failed to update!");
        }

        toast.success("Contact updated successfully!");
        document.getElementById('update-contact')?.click();
        router.refresh();
      } catch (error: any) {
        console.error("Update error:", error);
        toast.error("Failed to update: " + error.message);
      }
    });
  }

  const genders = ["Male", "Female"];
  const marital_status = ["Single", "Married", "Divorced", "Widowed"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Primary Email */}
        <FormField
          control={form.control}
          name="primary_email_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Email Address</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Primary Email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Personal Email */}
        <FormField
          control={form.control}
          name="personal_email_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Email Address</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Personal Email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Phone */}
        <FormField
          control={form.control}
          name="primary_phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Phone Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Primary Phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isPending} className={SubmitBtnFull}>
          {isPending ? "Updating..." : "Update Contact"}
        </Button>
      </form>
    </Form>
  );
}
