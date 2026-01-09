"use client";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { uploadImage } from "@/app/components/image/actions/upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createProduct, fetchVendors } from "@/app/functions/admin/stock/product/product";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import UploadImageButton from "@/app/components/image/components/imagebutton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { useQueries} from "@tanstack/react-query";
import { Categories, Subcategories } from "@/type/producttype";
import { ArrowLeft } from "lucide-react";
import { styledToast } from "@/app/components/toast";
import { fetchAttribute, fetchCategoryAndSubcategory } from "@/app/functions/admin/api/controller";
import { useRouter } from "next/navigation";
import VendorForm from "@/app/admin/vendors/components/vendorform";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CancelBtn, SubmitBtn } from "@/app/components/ui";
import { IsLoading, RetryButton } from "@/app/components/error/error";

const FormSchema = z.object({

  //Product Details
  sku_code: z.string().min(1, "SKU code is required"),
  product_name: z.string().min(1, "Product name is required"),
  product_image: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  product_location: z.string().min(1, "Product Location is required"),
  slug: z.string().min(1, "Slug is required"),
  category_id: z.string().min(1, "Category is required"),
  subcategory_id: z.string().min(1, "Subcategory is required"),
  vendor_id: z.string().min(1, "Vendor is required"),
  min_stock_level: z.number().min(0, "Must be 0 or greater"),
  max_stock_level: z.number().min(1, "Must be greater than 0"),
  units_per_package: z.number().min(1, "Must be at least 1"),
  package_type: z.enum(['box', 'case']),

  //Attributes
  attributes: z.array(z.object({
    attribute_id: z.string(),
    value: z.string(),
  })),

  //Price for B2C
  base_price: z.number().min(0, "Must be 0 or greater"),
  tax_amount: z.number().min(0, "Must be 0 or greater"),
  profit_price: z.number().min(0, "Must be 0 or greater"),
  shipping: z.number().min(0, "Must be 0 or greater"),
  total_amount: z.number().min(0, "Must be 0 or greater"),

  //Price for B2B
  base_price_b2b: z.number().min(0, "Must be 0 or greater"),
  tax_b2b: z.number().min(0, "Must be 0 or greater"),
  profit_price_b2b: z.number().min(0, "Must be 0 or greater"),
  shipping_b2b: z.number().min(0, "Must be 0 or greater"),
  b2b_price: z.number().min(0, "Must be 0 or greater"),

  //Batch Details
  batch_number: z.string().min(1, "Batch number is required"),
  manufacture_date: z.date(),
  expiry_date: z.date(),
  recieved_date: z.date(),
  note: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  packages_recieved: z.number().min(1, "Packages received must be at least 1"),
});

export default function CreateProduct({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [vendor, setVendor] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

    const result = useQueries({
    queries: [
      {
        queryKey: ["categories-subcategories"],
        queryFn: fetchCategoryAndSubcategory,
      },
      {
        queryKey: ["attributeQuery"],
        queryFn: fetchAttribute,
      }
    ]
  });

  const categorysubcategoryData = result[0].data;
  const attributeData = result[1].data ?? [];


  const attributesArray = Array.isArray(attributeData) ? attributeData : [];
  const defaultAttributes = useMemo(() => {
    return attributesArray.map(attr => ({
      attribute_id: attr.attribute_id,
      value: "",
    }));
  }, [attributesArray]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sku_code: "",
      product_name: "",
      product_image: "",
      description: "",
      slug: '',
      category_id: '',
      subcategory_id: '',
      vendor_id: '',
      min_stock_level: 0,
      max_stock_level: 0,
      units_per_package: 1,
      package_type: 'box',
      product_location: '',
      base_price: 0,
      tax_amount: 0,
      total_amount: 0,
      profit_price: 0,
      shipping: 0,
      b2b_price: 0,
      batch_number: "",
      note: "",
      quantity: 1,
      packages_recieved: 1,

      attributes:[],
    }
  });

  // Reset when async data is ready
