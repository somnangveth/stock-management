"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Package, Tag, Grid3x3, Building2, AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { importProducts } from "@/app/functions/admin/stock/product/product";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAttribute,
  fetchCategory,
  fetchVendors
} from "@/app/functions/admin/api/controller";
import AttributePanel from "./components/attributepanel";
import { styledToast } from "@/app/components/toast";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { uploadImage } from "@/app/components/image/actions/upload";
import UploadImageButton from "@/app/components/image/components/imagebutton";

// Relaxed schema - validation happens in onSubmit
const FormSchema = z.object({
  products: z
    .array(
      z.object({
        product_name: z.string().min(1, "Product name is required"),
        slug: z.string().min(1, "Slug is required"),
        description: z.string().min(1, "Description is required"),
        sku_code: z.string().min(1, "SKU code is required"),
        category_id: z.string().min(1, "Category is required"),
        vendor_ids: z.array(z.number()),
        import_price: z.array(
          z.object({
            attribute_id: z.string(),
            quantity: z.number().min(1, "Quantity must be at least 1"),
            price_value: z.number().min(0, "Price must be positive"),
          })
        ),
        import_date: z.string().min(1, "Import date is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        units_per_package: z.number().optional(),
        package_type: z.string().optional(),
        minimum_stock_level: z.number().min(0, "Minimum stock level must be 0 or greater").optional(),
        product_image: z.string().optional(),
      })
    )
    .min(1, "At least one product is required"),
});

interface AttributePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  quantity: number;
  price_value: number;
}

interface Category {
  category_id: string;
  category_name: string;
  parent_id: string | null;
  path?: string;
}

interface Vendor {
  vendor_id: number;
  vendor_name: string;
}

