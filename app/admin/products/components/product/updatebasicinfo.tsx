"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Categories, Product, Vendors } from "@/type/producttype";
import { updateProductBasicInfo } from "@/app/functions/admin/stock/product/product";
import { deleteImage, uploadImage } from "@/app/components/image/actions/upload";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { styledToast } from "@/app/components/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import UploadImageButton from "@/app/components/image/components/imagebutton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitBtn } from "@/app/components/ui";
import { useQueryClient } from "@tanstack/react-query";

const UpdateSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  product_image: z.string().optional(),
  sku_code: z.string().min(1, "SKU code is required"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  package_type: z.enum(["box", "case"]),
});

type Props = {
  product: Product;
  categories?: Categories[];
  vendors?: Vendors[];
  onSuccess?: () => void;
};

export default function UpdateProductBasicInfo({
  product,
  categories,
  vendors,
  onSuccess,
}: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const safeCategories = categories ?? [];
  const safeVendors = vendors ?? [];

  // Debug: Log when component mounts
  useEffect(() => {
    console.log("🎯 UpdateProductBasicInfo mounted");
    console.log("📦 Product:", product);
    console.log("📂 Categories:", safeCategories);
  }, []);

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    mode: "onChange", // Enable validation on change
    defaultValues: {
      product_image: product.product_image || "",
      product_name: product.product_name || "",
      sku_code: product.sku_code || "",
      category_id: product.category_id ? String(product.category_id) : "",
      package_type: (product.package_type as "box" | "case") || "box", // Provide fallback
      description: product.description || "",
    },
  });

  useEffect(() => {
    if (product.product_image) {
      setImageUrls([product.product_image]);
    }
  }, [product.product_image]);

  async function uploadAllImages(oldImageUrl?: string) {
    if (imageUrls.length === 0) return oldImageUrl;

    const newImage = imageUrls[0];

    if (newImage === oldImageUrl) {
      return oldImageUrl;
    }

    try {
      if (newImage.startsWith('blob:')) {
        if (oldImageUrl) {
          await deleteImage({
            imageUrl: oldImageUrl,
            bucket: "images",
          });
        }

        const file = await convertBlobUrlToFile(newImage);

        const { imageUrl } = await uploadImage({
          file,
          bucket: "images",
        });

        return imageUrl;
      }

      return newImage;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  }

  async function onSubmit(data: z.infer<typeof UpdateSchema>) {
    console.log("🔥 Form submitted with data:", data);
    console.log("🔥 Product ID:", product.product_id);
    console.log("🔥 Form values:", form.getValues());
    console.log("🔥 Form errors:", form.formState.errors);
    
    startTransition(async () => {
      try {
        // Upload image first
        const newImageUrl = await uploadAllImages(product.product_image);
        console.log("✅ Image uploaded:", newImageUrl);

        // Prepare the update data
        const updateData = {
          ...data,
          product_image: newImageUrl,
        };
        
        console.log("🚀 Updating product with:", updateData);

        // Call the update function
        const result = await updateProductBasicInfo(product.product_id, updateData);
        
        console.log("✅ Update result:", result);

        // Invalidate queries to refetch updated data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["products"] }),
          queryClient.invalidateQueries({ queryKey: ["product-vendors"] }),
        ]);

        // Show success message
        styledToast.success("Product updated successfully!");
        
        // Close dialog - try callback first, then fallback to clicking
        if (onSuccess) {
          console.log("✅ Closing dialog via callback");
          onSuccess();
        } else {
          console.log("⚠️ No callback, trying to click close button");
          // Try both possible IDs
          const closeBtn = document.getElementById("update-product") || 
                          document.getElementById("update-trigger");
          if (closeBtn) {
            closeBtn.click();
          } else {
            console.error("❌ Close button not found!");
          }
        }
        
      } catch (error: any) {
        console.error("❌ Update error:", error);
        styledToast.error(error?.message || "Failed to update product");
      }
    });
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log("📝 Form onSubmit triggered");
          e.preventDefault();
          form.handleSubmit(onSubmit)(e);
        }} 
        className="space-y-4"
      >
        {/* Debug info */}
        <div className="p-2 bg-gray-100 rounded text-xs">
          <p>Product ID: {product.product_id}</p>
          <p>Form Valid: {form.formState.isValid ? "✅" : "❌"}</p>
          <p>Errors: {Object.keys(form.formState.errors).join(", ") || "None"}</p>
        </div>
        {/* Image */}
        <div className="flex justify-center">
          <UploadImageButton
            imageUrls={imageUrls}
            setImageUrls={setImageUrls}
          />
        </div>

        {/* Product Name */}
        <FormField
          control={form.control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SKU */}
        <FormField
          control={form.control}
          name="sku_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter SKU code" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.map((cat) => (
                    <SelectItem
                      key={cat.category_id}
                      value={String(cat.category_id)}
                    >
                      {cat.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Package Type */}
        <FormField
          control={form.control}
          name="package_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="case">Case</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className={SubmitBtn}
          disabled={isPending}
        >
          {isPending ? "Updating..." : "Update Product"}
        </Button>
      </form>
    </Form>
  );
}