"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, DollarSign, TrendingUp } from "lucide-react";
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
import { addSalePrice } from "@/app/functions/admin/price/price";
import { useQueries } from "@tanstack/react-query";
import { 
  fetchAttribute, 
  fetchImportPrice, 
  fetchProducts, 
  fetchSalePrice 
} from "@/app/functions/admin/api/controller";
import { styledToast } from "@/app/components/toast";
import SalePricePanel from "../salepricepanel";
import { useRouter } from "next/navigation";

const FormSchema = z.object({
  sales: z
    .array(
      z.object({
        product_id: z.string().min(1, "Product is required"),
        attribute_id: z.array(z.string()).min(1, "At least one attribute is required"),
        sale_price: z.array(
          z.object({
            attribute_id: z.string(),
            price_value: z.number().min(0, "Price must be positive"),
            price_variance: z.number().min(0, "Variance must be positive or zero"),
            attribute_value: z.number().min(1, "Quantity must be at least 1"),
          })
        ).min(1, "At least one sale price is required"),
      })
    )
    .min(1, "At least one product is required"),
});

interface SalePrice {
  attribute_id: string;
  attribute_name: string;
  module: string;
  price_value: number;
  price_variance: number;
  attribute_value: number;
  import_price?: number;
}

export default function CreateSalePrice() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [currentSaleIndex, setCurrentSaleIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sales: [
        {
          product_id: "",
          attribute_id: [],
          sale_price: [],
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

  // Filter products that don't have sale prices (where sale_price_id is null in import_price)
  const availableProducts = useMemo(() => {
    const productIdsWithoutSalePrice = new Set(
      importpriceQuery
        .filter((ip: any) => ip.sale_price_id === null)
        .map((ip: any) => ip.product_id)
    );

    return productQuery.filter((product: any) => 
      productIdsWithoutSalePrice.has(product.product_id)
    );
  }, [productQuery, importpriceQuery]);

  const sales = form.watch("sales");

  const handleAddSale = () => {
    const currentSales = form.getValues("sales");
    form.setValue("sales", [
      ...currentSales,
      {
        product_id: "",
        attribute_id: [],
        sale_price: [],
      },
    ]);
  };

  const handleRemoveSale = (index: number) => {
    const currentSales = form.getValues("sales");
    if (currentSales.length === 1) {
      toast.error("You must have at least one product");
      return;
    }
    form.setValue(
      "sales",
      currentSales.filter((_, i) => i !== index)
    );
  };

  const handleProductSelect = (saleIndex: number, productId: string) => {
    const product = productQuery.find((p: any) => p.product_id === productId);
    if (!product) return;

    // Set product_id
    form.setValue(`sales.${saleIndex}.product_id`, productId);

    // Get import prices for this product that don't have sale_price_id
    const productImportPrices = importpriceQuery.filter(
      (ip: any) => ip.product_id === productId && ip.sale_price_id === null
    );

    // Extract attribute IDs
    const attributeIds = productImportPrices.map((ip: any) => ip.attribute_id);
    form.setValue(`sales.${saleIndex}.attribute_id`, attributeIds);

    // Initialize sale_price array with default values including quantity from import_price
    const initialSalePrices = productImportPrices.map((ip: any) => ({
      attribute_id: ip.attribute_id,
      price_value: 0,
      price_variance: 0,
      attribute_value: ip.quantity || 1,
    }));

    form.setValue(`sales.${saleIndex}.sale_price`, initialSalePrices);
  };

  const handleOpenPricePanel = (saleIndex: number) => {
    const sale = form.getValues(`sales.${saleIndex}`);
    if (!sale.product_id) {
      toast.error("Please select a product first");
      return;
    }
    setCurrentSaleIndex(saleIndex);
    setShowPricePanel(true);
  };

  const handleSavePrices = (prices: SalePrice[]) => {
    if (currentSaleIndex === null) return;

    const formattedPrices = prices.map((price) => ({
      attribute_id: price.attribute_id,
      price_value: price.price_value,
      price_variance: price.price_variance,
      attribute_value: price.attribute_value,
    }));

    form.setValue(`sales.${currentSaleIndex}.sale_price`, formattedPrices);
    toast.success(`Updated ${prices.length} sale price(s)`);
  };

  const getAttributeName = (attributeId: string) => {
    const attr = attributeData.find((a: any) => a.attribute_id === attributeId);
    return attr ? `${attr.module}: ${attr.attribute_name}` : attributeId;
  };

  const getCurrentSalePrices = (): SalePrice[] => {
    if (currentSaleIndex === null) return [];

    const currentPrices = form.getValues(`sales.${currentSaleIndex}.sale_price`);
    const productId = form.getValues(`sales.${currentSaleIndex}.product_id`);

    return currentPrices.map((price) => {
      const attr = attributeData.find((a: any) => a.attribute_id === price.attribute_id);
      const importPrice = importpriceQuery.find(
        (ip: any) => ip.product_id === productId && ip.attribute_id === price.attribute_id
      );

      return {
        attribute_id: price.attribute_id,
        attribute_name: attr?.attribute_name || "",
        module: attr?.module || "",
        price_value: price.price_value,
        price_variance: price.price_variance,
        attribute_value: price.attribute_value || importPrice?.quantity || 1,
        import_price: importPrice?.price_value || 0,
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
        await addSalePrice(data.sales);
        styledToast.success(`Successfully added sale prices for ${data.sales.length} product(s)`);
        form.reset();
      } catch (error) {
        console.error(`An error occurred: ${error}`);
        toast.error("Failed to add sale prices");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="text-center">Loading products and prices...</div>
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

  if (availableProducts.length === 0) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Alert>
          <AlertDescription>
            No products available for sale price configuration. All products already have sale prices set.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <button
                        className="flex items-center gap-2"
                        onClick={() => router.back()}>
                        ← Back
                    </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-yellow-700 bg-clip-text text-transparent">
          Configure Sale Prices
        </h1>
        <p className="text-gray-600">
          Set retail prices for products and their variants
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {sales.map((sale, saleIndex) => (
            <Card key={saleIndex} className="relative border-2 border-amber-500 shadow-lg">
              <CardHeader className="pb-4 bg-yellow-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      Product {saleIndex + 1}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {sale.product_id
                        ? getProductName(sale.product_id)
                        : "Select a product"}
                    </CardDescription>
                  </div>
                  {sales.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveSale(saleIndex)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Product Selection */}
                <FormField
                  control={form.control}
                  name={`sales.${saleIndex}.product_id`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Select Product *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProductSelect(saleIndex, value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-2 border-yellow-200 hover:border-yellow-400 transition-colors">
                            <SelectValue placeholder="Choose a product without sale prices" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProducts.map((product: any) => (
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

                {/* Sale Prices Section */}
                <div className="border-t-2 border-yellow-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      Sale Pricing by Variant
                    </h3>
                    <Button
                      type="button"
                      onClick={() => handleOpenPricePanel(saleIndex)}
                      variant="outline"
                      className="gap-2 border-2 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-400 transition-all"
                      disabled={!sale.product_id}
                    >
                      <DollarSign className="w-4 h-4" />
                      {sale.sale_price.length > 0
                        ? `Edit Prices (${sale.sale_price.length})`
                        : "Configure Prices"}
                    </Button>
                  </div>

                  {!sale.product_id ? (
                    <Alert className="border-2 border-yellow-200 bg-yellow-50">
                      <AlertDescription>
                        Please select a product first to configure sale prices.
                      </AlertDescription>
                    </Alert>
                  ) : sale.sale_price.length === 0 ? (
                    <Alert className="border-2 border-amber-200 bg-amber-50">
                      <AlertDescription>
                        No sale prices configured yet. Click "Configure Prices" to set up pricing
                        for different variants.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {sale.sale_price.map((price, priceIndex) => {
                        const importPrice = importpriceQuery.find(
                          (ip: any) => ip.product_id === sale.product_id && ip.attribute_id === price.attribute_id
                        );
                        const margin = importPrice 
                          ? ((price.price_value - importPrice.price_value) / importPrice.price_value * 100).toFixed(1)
                          : 0;

                        return (
                          <div
                            key={priceIndex}
                            className="flex items-center justify-between p-4 border-2 border-yellow-100 rounded-lg bg-yellow-50 hover:border-yellow-300 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 bg-yellow-100 rounded-full text-xs font-medium text-amber-800">
                                {getAttributeName(price.attribute_id).split(":")[0]}
                              </div>
                              <span className="font-medium capitalize">
                                {getAttributeName(price.attribute_id).split(":")[1]}
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              {importPrice && (
                                <span className="text-sm text-gray-500">
                                  Cost: <span className="font-semibold">${importPrice.price_value}</span>
                                </span>
                              )}
                              <span className="text-sm text-gray-600">
                                Sale: <span className="font-bold text-yellow-700 text-base">${price.price_value}</span>
                              </span>
                              <span className="text-sm text-gray-600">
                                Variance: <span className="font-semibold">±${price.price_variance}</span>
                              </span>
                              {importPrice && (
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  Number(margin) > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {Number(margin) > 0 ? '+' : ''}{margin}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
              onClick={handleAddSale}
              className="flex-1 h-12 border-2 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-400 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Product
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className="flex-1 h-12 bg-amber-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {isPending ? "Saving..." : "Save Sale Prices"}
            </Button>
          </div>
        </div>
      </Form>

      {/* Sale Price Panel Modal */}
      {showPricePanel && currentSaleIndex !== null && (
        <SalePricePanel
          attribute={attributeData}
          onSave={handleSavePrices}
          onClose={() => {
            setShowPricePanel(false);
            setCurrentSaleIndex(null);
          }}
          initialPrices={getCurrentSalePrices()}
        />
      )}
    </div>
  );
}