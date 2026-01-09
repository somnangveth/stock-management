"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Categories, Product, Subcategories, Vendors } from "@/type/producttype";
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

const UpdateSchema = z.object({
  product_name: z.string().optional(),
  product_image: z.string().optional(),
  sku_code: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  vendor_id: z.string().optional(),
  description: z.string().optional(),
  package_type: z.enum(["box", "case"]).optional(),
});

type Props = {
  product: Product;
  categories?: Categories[];
  subcategories?: Subcategories[];
  vendors?: Vendors[];
};

export default function UpdateProductBasicInfo({
  product,
  categories,
  subcategories,
  vendors,
}: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const safeCategories = categories ?? [];
  const safeSubcategories = subcategories ?? [];
  const safeVendors = vendors ?? [];

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      product_image: product.product_image,
      product_name: product.product_name,
      sku_code: product.sku_code,
      category_id: product.category_id
        ? String(product.category_id)
        : "",
      subcategory_id: product.subcategory_id
        ? String(product.subcategory_id)
        : "",
      vendor_id: product.vendor_id ? String(product.vendor_id) : "",
      package_type: product.package_type,
      description: product.description,
    },
  });

  const selectedCategoryId = form.watch("category_id");

  useEffect(() => {
  if (product.product_image) {
    setImageUrls([product.product_image]);
  }
}, [product.product_image]);


  useEffect(() => {
    if (
      selectedCategoryId &&
      selectedCategoryId !== String(product.category_id)
    ) {
      form.setValue("subcategory_id", "");
    }
  }, [selectedCategoryId, product.category_id, form]);

  /** Filter subcategories safely */
  const filteredSubcategories = safeSubcategories.filter(
    (sub) => String(sub.category_id) === String(selectedCategoryId)
  );

  /** Upload Image */
  async function uploadAllImages(oldImageUrl?: string) {
    if (imageUrls.length === 0) return oldImageUrl;

    const newImage = imageUrls[0];

  // If image unchanged → skip upload
  if (newImage === oldImageUrl) {
    return oldImageUrl;
  }

    try {
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

    } catch (error) {
      console.error(error);
      return oldImageUrl;
    }
  }

  function onSubmit(data: z.infer<typeof UpdateSchema>) {
    startTransition(async () => {
      try {
        const newImageUrl = await uploadAllImages(
  product.product_image
);


        const result = JSON.parse(
          await updateProduct(product.product_id, {
            ...data,
            product_image: newImageUrl,
          })
        );

        if (result?.error) {
          styledToast.error("Failed to update product");
          return;
        }

        styledToast.success("Product updated successfully!");
        document.getElementById("update-product")?.click();
      } catch (error) {
        console.error(error);
        styledToast.error("Something went wrong");
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
                <Input {...field} />
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
                <Input {...field} />
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

        {/* Subcategory */}
        <FormField
          control={form.control}
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategory</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubcategories.map((sub) => (
                    <SelectItem
                      key={sub.subcategory_id}
                      value={String(sub.subcategory_id)}
                    >
                      {sub.subcategory_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Vendor */}
        <FormField
          control={form.control}
          name="vendor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {safeVendors.map((v) => (
                    <SelectItem
                      key={v.vendor_id}
                      value={String(v.vendor_id)}
                    >
                      {v.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className={SubmitBtn}>
          {isPending ? "Updating..." : "Update"}
        </Button>
      </form>
    </Form>
  );
}
