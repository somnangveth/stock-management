"use client";

import { useEffect, useTransition } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { disposeExpiredBatches } from "@/app/functions/admin/stock/expiry/expiry";
import { styledToast } from "@/app/components/toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ExpiredProductDisposal } from "@/type/producttype";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { SubmitBtn } from "@/app/components/ui";

const FormSchema = z.object({
    batch_number: z.string(),
    product_id: z.string(),
    quantity_disposed: z.number().min(1, "Quantity must be at least 1"),
    disposal_date: z.date(),
    base_price: z.number(),
    disposal_method: z.enum(["trash","return_supplier","donation","other"]),
    cost_loss: z.number().min(0),
    reason: z.string().min(1, "Reason is required"),
})

export default function DisposeForm({dispose}:{dispose: any}){
    const [isPending, startTransition] = useTransition();

    const maxQuantity = dispose.quantity_remaining || 0;
    const basePrice = dispose.base_price || dispose.price || 0;

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            batch_number: dispose.batch_number || "N/A",
            product_id: dispose.product_id || "",
            quantity_disposed: maxQuantity,
            disposal_method: "trash",
            base_price: basePrice,
            cost_loss: maxQuantity * basePrice, // Calculate immediately
            reason: "",
            disposal_date: new Date(),
        }
    });

    //Auto Calculating Cost Loss whenever quantity changes
    useEffect(() => {
        const subscription = form.watch((value, {name}) => {
            if(name === "quantity_disposed"){
                const quantity = value.quantity_disposed || 0;
                const price = value.base_price || 0;
                const calculatedLoss = quantity * price;
                form.setValue("cost_loss", calculatedLoss);
            }
        });

        return () => subscription.unsubscribe();
    }, [form]);

    function onSubmit(data: z.infer<typeof FormSchema>){
        // Validate quantity doesn't exceed available
        if(data.quantity_disposed > maxQuantity){
            styledToast.error(`Quantity cannot exceed ${maxQuantity}`);
            return;
        }

        startTransition(async() => {
            try{
                const result = await disposeExpiredBatches(dispose.batch_id, dispose.product_id, data);

                if(!result){
                    console.error("Failed to insert into disposeBatch");
                    styledToast.error("Failed to Dispose");
                    return;
                }

                styledToast.success("Disposed Successfully!");
                document.getElementById("add-disposed")?.click();
                window.location.reload();
            }catch(error){
                console.error(error);
                styledToast.error("An error occurred!");
            }
        })
    }

    return(
        <Form {...form}>
            <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4">

                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Product:</strong> {dispose.product_name || "Unknown"}</p>
                    <p className="text-sm"><strong>Batch:</strong> {dispose.batch_number || "N/A"}</p>
                    <p className="text-sm"><strong>Available Quantity:</strong> {maxQuantity}</p>
                </div>

                <FormField
                control={form.control}
                name="quantity_disposed"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Disposed Quantity (Max: {maxQuantity})</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            min={1}
                            max={maxQuantity}
                            value={field.value || ""}
                            onChange={(e) => {
                                const value = e.target.value === "" ? 0 : Number(e.target.value);
                                field.onChange(value);
                            }}/>
                        </FormControl>
                    </FormItem>
                )}/>

                <FormField
                control={form.control}
                name="base_price"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Base Price (per unit)</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || 0}
                            disabled
                            className="bg-gray-100"/>
                        </FormControl>
                    </FormItem>
                )}/>

                <FormField
                control={form.control}
                name="cost_loss"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Total Cost Loss</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value || 0}
                            disabled
                            className="bg-gray-100"/>
                        </FormControl>
                    </FormItem>
                )}/>

                <FormField
                control={form.control}
                name="disposal_date"
                render={({field}) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Disposal Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
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
                                initialFocus/>
                            </PopoverContent>
                        </Popover>
                    </FormItem>
                )}/>

                <FormField
                control={form.control}
                name="disposal_method"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Disposal Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select disposal method" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="trash">Trash</SelectItem>
                                <SelectItem value="return_supplier">Return to Supplier</SelectItem>
                                <SelectItem value="donation">Donation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}/>

                <FormField
                control={form.control}
                name="reason"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                            <Input
                            type="text"
                            placeholder="Enter disposal reason"
                            {...field}/>
                        </FormControl>
                    </FormItem>
                )}/>

                <Button
                type="submit"
                disabled={isPending} 
                className={SubmitBtn}>
                    {isPending ? "Disposing..." : "Submit Disposal"}
                </Button>
            </form>
        </Form>
    )
}