"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Price, Product, ProductBatch, StockAlert, StockMovement } from "@/type/producttype";
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
}: {
  batch: ProductBatch;
  product: Product;
  stockAlert: StockAlert;
  price: Price
}) {
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      try {
        
        await addIssueProduct(batch.batch_id, product.product_id, stockAlert.stock_alert_id,price.price_id,values);
        styledToast.success("Issued product successfully");
        form.reset();
      } catch {
        styledToast.error("Failed to issue product");
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
                  onChange={(e) => {
  const val = parseInt(e.target.value);
  field.onChange(val > 0 ? val : 1); // default to 1 if empty/invalid
}}
                />
              </FormControl>
              <FormMessage />
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
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button disabled={isPending} type="submit" className={SubmitBtnFull}>
          {isPending ? "Processing..." : "Add Issue"}
        </Button>
      </form>
    </Form>
  );
}
