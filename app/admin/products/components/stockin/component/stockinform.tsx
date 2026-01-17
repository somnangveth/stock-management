"use client";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useTransition } from "react";
import { addStockInToStockAlert } from "@/app/functions/admin/stock/product_batches/productbatches";
import { ProductBatch } from "@/type/producttype";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SubmitBtnFull } from "@/app/components/ui";
import { styledToast } from "@/app/components/toast";

const StockInSchema = z.object({
  batch_number: z.string().min(1, "Batch number is required"),
  manufacture_date: z.date(),
  expiry_date: z.date(),
});

export default function AddStockInForm({ batch }: { batch: ProductBatch }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof StockInSchema>>({
    resolver: zodResolver(StockInSchema),
    defaultValues: {
      batch_number: batch.batch_number || "",
      manufacture_date: batch.manufacture_date ? new Date(batch.manufacture_date) : new Date(),
      expiry_date: batch.expiry_date ? new Date(batch.expiry_date) : new Date(),
    }
  });

  function onSubmit(data: z.infer<typeof StockInSchema>) {
    startTransition(async () => {
      try {
        const res = await addStockInToStockAlert(batch.batch_id, data);
        
        if (!res.success) {
          styledToast.error(res.error || "Failed to add stock");
          return;
        }
        
        styledToast.success("Stock added successfully");
        form.reset();
        window.location.reload();
      } catch (error) {
        console.error(error);
        styledToast.error("An error occurred");
      }
    });
  }

  const text = 'text-sm text-gray-500';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Batch Number */}
        <FormField
          control={form.control}
          name="batch_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={text}>Batch Number: </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Enter batch number"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Manufacture Date */}
        <FormField
          control={form.control}
          name="manufacture_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={text}>Manufacture Date: </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
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
            </FormItem>
          )}
        />

        {/* Expiry Date */}
        <FormField
          control={form.control}
          name="expiry_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className={text}>Expiry Date: </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
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
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className={SubmitBtnFull}>
            {isPending ? (
              <AiOutlineLoading3Quarters className={cn("animate-spin")} />
            ) : (
              <>Add to Stock</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}