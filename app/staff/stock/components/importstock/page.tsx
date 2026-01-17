"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Package, Tag } from "lucide-react";
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
import { importStock } from "@/app/functions/admin/stock/product_batches/productbatches";
import { useQueries } from "@tanstack/react-query";
import { 
  fetchAttribute, 
  fetchImportPrice, 
  fetchProducts, 
  fetchSalePrice 
} from "@/app/functions/admin/api/controller";
import { styledToast } from "@/app/components/toast";
import AttributePanel from "./components/attributepanel";

const FormSchema = z.object({
  batches: z
    .array(
      z.object({
        product_id: z.string().min(1, "Product is required"),
        sku_code: z.string().min(1, "SKU code is required"),
        import_price: z.array(
          z.object({
            attribute_id: z.string(),
            quantity: z.number().min(1, "Quantity must be at least 1"),
            price_value: z.number().min(0, "Price must be positive"),
            product_image: z.string().optional(),
          })
        ).min(1, "At least one attribute is required"),
        import_date: z.string().min(1, "Import date is required"),
        total_quantity: z.number().min(1, "Total quantity must be at least 1"),
        units_per_package: z.number().optional(),
        package_type: z.string().optional(),
      })
    )
    .min(1, "At least one product batch is required"),
});

interface AttributePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  attribute_value: number;
  price_value: number;
  product_image: string;
}

