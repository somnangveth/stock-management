"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { addCategory } from "@/app/functions/admin/stock/category/category";
import { toast } from "sonner";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { btnStyle } from "@/app/components/ui";
import { Input } from "@/components/ui/input";

// ---------------------
// Zod Schema
// ---------------------
const FormSchema = z.object({
  category_name: z.string().min(1, "Category name is required."),
  slug: z.string().min(1, "Slug is required.")
});

export default function AddCategory() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category_name: "",
      slug: ""
    }
  });

  // ---------------------
  // Submit Handler
  // ---------------------
  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      try {
        const result = await addCategory(data);

        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        const  error  = parsed;

        if (error?.message) {
          toast.error("Failed to create category", {
            description: error.message
          });
          return;
        }

        document.getElementById("cat-trigger")?.click();

        toast.success("Category created successfully!");
        form.reset();
      } catch (error) {
        console.error("Error inserting category:", error);
        toast.error("Failed to create category");
      }
    });
  }

  return (
    <Form {...form}>
      <div className="space-y-4">

        <FormField
          control={form.control}
          name="category_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <input
                  type="text"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <button
          type="submit"
          onClick={() => form.handleSubmit(onSubmit)}
          disabled={isPending}
          className={btnStyle}
        >
          {isPending ? (
            <AiOutlineLoading3Quarters className={cn("animate-spin")} />
          ) : (
            "Create Category"
          )}
        </button>
      </div>
    </Form>
  );
}
