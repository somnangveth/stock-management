'use client';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Categories } from "@/type/producttype";
import { useTransition } from "react";
import { updateCategory, fetchCategory } from "@/app/functions/admin/stock/category/category";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { btnStyle } from "@/app/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { buildCategoryTree, flattenCategoryTree, getCategoryDescendants } from "@/type/producttype";

const UpdateSchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
  slug: z.string().optional(),
  parent_id: z.string().nullable().optional(),
});

export default function UpdateCategory({ category }: { category: Categories }) {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      category_name: category.category_name,
      parent_id: category.parent_id || null,
    }
  });

  // Fetch all categories for parent selection
  const { data, isLoading } = useQuery({
    queryKey: ["categoryQuery"],
    queryFn: fetchCategory
  });

  const categoryData = data || [];

  // Flatten categories with indentation for display
  const flatCategories = flattenCategoryTree(buildCategoryTree(categoryData));

  // Filter out current category and its descendants (prevent circular reference)
  const availableParents = flatCategories.filter(cat => {
    const descendants = getCategoryDescendants(String(category.category_id), categoryData);
    return cat.category_id !== category.category_id && 
           !descendants.includes(String(cat.category_id));
  });

  function onSubmit(data: z.infer<typeof UpdateSchema>) {
    startTransition(async () => {
      try {
        const result = await updateCategory(String(category.category_id), data);
        
        if (!result) {
          toast.error('Failed to update Category');
          return;
        }
        
        toast.success('Category updated successfully!');
        document.getElementById('category-update-trigger')?.click();
        
        // Optional: Use router.refresh() instead of window.location.reload()
        // const router = useRouter();
        // router.refresh();
        window.location.reload();
      } catch (error: any) {
        console.error('Failed to update category', error);
        toast.error('Failed to update category', {
          description: error.message
        });
      }
    });
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Category Name */}
          <FormField
            control={form.control}
            name="category_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name:</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug:</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Parent Category */}
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category (Optional):</FormLabel>
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

          <Button
            type="submit"
            disabled={isPending}
            className={btnStyle}
          >
            {isPending ? (
              <AiOutlineLoading3Quarters className={cn("animate-spin")} />
            ) : (
              "Update Category"
            )}
          </Button>
        </form>
      </div>
    </Form>
  );
}

// ============================================
// ALTERNATIVE: Simpler version without parent selection
// ============================================
export function UpdateCategorySimple({ category }: { category: Categories }) {
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      category_name: category.category_name,
    }
  });

  function onSubmit(data: z.infer<typeof UpdateSchema>) {
    startTransition(async () => {
      try {
        await updateCategory(String(category.category_id), data);
        toast.success('Category updated successfully!');
        document.getElementById('category-update-trigger')?.click();
        window.location.reload();
      } catch (error: any) {
        console.error('Failed to update category', error);
        toast.error('Failed to update category', {
          description: error.message
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name:</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug:</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className={btnStyle}>
          {isPending ? (
            <AiOutlineLoading3Quarters className={cn("animate-spin")} />
          ) : (
            "Update Category"
          )}
        </Button>
      </form>
    </Form>
  );
}