useEffect(() => {
  if (attributesArray.length > 0) {
    form.reset({
      attributes: attributesArray.map(attr => ({
        attribute_id: attr.attribute_id,
        value: "",
      })),
    });
  }
}, [attributesArray]);


  //Styling
  const text = "text-sm text-gray-500";
  const line = <div className="flex-1 border-b border-gray-300"></div>;



  // Calculate total price for B2C
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const priceFields = ['base_price', 'tax_amount', 'profit_price', 'shipping', 'discount'];
      
      if (priceFields.includes(name as string)) {
        const base_price = value.base_price || 0;
        const tax_percent = value.tax_amount || 0;
        const profit_price = value.profit_price || 0;
        const shipping = value.shipping || 0;
        
        const subtotal = base_price + profit_price + shipping;
        const taxAmount = (subtotal * tax_percent) / 100;
        const totalBeforeDiscount = subtotal + taxAmount;
        const total = totalBeforeDiscount;
        
        form.setValue('total_amount', Math.max(0, total));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
  const subscription = form.watch((value, {name}) => {
    const priceFields = ['base_price_b2b', 'tax_b2b', 'profit_price_b2b', 'shipping_b2b', 'discount_price_b2b'];

    if(priceFields.includes(name as string)){
      // Fixed: Use B2B field values instead of B2C values
      const basePriceB2B = value.base_price_b2b || 0;
      const taxPercentB2B = value.tax_b2b || 0;
      const profitPriceB2B = value.profit_price_b2b || 0;
      const shippingB2B = value.shipping_b2b || 0;
      
      const subtotal = basePriceB2B + profitPriceB2B + shippingB2B;
      const taxAmount = (subtotal * taxPercentB2B) / 100;
      const totalBeforeDiscount = subtotal + taxAmount;
      const total = totalBeforeDiscount;
      
      form.setValue('b2b_price', Math.max(0, total));
    }
  });
  return () => subscription.unsubscribe();
}, [form]);

  // Calculate total quantity
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      const packageFields = ['units_per_package', 'packages_recieved'];
      
      if (packageFields.includes(name as string)) {
        const unitsPerPackage = value.units_per_package || 0;
        const packagesReceived = value.packages_recieved || 0;
        const totalQuantity = unitsPerPackage * packagesReceived;
        form.setValue('quantity', Math.max(0, totalQuantity));
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);


  const selectedCategoryId = form.watch('category_id');


  const isLoading = result[0].isLoading || result[1].isLoading;
  const error = result[0].error || result[1].error;

  const filteredSubcategories = categorysubcategoryData?.subcategories.filter(
    (sub:any) => String(sub.category_id) === String(selectedCategoryId),
  ) || [];

  useEffect(() => {
    form.setValue('subcategory_id', '');
  }, [selectedCategoryId, form]);

  useEffect(() => {
    async function loadVendors() {
      try {
        const vendorData = await fetchVendors();
        setVendor(vendorData);
      } catch (error) {
        console.error('Failed to fetch vendor data:', error);
        toast.error('Failed to load vendors');
      }
    }
    loadVendors();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <IsLoading/>
    </div>
  );
  
  if (error || !categorysubcategoryData) return (
    <RetryButton/>
  );

  async function uploadAllImages() {
    const uploadUrls: string[] = [];
    for (const url of imageUrls) {
      const imageFile = await convertBlobUrlToFile(url);
      const { imageUrl, error } = await uploadImage({
        file: imageFile,
        bucket: "images",
      });
      if (error) throw new Error(error.message);
      uploadUrls.push(imageUrl);
    }
    return uploadUrls;
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      try {
        const uploadUrls = await uploadAllImages();
        if (uploadUrls.length > 0) {
          data.product_image = uploadUrls[0];
        }
        const result = await createProduct(data);
        const parsed = typeof result === "string" ? JSON.parse(result) : result;
        const { error } = parsed;
        if (error?.message) {
          styledToast.error("Failed to create product", error.message);
        } else {
          document.getElementById("product-trigger")?.click();
          styledToast.success("Product added successfully!");
          form.reset();
          onSuccess?.();
          setImageUrls([]);
        }
      } catch (error: any) {
        toast.error("Failed to create product", {
          description: error.message,
        });
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => router.push("/admin/products")}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Products</span>
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-900">Create New Product</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Product Details */}
              <h2 className="flex items-center text-xl font-semibold mb-4">Product Details{line}</h2>

              {/* Product Image */}
              <div className="mb-4">
                <UploadImageButton imageUrls={imageUrls} setImageUrls={setImageUrls} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKU-Code */}
                <FormField
                  control={form.control}
                  name="sku_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="product-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorysubcategoryData?.categories.map((cat: Categories) => (
                              <SelectItem key={cat.category_id} value={String(cat.category_id)}>
                                {cat.category_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
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
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedCategoryId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSubcategories.map((sub: Subcategories) => (
                              <SelectItem key={sub.subcategory_id} value={String(sub.subcategory_id)}>
                                {sub.subcategory_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter product description" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <h2 className="flex items-center text-xl font-semibold mb-4">Attributes{line}</h2>
            {attributesArray.map((attribute, index) => {
              const name = `attributes.${index}.value` as const;

              // Determine if this should be a radio input
              if (attribute.attribute_name === "Size") {
                return (
                  <div key={attribute.attribute_id}>
                    <p className="font-medium">{attribute.attribute_name}</p>

                    <FormField
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <div className="flex gap-4">
                          {["S", "M", "L", "XL"].map((size) => (
                            <label key={size} className="flex items-center gap-2 cursor-pointer">
                             <input
                              type="checkbox"
                              className="hidden peer"
                              checked={field.value === size}
                              onChange={() => field.value === size ? field.onChange("") : field.onChange(size)}
                            />
                              <div
                              className="py-1 px-2 border border-gray-300 rounded-md peer-checked:bg-amber-700
                              peer-checked:border-amber-700 peer-checked:text-white hover:bg-amber-900 transition-colors duration-200">
                                {size}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                );
              }

              if (attribute.attribute_name === "Spicy Level") {
                return (
                  <div key={attribute.attribute_id}>
                    <p className="font-medium">{attribute.attribute_name}</p>

                    <FormField
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <div className="flex gap-4">
                          {["Low", "Medium", "Extreme"].map((level) => (
                            <label key={level}>
                              <input 
                              type="checkbox" 
                              className="hidden peer"
                              checked={field.value === level}
                              onChange={() => field.value === level ? field.onChange("") : field.onChange(level)}
                              />
                              <div className="px-2 py-1 border rounded-md border-gray-300 peer-checked:bg-amber-700 peer-checked:border-amber-700
                              peer-checked:text-white hover:bg-amber-900 transition-colors duration-200">
                                {level}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                );
              }
              
              return (
                <div key={attribute.attribute_id}
                className="">
                  <p className="font-medium">{attribute.attribute_name}</p>

                  <FormField
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <Input placeholder={`Enter ${attribute.attribute_name}`} {...field} />
                    )}
                  />
                </div>
              );
            })}



          {/* Vendor Details */}
              <h2 className="flex items-center text-xl font-semibold mb-4">Vendor Details{line}</h2>
              <div className="space-y-4">
                <VendorForm />
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendor.map((v) => (
                              <SelectItem key={v.vendor_id} value={String(v.vendor_id)}>
                                {v.vendor_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
          

          {/* Price Management */}
              <h2 className="flex items-center text-xl font-semibold mb-4">Price Management{line}</h2>
              <p className="font-semibold">B2C (Buyer to Customer)</p>
              {/* Price Management for B2C */}
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;

                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shipping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;

                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("")
                            }}
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Total Price:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    ${(form.watch('total_amount') || 0).toFixed(2)}
                  </span>
                </div>
              </div>


              {/* Price Management for B2B  */}
              <p className="font-semibold">B2B (Buyer to Buyer)</p>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="base_price_b2b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty input
                          if (val === "") {
                            field.onChange("");
                            return;
                          }
                    
                          const floatVal = parseFloat(val);
                          if (!isNaN(floatVal) && floatVal > 0) {
                            field.onChange(floatVal);
                          }else{
                            field.onChange("")
                          }
                        }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profit_price_b2b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }
                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shipping_b2b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }
                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_b2b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const floatVal = parseFloat(val);
                            if(!isNaN(floatVal) && floatVal > 0){
                              field.onChange(floatVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-700">Total Price:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    ${(form.watch('b2b_price') || 0).toFixed(2)}
                  </span>
                </div>
              </div>

          {/* Stock Details */}
              <h2 className="flex items-center text-xl font-semibold mb-4">Stock Details{line}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                <FormField
                  control={form.control}
                  name="product_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Shelf5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="package_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a value"/>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="case">Case</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_stock_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const IntVal = parseInt(val);
                            if(!isNaN(IntVal) && IntVal > 0){
                              field.onChange(IntVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_stock_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value === 0 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const IntVal = parseInt(val);
                            if(!isNaN(IntVal) && IntVal > 0){
                              field.onChange(IntVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

          {/* First Batch Details */}
              <h2 className="flex items-center text-xl font-semibold mb-4">First Batch Details{line}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="batch_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input placeholder="BATCH-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacture_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacture Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            fromYear={2000}
                            toYear={2030}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recieved_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            fromYear={2000}
                            toYear={2030}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            captionLayout="dropdown"
                            fromYear={2000}
                            toYear={2030}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="units_per_package"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units Per Package</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value === 1 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }

                            const IntVal = parseInt(val);
                            if(!isNaN(IntVal) && IntVal > 0){
                              field.onChange(IntVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packages_recieved"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packages Received</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value === 1 ? "" : field.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            if(val === ""){
                              field.onChange("");
                              return;
                            }
                            const IntVal = parseInt(val);
                            if(!isNaN(IntVal) && IntVal > 0){
                              field.onChange(IntVal);
                            }else{
                              field.onChange("");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled
                          className="bg-gray-100"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this batch..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <div className="flex w-full gap-2 justify-end">
            <Button
            onClick={() => router.push("/admin/products")}
            className={CancelBtn}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} 
            className={SubmitBtn}>
            {isPending ? (
              <>
                Creating Product <AiOutlineLoading3Quarters className="animate-spin mr-2"/>
              </>
            ) : (
              "Create Product"
            )}
          </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}