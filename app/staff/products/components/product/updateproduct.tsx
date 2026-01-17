"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Categories, Product, Vendors } from "@/type/producttype";
import { updateProduct } from "@/app/functions/admin/stock/product/product";
import { deleteImage, uploadImage } from "@/app/components/image/actions/upload";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { styledToast } from "@/app/components/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";

const UpdateSchema = z.object({
  product_name: z.string().optional(),
  product_image: z.string().optional(),
  sku_code: z.string().optional(),
  category_id: z.string().optional(),
  vendor_id: z.array(z.string()).optional(),
  description: z.string().optional(),
  package_type: z.enum(["box", "case"]).optional(),
});

type Props = {
  product: Product;
  categories?: Categories[];
  vendors?: Vendors[];
};

export default function UpdateProductInfo({
  product,
  categories,
  vendors,
}: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const safeCategories = categories ?? [];
  const safeVendors = vendors ?? [];

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      product_image: product.product_image,
      product_name: product.product_name,
      sku_code: product.sku_code,
      category_id: product.category_id ? String(product.category_id) : "",
      vendor_id: product.vendor_id 
        ? (Array.isArray(product.vendor_id) 
            ? product.vendor_id.map(String) 
            : [String(product.vendor_id)])
        : [],
      package_type: product.package_type,
      description: product.description,
    },
  });

  useEffect(() => {
    if (product.product_image) {
      setImageUrls([product.product_image]);
    }
  }, [product.product_image]);

  /** Upload Image */
  async function uploadAllImages(oldImageUrl?: string) {
    if (imageUrls.length === 0) return oldImageUrl;

    const newImage = imageUrls[0];

    // If image unchanged → skip upload
    if (newImage === oldImageUrl) {
      return oldImageUrl;
    }

    try {
      // Only delete and upload if the image is a blob URL (new upload)
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
      return oldImageUrl;
    }
  }

  async function onSubmit(data: z.infer<typeof UpdateSchema>) {
    console.log("Form submitted with data:", data);
    
    startTransition(async () => {
      try {
        // Upload image first
        const newImageUrl = await uploadAllImages(product.product_image);
        console.log("Image uploaded:", newImageUrl);

        // Prepare the update data
        const updateData = {
          ...data,
          product_image: newImageUrl,
        };
        
        console.log("Updating product with:", updateData);

        // Call the update function - it returns the product directly, not a JSON string
        const result = await updateProduct(product.product_id, updateData);
        
        console.log("Update result:", result);

        // If we got here without an error being thrown, it was successful
        styledToast.success("Product updated successfully!");
        
        // Invalidate queries to refetch updated data
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        await queryClient.invalidateQueries({ queryKey: ["productVendors"] });
        
        // Close the dialog
        document.getElementById("update-product")?.click();
        
      } catch (error: any) {
        console.error("Update error:", error);
        styledToast.error(error?.message || "Failed to update product");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            </FormItem>
          )}
        />

        {/* Vendors - Multiple Selection with Checkboxes */}
        <FormField
          control={form.control}
          name="vendor_id"
          render={() => (
            <FormItem>
              <FormLabel>Vendors (Select multiple)</FormLabel>
              <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                {safeVendors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No vendors available</p>
                ) : (
                  safeVendors.map((vendor) => (
                    <FormField
                      key={vendor.vendor_id}
                      control={form.control}
                      name="vendor_id"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={vendor.vendor_id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(String(vendor.vendor_id))}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  const vendorIdStr = String(vendor.vendor_id);
                                  
                                  return checked
                                    ? field.onChange([...currentValue, vendorIdStr])
                                    : field.onChange(
                                        currentValue.filter(
                                          (value) => value !== vendorIdStr
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {vendor.vendor_name}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))
                )}
              </div>
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