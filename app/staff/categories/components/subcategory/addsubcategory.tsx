'use client';
import { addSubcategory } from "@/app/functions/admin/stock/category/subcategory";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Categories } from "@/type/producttype";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { btnStyle } from "@/app/components/ui";
import { Input } from "@/components/ui/input";
import { styledToast } from "@/app/components/toast";
import { Button } from "@/components/ui/button";

const FormSchema = z.object({
  category_id: z.string().min(1, "Please select a category"),
  subcategory_name: z.string().min(1, "Subcategory name is required").max(100, "Name too long"),
});

export default function AddSubcategory() {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category_id: "",
      subcategory_name: ""
    }
  });

  // Fetch Category
  async function fetchCategory() {
    const res = await fetch('/api/admin/fetchCategory');
    if (!res.ok) throw new Error('Failed to fetch category');
    const jsonData = await res.json();
    return jsonData;
  }

  // Query Category
  const { data, isLoading, error } = useQuery<{ categories: Categories[] }>({
    queryKey: ["categories"],
    queryFn: fetchCategory,
  });

  function onSubmit(formData: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      try {
        const result = await addSubcategory(formData);

        const res = typeof result === 'string' ? JSON.parse(result) : result;

        if (!res || res.error || !res.success) {
          styledToast.error(res?.error || "Failed to create subcategory");
          return;
        }

        toast.success("Create Subcategory Successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["subcategories"] });
        
        // Close dialog if exists
        document.getElementById('create-sub-trigger')?.click();
        
        // Reset form
        form.reset();
      } catch (error) {
        console.error('Failed to create Subcategory', error);
        toast.error("Failed to create subcategory");
      }
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">Loading Categories...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-red-500">Failed to load Categories: {error.message}</p>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">No data returned</p>
      </div>
    );
  }
  
  // Handle different possible response structures
  const categories = data.categories || (Array.isArray(data) ? data : []);
  
  // No categories available
  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">No categories available. Please create a category first.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.category_id} value={String(category.category_id)}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subcategory Name Input */}
        <FormField
          control={form.control}
          name="subcategory_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory Name</FormLabel>
              <FormControl>
                <Input
                  type="text" 
                  placeholder="Enter subcategory name" 
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending} 
          className={btnStyle}
        >
          {isPending ? "Creating..." : "Create Subcategory"}
        </Button>
      </form>
    </Form>
  );
}