"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { createNewCategory } from "@/app/functions/admin/stock/category/category";
import { toast } from "sonner";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { btnStyle, text } from "@/app/components/ui";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { fetchCategory } from "@/app/functions/admin/stock/category/category";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Categories, buildCategoryTree, flattenCategoryTree, getCategoryDescendants } from "@/type/producttype";

const FormSchema = z.object({
  category_name: z.string().min(1, "Category name is required."),
  parent_id: z.string().nullable().optional(),
});

export default function AddCategory({ editingCategory }: { editingCategory?: Categories }) {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category_name: editingCategory?.category_name || "",
      parent_id: editingCategory?.parent_id || null,
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ["categoryQuery"],
    queryFn: fetchCategory
  });

  const categoryData = data || [];

  // Flatten categories with indentation for display
  const flatCategories = flattenCategoryTree(buildCategoryTree(categoryData));

  // Filter out current category and its descendants (prevent circular reference)
  const availableParents = editingCategory
    ? flatCategories.filter(cat => {
        const descendants = getCategoryDescendants(String(editingCategory.category_id), categoryData);
        return cat.category_id !== editingCategory.category_id && 
               !descendants.includes(String(cat.category_id));
      })
    : flatCategories;

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      try {
        const result = await createNewCategory(data);
        
        toast.success("Category created successfully!");
        form.reset();
        document.getElementById("cat-trigger")?.click();
      } catch (error: any) {
        console.error("Error inserting category:", error);
        toast.error("Failed to create category", {
          description: error.message
        });
      }
    });
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="category_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={text}>Category Name</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={text}>Parent Category (Optional)</FormLabel>
                <FormControl>
                  <Select 
                    value={field.value || "none"} 
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading categories...
                        </SelectItem>
                      ) : (
                        availableParents.map((cat) => (
                          <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                            {"—".repeat(cat.level || 0)} {cat.category_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
        
        <button
          type="submit"
          disabled={isPending}
          className={btnStyle}
          onClick={form.handleSubmit(onSubmit)}
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