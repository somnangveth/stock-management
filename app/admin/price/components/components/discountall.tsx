"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { addMultipleDiscounts } from "@/app/functions/admin/price/discount";
import { Price } from "@/type/producttype";
import { styledToast } from "@/app/components/toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SubmitBtn } from "@/app/components/ui";

const FormSchema = z.object({
  discount_percent: z.number().min(0, "Must be greater than or equal to 0").max(100, "Cannot exceed 100%"),
  start_date: z.date().min(1, "Start date is required"),
  end_date: z.date().min(1, "End date is required"),
});

type FormValues = z.infer<typeof FormSchema>;

export default function DiscountMultiple({ prices = [] }: { prices?: Price | Price[] }) {
  const [isPending, startTransition] = useTransition();
  
  const priceList: Price[] = Array.isArray(prices)
  ? prices
  : prices
  ? [prices]
  : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      discount_percent: 0,
    }
  });

  // Early return if no prices provided
  if (priceList.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No products selected. Please select products to add discount.</p>
      </div>
    );
  }

  // Validate that all prices have price_id
  const hasInvalidPrices = priceList.some(price => !price?.price_id);

  const onSubmit = (formData: FormValues) => {
    if (hasInvalidPrices) {
      styledToast.error("Some prices are missing IDs. Cannot add discount.");
      return;
    }

    startTransition(async () => {
      try {
        const dateStart = new Date(formData.start_date);
        const dateEnd = new Date(formData.end_date);

        // Process each price
        const promises = priceList.map(async (price) => {
          // Calculate discount_price for this product
          const discount_price = price.total_amount * (1 - formData.discount_percent / 100);
          
          const discountData = [{
            discount_percent: formData.discount_percent,
            start_date: dateStart,
            end_date: dateEnd,
            discount_price: discount_price,
          }];

          return await addMultipleDiscounts(price.price_id, discountData);
        });

        const results = await Promise.all(promises);
        
        if (results.some(result => !result)) {
          styledToast.error("Failed to add discount to some products!");
          return;
        }
        
        styledToast.success("Discounts added successfully to all products!");
        document.getElementById('add-discount')?.click();
        window.location.reload();
      } catch (error) {
        console.error("Error adding discounts:", error);
        styledToast.error("An error occurred!");
      }
    });
  };

  if (hasInvalidPrices) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: Some price information is incomplete. Cannot add discount.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-100 border border-amber-500 rounded-lg">
        <p className="text-sm text-blue-800">
          This discount will be applied to <strong>{priceList.length}</strong> product{priceList.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="discount_percent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Percentage (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter discount percentage"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending}
              className={SubmitBtn}
            >
              {isPending ? "Submitting..." : "Apply Discount to All Products"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}