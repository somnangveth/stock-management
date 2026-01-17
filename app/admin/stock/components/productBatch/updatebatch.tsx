"use client";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useTransition } from "react";
import { updateBatch } from "@/app/functions/admin/stock/product_batches/productbatches";
import { Product, ProductBatch } from "@/type/producttype";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SubmitBtnFull } from "@/app/components/ui";
import { styledToast } from "@/app/components/toast";

const UpdateSchema = z.object({
  batch_number: z.string(),
  manufacture_date: z.date(),
  expiry_date: z.date(),
  recieved_date: z.date(),
  note: z.string(),
  quantity: z.number(),
  packages_recieved: z.number(),
  units_per_package: z.number(),
})

export default function UpdateBatch({
  onSuccess, 
  product, 
  batch
}: {
  onSuccess?: () => void, 
  product: Product, 
  batch: ProductBatch
}) {
  const [isPending, startTransition] = useTransition();
  
  function onSubmit(data: z.infer<typeof UpdateSchema>) {
    startTransition(async() => {
      try {
        const res = await updateBatch(String(product.product_id), batch.batch_id, data);
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        const result = parsed;
        
        if (result.error) {
          styledToast.error("Failed to update batch");
          console.error("Failed to update product batch");
        } else {
          styledToast.success("Update batch successfully");
          console.log('Update batches successfully');
          document.getElementById('update-batch')?.click();
          form.reset();
          window.location.reload();
        }
      } catch(error) {
        console.error(JSON.stringify(error));
        styledToast.error("An error occurred");
      }
    })
  }

  // Styling 
  const text = 'text-sm text-gray-500';

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      batch_number: batch.batch_number || "",
      note: batch.note || "",
      quantity: batch.quantity || 0,
      packages_recieved: batch.packages_recieved || 0,
      units_per_package: batch.units_per_package || 0,
      manufacture_date: batch.manufacture_date ? new Date(batch.manufacture_date) : new Date(),
      expiry_date: batch.expiry_date ? new Date(batch.expiry_date) : new Date(),
      recieved_date: batch.received_date ? new Date(batch.received_date) : new Date(),
    }
  });

  useEffect(() => {
    const subscription = form.watch((value, {name}) => {
      const quantityFields = ["packages_recieved", "units_per_package"];
      if (quantityFields.includes(name as string)) {
        const packages = value.packages_recieved || 0;
        const units = value.units_per_package || 0;
        const totalQuantity = packages * units;
        form.setValue('quantity', totalQuantity);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4">
        
        <div className="flex gap-2">
          {/* Batch Number */}
          <FormField
            control={form.control}
            name="batch_number"
            render={({field}) => (
              <FormItem>
                <FormLabel className={text}>Batch Number: </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

        </div>

        {/* Manufacture Date & Expiry Date & Received Date */}
        <div className="space-y-4">
          {/* Manufacture Date */}
          <FormField
            control={form.control}
            name="manufacture_date"
            render={({field}) => (
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
            render={({field}) => (
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

          {/* Received Date */}
          <FormField
            control={form.control}
            name="recieved_date"
            render={({field}) => (
              <FormItem className="flex flex-col">
                <FormLabel className={text}>Received Date:</FormLabel>
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
        </div>

        {/* Quantity & Package Received & units_per_package */}
        <div className="flex gap-2">
          {/* Package Received */}
          <FormField
            control={form.control}
            name="packages_recieved"
            render={({field}) => (
              <FormItem>
                <FormLabel className={text}>Packages Received: </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Units Per Package */}
          <FormField
            control={form.control}
            name="units_per_package"
            render={({field}) => (
              <FormItem>
                <FormLabel className={text}>Units per package: </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Quantity */}
        <FormField
          control={form.control}
          name="quantity"
          render={({field}) => (
            <FormItem>
              <FormLabel className={text}>Quantity: </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value || 0}
                  disabled
                  className="bg-gray-100"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Note */}
        <FormField
          control={form.control}
          name="note"
          render={({field}) => (
            <FormItem>
              <FormLabel className={text}>Note: </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className={SubmitBtnFull}>
            {isPending ? (
              <AiOutlineLoading3Quarters className={cn("animate-spin")}/>
            ) : (
              <>Update Batch</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}