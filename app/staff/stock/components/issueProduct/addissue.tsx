"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useMemo } from "react";
import { Price, Product, ProductBatch, StockAlert } from "@/type/producttype";
import { useForm } from "react-hook-form";
import { addIssueProduct } from "@/app/functions/admin/stock/stockalert/issueproduct";
import { styledToast } from "@/app/components/toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitBtnFull } from "@/app/components/ui";

const FormSchema = z.object({
  stock_alert_id: z.string(),
  product_id: z.string(),
  movement_type: z.enum(["return", "damage", "adjustment"]),
  quantity: z.number().int().positive(),
  notes: z.string().min(1),
});

export default function AddIssueProduct({
  batch,
  product,
  stockAlert,
  price,
  onSuccess,
}: {
  batch: ProductBatch;
  product: Product;
  stockAlert: StockAlert;
  price: Price[];
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  
  // Find the import price - first try batch-specific, then fall back to product-level
  const importPrice = useMemo(() => {
    if (!price || price.length === 0) return null;
    
    // First, try to find a price specifically for this batch
    const batchPrice = price.find((p: any) => p.batch_id === batch.batch_id);
    if (batchPrice) return batchPrice;
    
    // If no batch-specific price, find a product-level price (batch_id is null)
    const productPrice = price.find((p: any) => 
      p.product_id === product.product_id && p.batch_id === null
    );
    return productPrice || null;
  }, [price, batch.batch_id, product.product_id]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      movement_type: "return",
      quantity: 1,
      notes: "",
      stock_alert_id: stockAlert.stock_alert_id,
      product_id: product.product_id,
    },
  });

  function onSubmit(values: z.infer<typeof FormSchema>) {
    if (!importPrice?.price_id) {
      styledToast.error("This batch has no import price assigned");
      return;
    }

    startTransition(async () => {
      try {
        await addIssueProduct(
          batch.batch_id,
          product.product_id,
          stockAlert.stock_alert_id,
          importPrice.price_id, 
          values
        );
        styledToast.success("Issued product successfully");
        form.reset();
        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to issue product";
        styledToast.error(errorMessage);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={batch.quantity_remaining || undefined}
                  value={field.value}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    field.onChange(val > 0 ? val : 1);
                  }}
                />
              </FormControl>
              <FormMessage />
              {batch.quantity_remaining && (
                <p className="text-xs text-gray-500">
                  Available: {batch.quantity_remaining} units
                </p>
              )}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="movement_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Movement Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="damage">Damage</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter reason for this movement" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {importPrice ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            Import Price: <span className="font-semibold">${importPrice.price_value}</span>
            {importPrice.batch_id === null && (
              <span className="text-xs text-gray-500 ml-2">(Product-level price)</span>
            )}
          </div>
        ) : (
          <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
            No import price assigned to this batch or product
          </div>
        )}
        
        <Button 
          disabled={isPending || !importPrice} 
          type="submit" 
          className={SubmitBtnFull}
        >
          {isPending ? "Processing..." : "Add Issue"}
        </Button>
      </form>
    </Form>
  );
}