export default function ImportStock() {
  const [isPending, startTransition] = useTransition();
  const [showAttributePanel, setShowAttributePanel] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      batches: [
        {
          product_id: "",
          sku_code: "",
          import_price: [],
          import_date: new Date().toISOString().split("T")[0],
          total_quantity: 1,
          units_per_package: 1,
          package_type: "",
        },
      ],
    },
  });

  const result = useQueries({
    queries: [
      {
        queryKey: ["productQuery"],
        queryFn: fetchProducts,
      },
      {
        queryKey: ["attributeQuery"],
        queryFn: fetchAttribute,
      },
      {
        queryKey: ["importpriceQuery"],
        queryFn: fetchImportPrice,
      },
      {
        queryKey: ["salepriceQuery"],
        queryFn: fetchSalePrice,
      },
    ],
  });

  const productQuery = result[0].data || [];
  const attributeData = result[1].data || [];
  const importpriceQuery = result[2].data || [];
  const salepriceQuery = result[3].data || [];
  const isLoading = result.some((r) => r.isLoading);
  const hasError = result.some((r) => r.error);

  const batches = form.watch("batches");

  const handleAddBatch = () => {
    const currentBatches = form.getValues("batches");
    form.setValue("batches", [
      ...currentBatches,
      {
        product_id: "",
        sku_code: "",
        import_price: [],
        import_date: new Date().toISOString().split("T")[0],
        total_quantity: 1,
        units_per_package: 1,
        package_type: "",
      },
    ]);
  };

  const handleRemoveBatch = (index: number) => {
    const currentBatches = form.getValues("batches");
    if (currentBatches.length === 1) {
      toast.error("You must have at least one product batch");
      return;
    }
    form.setValue(
      "batches",
      currentBatches.filter((_, i) => i !== index)
    );
  };

  const handleProductSelect = (batchIndex: number, productId: string) => {
    const product = productQuery.find((p: any) => p.product_id === productId);
    if (!product) return;

    // Set product_id and sku_code
    form.setValue(`batches.${batchIndex}.product_id`, productId);
    form.setValue(`batches.${batchIndex}.sku_code`, product.sku_code);

    // Load existing import prices for this product
    const existingPrices = importpriceQuery.filter(
      (ip: any) => ip.product_id === productId
    );

    const formattedPrices = existingPrices.map((price: any) => ({
      attribute_id: price.attribute_id,
      quantity: price.quantity || 1,
      price_value: price.price_value,
      product_image: price.product_image || "",
    }));

    form.setValue(`batches.${batchIndex}.import_price`, formattedPrices);
  };

  const handleOpenAttributePanel = (batchIndex: number) => {
    const batch = form.getValues(`batches.${batchIndex}`);
    if (!batch.product_id) {
      toast.error("Please select a product first");
      return;
    }
    setCurrentBatchIndex(batchIndex);
    setShowAttributePanel(true);
  };

  const handleSaveAttributes = (prices: AttributePrice[]) => {
    if (currentBatchIndex === null) return;

    // Convert attribute_value to quantity for the form schema
    const formattedPrices = prices.map((price) => ({
      attribute_id: price.attribute_id,
      quantity: price.attribute_value,
      price_value: price.price_value,
      product_image: price.product_image || "",
    }));

    form.setValue(`batches.${currentBatchIndex}.import_price`, formattedPrices);
    
    // Calculate total quantity from all attributes
    const totalQty = prices.reduce((sum, price) => sum + price.attribute_value, 0);
    form.setValue(`batches.${currentBatchIndex}.total_quantity`, totalQty);
    
    toast.success(`Updated ${prices.length} attribute(s)`);
  };

  const getAttributeName = (attributeId: string) => {
    const attr = attributeData.find((a: any) => a.attribute_id === attributeId);
    return attr ? `${attr.module}: ${attr.attribute_name}` : attributeId;
  };

  const getCurrentAttributePrices = (): AttributePrice[] => {
    if (currentBatchIndex === null) return [];

    const currentPrices = form.getValues(`batches.${currentBatchIndex}.import_price`);
    return currentPrices.map((price) => {
      const attr = attributeData.find((a: any) => a.attribute_id === price.attribute_id);
      return {
        attribute_id: price.attribute_id,
        attribute_name: attr?.attribute_name || "",
        module: attr?.module || "",
        attribute_value: price.quantity || 1,
        price_value: price.price_value,
        product_image: price.product_image || "",
      };
    });
  };

  const getProductName = (productId: string) => {
    const product = productQuery.find((p: any) => p.product_id === productId);
    return product?.product_name || "";
  };

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    startTransition(async () => {
      try {
        const result = await importStock(data.batches);

        if (result.success.length > 0) {
          styledToast.success(`Successfully imported stock for ${result.success.length} product(s)`);
        }

        if (result.failed.length > 0) {
          toast.error(`Failed to import ${result.failed.length} product(s)`);
          result.failed.forEach((failure: any) => {
            toast.error(`${failure.sku_code}: ${failure.error}`);
          });
        }

        // Reset form if all successful
        if (result.failed.length === 0) {
          form.reset();
        }
      } catch (error) {
        console.error(`An error occurred: ${error}`);
        toast.error("Failed to import stock");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="text-center">Loading products and attributes...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load data. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Stock</h1>
        <p className="text-gray-600">
          Add new inventory for existing products with batch tracking
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {batches.map((batch, batchIndex) => (
            <Card key={batchIndex} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Stock Batch {batchIndex + 1}
                    </CardTitle>
                    <CardDescription>
                      {batch.product_id
                        ? getProductName(batch.product_id)
                        : "Select a product"}
                    </CardDescription>
                  </div>
                  {batches.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBatch(batchIndex)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Selection */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.product_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Product *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleProductSelect(batchIndex, value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a product from inventory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productQuery.map((product: any) => (
                              <SelectItem
                                key={product.product_id}
                                value={product.product_id}
                              >
                                {product.product_name} ({product.sku_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SKU Code (Read-only) */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.sku_code`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Auto-filled from product"
                            {...field}
                            readOnly
                            className="bg-gray-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total Quantity (Calculated from attributes) */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.total_quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Calculated from attributes"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-gray-50"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Import Date */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.import_date`}
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

                  {/* Units Per Package */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.units_per_package`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units Per Package</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Package Type */}
                  <FormField
                    control={form.control}
                    name={`batches.${batchIndex}.package_type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Box, Pallet, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Attributes Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stock Attributes & Pricing</h3>
                    <Button
                      type="button"
                      onClick={() => handleOpenAttributePanel(batchIndex)}
                      variant="outline"
                      className="gap-2"
                      disabled={!batch.product_id}
                    >
                      <Tag className="w-4 h-4" />
                      {batch.import_price.length > 0
                        ? `Edit Attributes (${batch.import_price.length})`
                        : "Configure Attributes"}
                    </Button>
                  </div>

                  {!batch.product_id ? (
                    <Alert>
                      <AlertDescription>
                        Please select a product first to configure attributes and pricing.
                      </AlertDescription>
                    </Alert>
                  ) : batch.import_price.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No attributes configured yet. Click "Configure Attributes" to set up quantity
                        and pricing for different variants (e.g., sizes, colors, weights).
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {batch.import_price.map((price, priceIndex) => (
                        <div
                          key={priceIndex}
                          className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="px-2 py-1 bg-slate-200 rounded text-xs font-medium">
                              {getAttributeName(price.attribute_id).split(":")[0]}
                            </div>
                            <span className="font-medium capitalize">
                              {getAttributeName(price.attribute_id).split(":")[1]}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                              Qty: <span className="font-semibold">{price.quantity}</span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Price: <span className="font-semibold">${price.price_value}</span>
                            </span>
                            {price.product_image && (
                              <span className="text-xs text-green-600">📷 Image</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBatch}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Product Batch
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              {isPending ? "Importing..." : "Import Stock"}
            </Button>
          </div>
        </div>
      </Form>

      {/* Attribute Panel Modal */}
      {showAttributePanel && currentBatchIndex !== null && (
        <AttributePanel
          attribute={attributeData}
          initialPrices={getCurrentAttributePrices()}
          onSave={handleSaveAttributes}
          onClose={() => {
            setShowAttributePanel(false);
            setCurrentBatchIndex(null);
          }}
        />
      )}
    </div>
  );
}