export default function ImportNewProduct() {
  const [imageUrls, setImageUrls] = useState<{ [key: number]: string[] }>({});
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAttributePanel, setShowAttributePanel] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      products: [
        {
          product_name: "",
          slug: "",
          description: "",
          sku_code: "",
          category_id: "",
          vendor_ids: [],
          import_price: [],
          import_date: new Date().toISOString().split("T")[0],
          quantity: 1,
          units_per_package: 1,
          package_type: "box",
          minimum_stock_level: 0,
          product_image: "",
        },
      ],
    },
  });

  const { data: attributeData = [], isLoading: attributeLoading } = useQuery({
    queryKey: ["attributeData"],
    queryFn: fetchAttribute,
  });

  const { data: categoryData = [], isLoading: categoryLoading } = useQuery({
    queryKey: ["categoryData"],
    queryFn: fetchCategory,
  });

  const { data: vendorData = [], isLoading: vendorLoading } = useQuery({
    queryKey: ["vendorData"],
    queryFn: fetchVendors,
  });

  const products = form.watch("products");

  // Build category hierarchy for display
  const getCategoryPath = (categoryId: string): string => {
    const category = categoryData.find((c: Category) => c.category_id === categoryId);
    if (!category) return "";
    if (!category.parent_id) {
      return category.category_name;
    }
    const parentPath = getCategoryPath(category.parent_id);
    return parentPath ? `${parentPath} > ${category.category_name}` : category.category_name;
  };

  const handleAddProduct = () => {
    const currentProducts = form.getValues("products");
    form.setValue("products", [
      ...currentProducts,
      {
        product_name: "",
        slug: "",
        description: "",
        sku_code: "",
        category_id: "",
        vendor_ids: [],
        import_price: [],
        import_date: new Date().toISOString().split("T")[0],
        quantity: 1,
        units_per_package: 1,
        package_type: "box",
        minimum_stock_level: 0,
        product_image: "",
      },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    const currentProducts = form.getValues("products");
    if (currentProducts.length === 1) {
      toast.error("You must have at least one product");
      return;
    }
    
    // Clean up image URLs if exists
    if (imageUrls[index]) {
      imageUrls[index].forEach(url => URL.revokeObjectURL(url));
    }
    
    form.setValue(
      "products",
      currentProducts.filter((_, i) => i !== index)
    );
    
    // Re-index imageUrls
    const newImageUrls: { [key: number]: string[] } = {};
    Object.entries(imageUrls).forEach(([key, value]) => {
      const numKey = parseInt(key);
      if (numKey < index) {
        newImageUrls[numKey] = value;
      } else if (numKey > index) {
        newImageUrls[numKey - 1] = value;
      }
    });
    setImageUrls(newImageUrls);
  };

  const handleProductNameChange = (index: number, value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    form.setValue(`products.${index}.product_name`, value);
    form.setValue(`products.${index}.slug`, slug);
  };

  const handleOpenAttributePanel = (productIndex: number) => {
    setCurrentProductIndex(productIndex);
    setShowAttributePanel(true);
  };

  const handleSaveAttributes = (prices: AttributePrice[]) => {
    if (currentProductIndex === null) return;

    const formattedPrices = prices.map((price) => ({
      attribute_id: price.attribute_id,
      quantity: price.quantity,
      price_value: price.price_value,
    }));

    form.setValue(`products.${currentProductIndex}.import_price`, formattedPrices);
    toast.success(`Added ${prices.length} attribute(s) to product`);
  };

  const handleToggleVendor = (productIndex: number, vendorId: number) => {
    const currentVendors = form.getValues(`products.${productIndex}.vendor_ids`);
    const newVendors = currentVendors.includes(vendorId)
      ? currentVendors.filter((id) => id !== vendorId)
      : [...currentVendors, vendorId];

    form.setValue(`products.${productIndex}.vendor_ids`, newVendors);
  };

  const getAttributeName = (attributeId: string) => {
    const attr = attributeData.find((a: any) => a.attribute_id === attributeId);
    return attr ? `${attr.module}: ${attr.attribute_name}` : attributeId;
  };

  const getVendorName = (vendorId: number) => {
    const vendor = vendorData.find((v: Vendor) => v.vendor_id === vendorId);
    return vendor ? vendor.vendor_name : String(vendorId);
  };

  const getCurrentAttributePrices = (): AttributePrice[] => {
    if (currentProductIndex === null) return [];
    const currentPrices = form.getValues(`products.${currentProductIndex}.import_price`);
    return currentPrices.map((price) => {
      const attr = attributeData.find((a: any) => a.attribute_id === price.attribute_id);
      return {
        attribute_id: price.attribute_id,
        attribute_name: attr?.attribute_name || "",
        module: attr?.module || "",
        quantity: price.quantity || 1,
        price_value: price.price_value,
      };
    });
  };

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log("Form submitted with data:", data);

    // Custom validation for vendors and attributes
    const errors: string[] = [];
    data.products.forEach((product, index) => {
      if (!product.vendor_ids || product.vendor_ids.length === 0) {
        errors.push(`Product ${index + 1}: Please select at least one vendor`);
      }
      if (!product.import_price || product.import_price.length === 0) {
        errors.push(`Product ${index + 1}: Please add at least one attribute`);
      }
    });

    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      errors.forEach(error => toast.error(error));
      return;
    }

    startTransition(async () => {
      try {
        // Upload images for each product and map to ProductInput type
        const productsWithImages = await Promise.all(
          data.products.map(async (product, index) => {
            let uploadedImageUrl = product.product_image;
            
            if (imageUrls[index] && imageUrls[index].length > 0) {
              try {
                const file = await convertBlobUrlToFile(imageUrls[index][0]);
                const { imageUrl } = await uploadImage({
                  file,
                  bucket: "images/images",
                });
                uploadedImageUrl = imageUrl;
              } catch (error) {
                console.error(`Failed to upload image for product ${index}:`, error);
              }
            }
            
            // Map to ProductInput type with correct field names
            return {
              sku_code: product.sku_code,
              product_name: product.product_name,
              slug: product.slug,
              product_image: uploadedImageUrl,
              category_id: product.category_id,
              description: product.description,
              units_per_package: product.units_per_package,
              package_type: product.package_type,
              import_price: product.import_price.map(price => ({
                attribute_id: price.attribute_id,
                price_value: price.price_value,
                quantity: price.quantity,
              })),
              vendor_ids: product.vendor_ids,
              import_date: product.import_date,
              quantity: product.quantity,
              min_stock_level: product.minimum_stock_level || 0,
            };
          })
        );

        console.log("Calling importProducts...");
        const result = await importProducts(productsWithImages);
        console.log("Import result:", result);

        if (result.success.length > 0) {
          styledToast.success(`Successfully imported ${result.success.length} product(s)`);
        }

        if (result.failed.length > 0) {
          toast.error(`Failed to import ${result.failed.length} product(s)`);
          result.failed.forEach((failure) => {
            toast.error(`${failure.sku_code}: ${failure.error}`);
          });
        }

        // Reset form and redirect if all successful
        if (result.failed.length === 0) {
          // Clean up all image URLs
          Object.values(imageUrls).forEach(urls => {
            urls.forEach(url => URL.revokeObjectURL(url));
          });
          setImageUrls({});
          form.reset();
          
          // Navigate back to products page after successful import
          setTimeout(() => {
            router.push("/staff/products");
          }, 1500);
        }
      } catch (error) {
        console.error(`An error occurred:`, error);
        toast.error(`Failed to import products: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const isLoading = attributeLoading || categoryLoading || vendorLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Import New Products</h1>
          <p className="text-slate-600 mt-1">Add multiple products to your inventory</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {products.map((product, productIndex) => {
            const hasVendorError = product.vendor_ids.length === 0;
            const hasAttributeError = product.import_price.length === 0;
            const hasErrors = hasVendorError || hasAttributeError;

            return (
              <Card key={productIndex} className={`shadow-lg ${hasErrors ? 'border-red-300 border-2' : ''}`}>
                <CardHeader className="border-b bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                        {productIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Product {productIndex + 1}
                          {hasErrors && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {product.product_name || "Enter product details"}
                        </CardDescription>
                      </div>
                    </div>
                    {products.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveProduct(productIndex)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Product Image Upload */}
                  <div className="border-b pb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Product Image
                      </h3>
                    </div>

                    <UploadImageButton
                      imageUrls={imageUrls[productIndex] || []}
                      setImageUrls={(urls:any) => {
                        setImageUrls(prev => ({ ...prev, [productIndex]: urls }));
                        form.setValue(`products.${productIndex}.product_image`, urls[0] || "");
                      }}
                    />
                  </div>

                  {/* Basic Information */}
                  <div className="border-b pb-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Grid3x3 className="w-4 h-4 text-amber-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Basic Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.product_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) =>
                                  handleProductNameChange(productIndex, e.target.value)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.slug`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Slug *</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-slate-50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.sku_code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU Code *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.category_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categoryData.map((category: Category) => (
                                  <SelectItem key={category.category_id} value={category.category_id}>
                                    {getCategoryPath(category.category_id)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.minimum_stock_level`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Stock Level</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                placeholder="Alert threshold"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.import_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Import Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.units_per_package`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Units Per Package</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${productIndex}.package_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Package Type</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`products.${productIndex}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Vendor Selection */}
                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Vendors *
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Select one or more vendors for this product
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {vendorData.map((vendor: Vendor) => {
                        const isSelected = product.vendor_ids.includes(vendor.vendor_id);
                        return (
                          <div
                            key={vendor.vendor_id}
                            onClick={() => handleToggleVendor(productIndex, vendor.vendor_id)}
                            className={`
                              relative flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                              ${isSelected
                                ? "border-amber-500 bg-blue-50 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                              }
                            `}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                ${isSelected ? "border-amber-500 bg-amber-500" : "border-slate-300"}
                              `}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? "text-amber-900" : "text-slate-700"}`}>
                              {vendor.vendor_name}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {hasVendorError && (
                      <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          Please select at least one vendor for this product.
                        </AlertDescription>
                      </Alert>
                    )}

                    {product.vendor_ids.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-medium">{product.vendor_ids.length} vendor(s) selected:</span>
                        <span className="text-blue-600">
                          {product.vendor_ids.map(id => getVendorName(id)).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Attributes */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Tag className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                          Product Attributes *
                        </h3>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleOpenAttributePanel(productIndex)}
                        variant="outline"
                        className="gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                      >
                        <Tag className="w-4 h-4" />
                        {product.import_price.length > 0
                          ? `Edit Attributes (${product.import_price.length})`
                          : "Add Attributes"}
                      </Button>
                    </div>

                    {hasAttributeError ? (
                      <Alert variant="destructive" className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          Please add at least one attribute for this product. Click "Add Attributes" to configure quantity and pricing.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {product.import_price.map((price, priceIndex) => (
                          <div
                            key={priceIndex}
                            className="flex items-center justify-between p-3 border-2 border-purple-100 rounded-lg bg-purple-50/50 hover:border-purple-200 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="px-2.5 py-1 bg-purple-200 rounded-md text-xs font-semibold text-purple-900">
                                {getAttributeName(price.attribute_id).split(":")[0]}
                              </div>
                              <span className="font-medium text-slate-900 capitalize">
                                {getAttributeName(price.attribute_id).split(":")[1]}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-600">
                                Qty: <span className="font-semibold text-slate-900">{price.quantity}</span>
                              </span>
                              <span className="text-sm text-slate-600">
                                Price: <span className="font-semibold text-slate-900">${price.price_value}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddProduct}
              className="flex-1 border-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Product
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md"
            >
              {isPending ? "Importing..." : `Import ${products.length} Product${products.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </Form>

      {/* Attribute Panel Modal */}
      {showAttributePanel && (
        <AttributePanel
          attribute={attributeData}
          onSave={handleSaveAttributes}
          onClose={() => {
            setShowAttributePanel(false);
            setCurrentProductIndex(null);
          }}
        />
      )}
    </div>
  );
}